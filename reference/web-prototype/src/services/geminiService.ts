import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse, Type, ThinkingLevel, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getIngredientMapping, saveIngredientMapping } from "./productService";

// Circuit breaker state
let isCircuitOpen = false;
let circuitOpenUntil = 0;
let circuitBreakerDuration = 30 * 1000; // Start with 30 seconds

// Token tracking
let requestsThisMinute = 0;
let tokensThisMinute = 0;
let lastReset = Date.now();
let lastError: string | null = null;

function resetTokenTracking() {
  if (Date.now() - lastReset > 60000) {
    requestsThisMinute = 0;
    tokensThisMinute = 0;
    lastReset = Date.now();
  }
}

export function getUsageMetrics() {
  resetTokenTracking();
  return { 
    requests: requestsThisMinute, 
    tokens: tokensThisMinute, 
    lastError,
    isCircuitOpen,
    circuitOpenUntil
  };
}

let lastUsedKeySource = "None";
let lastUsedKeySnippet = "None";

export function getAIKeyInfo() {
  return { source: lastUsedKeySource, snippet: lastUsedKeySnippet };
}

function getAI() {
  // 1. Check for manual local override (for debugging/emergency fixes)
  let localOverride: string | null = null;
  try {
    if (typeof window !== 'undefined') {
      localOverride = localStorage.getItem('INGREDISCORE_CUSTOM_KEY');
    }
  } catch (e) {
    console.warn("localStorage access failed:", e);
  }
  
  // 2. Check for platform-provided keys (Secrets or Dialogs)
  // process.env.GEMINI_API_KEY is the standard for this platform
  const processGeminiKey = (window as any).process?.env?.GEMINI_API_KEY;
  const processApiKey = (window as any).process?.env?.API_KEY;
  
  // VITE_ prefixed keys are injected during build/runtime from Secrets
  const viteGeminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const viteApiKey = import.meta.env.VITE_API_KEY;
  
  let apiKey = "";
  let sourceName = "None";
  
  const isPlaceholder = (key: string | undefined) => 
    !key || key === "MY_GEMINI_KEY" || key === "YOUR_API_KEY" || key.startsWith("MY_GEM") || key.includes("TODO") || key.length < 10;

  // Priority Order:
  // 1. Local Override (User's personal fix)
  // 2. Platform Secret (The "Cloud" fix for all users)
  // 3. Other environment variables
  
  if (localOverride && !isPlaceholder(localOverride)) {
    apiKey = localOverride.trim();
    sourceName = "Manual Local Override (Browser Storage)";
  } else if (processGeminiKey && !isPlaceholder(processGeminiKey)) {
    apiKey = processGeminiKey;
    sourceName = "System Secret (GEMINI_API_KEY)";
  } else if (viteGeminiKey && !isPlaceholder(viteGeminiKey)) {
    apiKey = viteGeminiKey;
    sourceName = "Cloud Secret (VITE_GEMINI_API_KEY)";
  } else if (processApiKey && !isPlaceholder(processApiKey)) {
    apiKey = processApiKey;
    sourceName = "System Secret (API_KEY)";
  } else if (viteApiKey && !isPlaceholder(viteApiKey)) {
    apiKey = viteApiKey;
    sourceName = "Cloud Secret (VITE_API_KEY)";
  }
  
  lastUsedKeySource = sourceName;
  lastUsedKeySnippet = apiKey.length > 8 ? `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}` : "None";
  
  if (!apiKey) {
    console.error(`DEBUG: No valid Gemini API key found for domain ${typeof window !== 'undefined' ? window.location.hostname : 'unknown'}`);
    throw new Error('Gemini API key is missing. To make this app work for everyone, go to Settings -> Secrets and add a secret named VITE_GEMINI_API_KEY with your API key.');
  }
  
  return new GoogleGenAI({ apiKey });
}

// Request queue
let requestQueue: Promise<any> = Promise.resolve();

/**
 * Attempts to repair truncated or malformed JSON from AI responses
 */
function repairJson(json: string): string {
  let repaired = json.trim();
  
  if (!repaired) return '{}';

  // 1. Remove any trailing non-JSON characters (like markdown backticks)
  repaired = repaired.replace(/`+$/, '').trim();

  // 2. Fix unterminated strings
  // Count unescaped double quotes
  let quoteCount = 0;
  for (let i = 0; i < repaired.length; i++) {
    if (repaired[i] === '"' && (i === 0 || repaired[i-1] !== '\\')) {
      quoteCount++;
    }
  }
  
  if (quoteCount % 2 !== 0) {
    // If we have an odd number of quotes, the last one is likely open.
    // But wait, if it ends with a quote, it might be the start of a new key/value.
    // If it doesn't end with a quote, it's definitely an unterminated string.
    if (!repaired.endsWith('"')) {
      repaired += '"';
    }
  }

  // 3. Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,\s*([\]}])/g, '$1');

  // 4. Balance braces and brackets
  const stack: string[] = [];
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (char === '{' || char === '[') {
      stack.push(char);
    } else if (char === '}' || char === ']') {
      const last = stack.pop();
      if ((char === '}' && last !== '{') || (char === ']' && last !== '[')) {
        // Mismatch - this is harder to fix, but let's try to ignore it
      }
    }
  }

  // Close remaining open structures in reverse order
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') repaired += '}';
    else if (last === '[') repaired += ']';
  }

  return repaired;
}

async function internalGenerateContent(params: GenerateContentParameters, retries = 3, delay = 2000): Promise<GenerateContentResponse> {
  // Check circuit breaker
  if (isCircuitOpen) {
    if (Date.now() < circuitOpenUntil) {
      const remaining = Math.ceil((circuitOpenUntil - Date.now()) / 1000);
      throw new Error(`Circuit breaker is open. API quota exhausted. Please wait ${remaining} seconds.`);
    } else {
      console.log("Circuit breaker duration expired, testing connection...");
      isCircuitOpen = false; // Reset
    }
  }

  // Log request details
  resetTokenTracking();
  const promptSize = JSON.stringify(params.contents).length;
  console.log(`[Gemini API Request] Model: ${params.model}, Prompt size: ${promptSize} chars`);

  try {
    const ai = getAI();
    // Add a timeout to prevent hanging forever
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Gemini API timeout')), 120000)
    );
    
    // We need to make sure the API call itself is a promise
    const apiCall = ai.models.generateContent({
      ...params,
      config: {
        ...params.config,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }
    });
    
    const response = await Promise.race([
      apiCall,
      timeoutPromise
    ]);

    console.log("[Gemini API Response Object]", JSON.stringify(response, null, 2));

    if (!response.text && response.candidates && response.candidates.length > 0) {
      console.warn("[Gemini API] Response has candidates but .text is empty. Checking parts...");
      const parts = response.candidates[0].content?.parts || [];
      console.log("[Gemini API] Parts:", JSON.stringify(parts, null, 2));
    }
    const usage = response.usageMetadata;
    if (usage) {
      const totalTokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
      tokensThisMinute += totalTokens;
      requestsThisMinute++;
      console.log(`[Gemini API Response] Tokens: ${totalTokens} (Prompt: ${usage.promptTokenCount}, Response: ${usage.candidatesTokenCount}). Total requests/min: ${requestsThisMinute}, Total tokens/min: ${tokensThisMinute}`);
    } else {
      console.log(`[Gemini API Response] No usage metadata.`);
    }

    // If successful, reset circuit breaker duration to default
    circuitBreakerDuration = 30 * 1000;
    return response;
  } catch (error: any) {
    // Log the full error to help debug
    let errorMessage = "Unknown Error";
    try {
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error));
      }
    } catch (e) {
      errorMessage = String(error);
    }
    
    // If it's still an empty object string, try one more thing
    if (errorMessage === "{}" || errorMessage === "{}") {
      errorMessage = `Empty error object of type: ${typeof error}. Keys: ${Object.keys(error).join(', ')}. String: ${String(error)}`;
    }

    console.error("!!! GEMINI ERROR !!!:", errorMessage, error);
    lastError = errorMessage;
    
    const errorObj = error.error || error;
    // Stricter rate limit detection
    const isRateLimit = errorObj.code === 429 || 
                        errorObj.status === 'RESOURCE_EXHAUSTED' ||
                        (errorObj.message && (
                          errorObj.message.includes('429') || 
                          errorObj.message.includes('RESOURCE_EXHAUSTED')
                        ));
    
    // Detect transient server errors (500s, RPC failures)
    const isTransientError = errorObj.code === 500 ||
                             errorObj.status === 'INTERNAL' ||
                             errorObj.status === 'UNKNOWN' ||
                             errorMessage.toLowerCase().includes('proxying failed') ||
                             errorMessage.toLowerCase().includes('load failed') ||
                             (errorObj.message && (
                               errorObj.message.includes('500') ||
                               errorObj.message.includes('Rpc failed') ||
                               errorObj.message.includes('xhr error') ||
                               errorObj.message.includes('Gemini API timeout') ||
                               errorObj.message.includes('exceeded max tokens limit')
                             ));

    if (isRateLimit) {
      console.warn("DEBUG: Rate limit detected, tripping circuit breaker.");
      // Trip circuit breaker
      isCircuitOpen = true;
      // Increase duration exponentially if we keep hitting rate limits
      circuitBreakerDuration = Math.min(circuitBreakerDuration * 2, 5 * 60 * 1000); // Max 5 minutes
      circuitOpenUntil = Date.now() + circuitBreakerDuration;
    }

    if (retries > 0 && (isRateLimit || isTransientError)) {
      const jitter = Math.random() * 1000;
      const waitTime = delay + jitter;
      const errorType = isRateLimit ? 'Rate limit' : 'Transient error';
      
      // If it's a token limit error or a 500, try to simplify the request for the retry
      const newParams = { ...params };
      if (errorMessage.toLowerCase().includes('exceeded max tokens limit') || errorObj.code === 500) {
        console.warn(`${errorObj.code === 500 ? 'Internal Server Error' : 'Token limit exceeded'}, simplifying request for retry...`);
        if (newParams.config) {
          newParams.config = { ...newParams.config };
          // Lower max tokens to stay within limits
          newParams.config.maxOutputTokens = Math.min(newParams.config.maxOutputTokens || 2048, 2048);
          // Remove search as it's the most likely cause of massive output or 500s
          if (newParams.config.tools) {
            newParams.config.tools = newParams.config.tools.filter(t => !('googleSearch' in t));
          }
        }
      }

      console.warn(`${errorType} hit, retrying in ${waitTime}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Exponential backoff
      return internalGenerateContent(newParams, retries - 1, delay * 2);
    }
    
    // Handle "forbidden" errors by retrying without restricted features
    const isForbidden = errorObj.code === 403 || 
                        errorObj.status === 'PERMISSION_DENIED' ||
                        errorMessage.toLowerCase().includes('forbidden') || 
                        errorMessage.toLowerCase().includes('permission denied') ||
                        errorMessage.toLowerCase().includes('not authorized') ||
                        errorMessage.toLowerCase().includes('proxying failed') ||
                        errorMessage.toLowerCase().includes('load failed');

    if (retries > 0 && isForbidden) {
      console.warn("Forbidden/Permission error hit, retrying with fallback model...");
      const newParams = { ...params };
      
      // Fallback chain
      if (newParams.model && newParams.model.includes('pro')) {
        console.log("Falling back from Pro to Flash model due to 403");
        newParams.model = "gemini-3-flash-preview";
      } else if (newParams.model === "gemini-3-flash-preview") {
        console.log("Falling back from Flash to Flash Lite model due to 403");
        newParams.model = "gemini-3.1-flash-lite-preview";
      } else if (newParams.model === "gemini-3.1-flash-lite-preview") {
        console.log("Falling back from Flash Lite to 1.5 Flash model due to 403");
        newParams.model = "gemini-1.5-flash";
      }

      if (newParams.config) {
        newParams.config = { ...newParams.config };
        // Remove googleSearch grounding as it often causes 403s on some accounts
        if (newParams.config.tools) {
          newParams.config.tools = newParams.config.tools.filter(t => !('googleSearch' in t));
        }
        // Lower thinking level
        if (newParams.config.thinkingConfig) {
          newParams.config.thinkingConfig = { 
            ...newParams.config.thinkingConfig, 
            thinkingLevel: ThinkingLevel.LOW 
          };
        }
      }
      return internalGenerateContent(newParams, retries - 1, delay);
    }
    
    if (isForbidden) {
      const msg = errorMessage || "Access Forbidden (403)";
      const origin = window.location.origin;
      const hostname = window.location.hostname;
      
      console.error(`[Gemini 403] Hostname: ${hostname}, Source: ${lastUsedKeySource}, Key: ${lastUsedKeySnippet}, Message: ${msg}`);
      
      throw new Error(`Gemini API Connection Failed (403/Proxy Error). 
      
      This usually happens when using an API key that is restricted to a specific domain (e.g. it works in Preview but not on the Link). Each URL needs its own authorization.
      
      THE FIX:
      Click the "Fix API Key" button below while on this page. This will let you select or create a fresh key that is authorized for this specific link.
      
      (Technical Info: Domain: ${hostname}, Key source: ${lastUsedKeySource}, Key: ${lastUsedKeySnippet})`);
    }
    
    throw error;
  }
}

export async function safeGenerateContent(params: GenerateContentParameters, retries = 3, delay = 2000): Promise<GenerateContentResponse> {
  // Add to queue and ensure the queue continues even on error
  const nextTask = requestQueue.catch(() => {}).then(() => internalGenerateContent(params, retries, delay));
  requestQueue = nextTask.catch(() => {}); // Keep the chain moving
  return nextTask;
}

export async function generateHolisticAnalysisWithAI(productName: string, brand: string, ingredients: any[]): Promise<{ summary: string, scoreExplanation: string, keyConcerns: string[], positiveAttributes: string[], confidenceLevel: 'Low' | 'Moderate' | 'High', evidenceBasis: string }> {
  const ingredientsSummary = ingredients.map(ing => {
    const studies = (ing.studies || []).map((s: any) => `${s.title} (${s.journal}, ${s.year})`).join('; ');
    return `- ${ing.name} (Score: ${ing.score}, Confidence: ${ing.confidenceLevel || 'Moderate'}): ${ing.scoreReasoning}. Studies: ${studies}`;
  }).join('\n');

  const prompt = `
    You are an expert food scientist.
    Analyze the following product and provide a holistic summary, score explanation, and key pros/cons.
    
    Product: ${productName} by ${brand}
    Ingredients & Research:
    ${ingredientsSummary}
    
    TASK:
    1. Generate a 'summary' (max 1-2 sentences) that gives a clear overview of the product's health impact.
    2. Generate a 'scoreExplanation' (max 2-3 tight sentences) that explicitly identifies the main factors preventing a higher score.
    3. Generate 'keyConcerns' (max 3 items): Specific health risks or negative nutritional aspects of this product.
    4. Generate 'positiveAttributes' (max 3 items): Specific health benefits or positive nutritional aspects. FORBIDDEN: Do not include benefits related to food processing, manufacturing, or shelf life (e.g., "improves texture", "extends shelf life", "prevents claking"). Only include direct health benefits for the consumer.
    5. Determine a 'confidenceLevel' ('Low', 'Moderate', or 'High') for this overall product analysis based on the quality and quantity of research for its ingredients.
    6. Generate an 'evidenceBasis' (2-3 sentences): A detailed explanation of WHY this confidence level was chosen for this specific product, referencing the depth of research available for its key ingredients.
    
    STYLE RULES:
    - Never leave any section empty.
    - Avoid generic health statements; everything must be specific to the food/ingredients.
    - Keep sentences tight, scannable, and information-dense.
    - Tone: Professional, modern, and clean.
    
    RETURN FORMAT:
    Return ONLY a JSON object:
    { 
      "scanId": "${Date.now()}",
      "summary": "...", 
      "scoreExplanation": "...",
      "keyConcerns": ["...", "...", "..."],
      "positiveAttributes": ["...", "...", "..."],
      "confidenceLevel": "High",
      "evidenceBasis": "..."
    }
  `;

  try {
    const response = await safeGenerateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const rawText = response.text || '{}';
    let jsonText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonText);
    
    return {
      summary: result.summary || "Analysis summary currently unavailable.",
      scoreExplanation: result.scoreExplanation || "Score explanation currently unavailable.",
      keyConcerns: result.keyConcerns || [],
      positiveAttributes: result.positiveAttributes || [],
      confidenceLevel: result.confidenceLevel || 'Moderate',
      evidenceBasis: result.evidenceBasis || "Evidence basis currently unavailable."
    };
  } catch (error) {
    console.error("Holistic AI analysis failed, falling back to local generation:", error);
    return {
      summary: "Analysis summary currently unavailable.",
      scoreExplanation: "Score explanation currently unavailable.",
      keyConcerns: [],
      positiveAttributes: [],
      confidenceLevel: 'Moderate',
      evidenceBasis: "Evidence basis currently unavailable."
    };
  }
}

export async function generateIngredientDataWithAI(name: string, currentStudyCount: number = 0, retries = 2): Promise<any> {
  const prompt = `
    You are an expert food scientist.
    Generate a complete JSON object for the ingredient: "${name}" based on the Ingredient interface.
    
    ${currentStudyCount === 0 ? "IMPORTANT: This ingredient currently has NO studies listed. Your primary goal is to use your Google Search tool to find and include as many high-quality, peer-reviewed clinical studies as possible (up to a maximum of 5). Note that a study doesn't have to be specifically about this ingredient; it can be inclusive of the ingredient, or contain findings/correlations that relate to it. While there is no minimum requirement, if you only find a few studies (e.g., 2), you should still search to ensure no relevant research has been missed." : `IMPORTANT: This ingredient currently has ${currentStudyCount} studies. Your goal is to use your Google Search tool to find as many additional high-quality, peer-reviewed clinical studies as possible (up to a total maximum of 5). Note that a study doesn't have to be specifically about this ingredient; it can be inclusive of the ingredient, or contain findings/correlations that relate to it. Search thoroughly to ensure a comprehensive evidence base, but do not include irrelevant research.`}
    
    CRITICAL: Every study MUST be real and verifiable. You are strictly forbidden from making up or hallucinating fake studies. Prioritize high-quality, peer-reviewed research (e.g., Systematic Reviews, Meta-analyses, RCTs). Use your search tool to find specific PubMed IDs (PMIDs) and DOI links for every study. If specific peer-reviewed studies are extremely limited or unavailable, you MUST provide a list of specific reliable expert sources (e.g., FDA, EFSA, WHO, Academy of Nutrition and Dietetics) in the 'expertSources' field. Do NOT just say "consensus". If you find studies but they are not in English, translate the key findings and include them.
    
    SCORING RULE: The 'score' (1-10) MUST reflect the strength of evidence. 
    - If research is limited, conflicting, or primarily based on animal/in-vitro studies, the score should be more conservative (closer to 5) rather than highly positive or negative. 
    - MECHANISMS VS STUDIES: If biological mechanisms are well-understood but human clinical studies are sparse, the score should reflect this "theoretical" benefit/risk by remaining moderate (e.g. 4-7) and explicitly stating that clinical confirmation is lacking.
    - A lack of current human research should be explicitly mentioned in 'scoreReasoning' and should prevent a 'High' confidence level.
    - High scores (8-10) or Low scores (1-3) require strong, consistent human evidence.
    
    CITATIONS & CREDIBILITY:
    - Every claim made in 'positives', 'negatives', 'evidenceOverview', and 'scoreReasoning' should be based on the evidence provided in the 'studies' or 'expertSources' arrays.
    - FORBIDDEN: Do NOT use inline citations (e.g., "[1]", "[FDA 2023]", "[Smith et al. 2021]") in the text of 'positives', 'negatives', 'evidenceOverview', or 'scoreReasoning'. This is a strict requirement. The studies will be listed separately, so the text MUST be clean and readable.
    - FORBIDDEN: Do NOT use generic phrases like "Experts agree", "Scientists suggest", or "Studies show" without naming the specific study, author, or organization if you are making a specific claim.
    - 'expertSources' MUST contain specific titles or URLs (e.g., "FDA GRAS Notice 123", "EFSA Scientific Opinion on X [2021]"), not just the name of the organization.
    - FORBIDDEN SOURCES: Do NOT use generic terms like "Expert Nutritional Analysis", "Scientific Consensus", "General Food Safety Guidelines", or "Standard Nutritional Knowledge" as sources. If you cannot find a specific report or study, state that evidence is limited.
    - Prioritize primary sources (PubMed/PMID) and major regulatory bodies (FDA, EFSA, WHO, IARC).
    
    CITATION STYLE:
    - Good: "Associated with increased risk of X."
    - Good: "FDA considers this GRAS for specific uses."
    - Bad: "Associated with increased risk of X [1]."
    - Bad: "FDA considers this GRAS [FDA 2023]."
    
    COMPLETENESS:
    - You MUST populate EVERY field in the Ingredient interface.
    - Do NOT return null or empty strings for required fields.
    - Ensure 'lastReviewed' and 'lastScientificRefresh' are set to the current date: 2026-03-25.
    
    STUDY DETAILS:
    - For every study in the 'studies' array, you MUST provide detailed 'keyFindings' and 'limitations'.
    - 'keyFindings' should summarize the core result and its statistical significance if available.
    - 'limitations' should mention factors like sample size, duration, or potential biases.
    - DO NOT leave these fields empty or generic.
    
    CONCISENESS & BREVITY:
    - 'scoreReasoning': Max 2 concise sentences. Focus on specific evidence for this ingredient.
    - 'summaryShort': Max 1 tight sentence.
    - 'positives' & 'negatives': Max 5 items each. Each item MUST be a specific, scannable bullet point (max 10 words). Avoid generic fluff. 
    - FORBIDDEN (Positives): Do NOT include benefits related to manufacturing, processing, or shelf life (e.g., "stabilizes texture", "prevents oxidation in storage", "improves mixability"). 'Positives' MUST be strictly limited to direct health or nutritional benefits for the human body.
    - 'evidenceOverview': Max 2-3 sentences. Be precise about the type and quality of research.
    - 'regulatoryConsensus': Max 1-2 sentences.
    - 'studyQualitySummary': Max 1 sentence.
    
    TONE & STYLE:
    - Write like a high-end product: clean, confident, and precise.
    - Avoid generic health statements; be specific to the ingredient.
    - No hype words or academic fluff.
    - Keep it professional and modern.
    
    Ingredient interface:
    {
      id: string;
      name: string;
      synonyms: string[];
      category: string; // Choose from: Sweeteners, Preservatives, Emulsifiers, Color Additives, Oils/Fats, Grains/Starches, Vitamins/Minerals, Flavorings, Thickeners/Gums, Acidity Regulators, Antioxidants, Dairy, Enzymes, Cultures, Produce, Proteins, Spices/Herbs, Descriptive Term, Other
      score: number; // Whole number 1-10
      scoreReasoning: string;
      summaryShort: string;
      positives: string[];
      negatives: string[];
      evidenceOverview: string;
      expertSources: string[]; // Specific reliable sources (e.g. FDA, EFSA, WHO) if studies are limited
      confidenceLevel: 'Low' | 'Moderate' | 'High';
      evidenceType: 'Systematic Review' | 'Meta-analysis' | 'RCT' | 'Observational' | 'Animal/In Vitro' | 'Mixed' | 'Regulatory';
      studies: {
        id: string;
        title: string;
        authors: string;
        journal: string;
        year: number;
        type: string;
        quality: 'High' | 'Moderate' | 'Lower';
        populationType: 'Human' | 'Animal' | 'Cell Study';
        sampleSize?: string;
        population?: string;
        design?: string;
        duration?: string;
        keyFindings: string;
        limitations: string;
        url: string;
        pmid?: string;
      }[];
      lastReviewed: string; // YYYY-MM-DD
      status: 'Likely Beneficial' | 'Likely Neutral' | 'Mixed Evidence' | 'Potential Concern';
      studyQualitySummary: string;
      regulatoryWeight: number; // 0.2-0.4
      regulatoryConsensus: string;
      evidenceStrength: string;
      humanEvidence: string;
      evolvingEvidence: boolean;
      evolvingEvidenceNote?: string; // REQUIRED if evolvingEvidence is true. Must be a descriptive note, not a date.
      lastScientificRefresh: string; // YYYY-MM-DD
    }

    IMPORTANT: 
    1. Comprehensive Research: You are expected to conduct a thorough search and include as many verifiable studies as possible (up to a maximum of 5). Studies can be specifically about the ingredient or broader research that includes findings, data, or correlations relevant to the ingredient. If you find very few studies, search harder to ensure completeness, but never include irrelevant research.
    2. No Hallucinations: While being thorough, you MUST NOT hallucinate or invent studies. Every study must be real and verifiable.
    3. Limited Evidence: Only provide 1-2 studies if the ingredient is exceptionally rare or brand new. If you find very few studies, prioritize including comprehensive regulatory safety assessments (e.g., EFSA Opinions, FDA GRAS notices).
    4. If evolvingEvidence is true, you MUST provide a descriptive evolvingEvidenceNote explaining the current scientific debate or ongoing research.
    5. Keep all text fields extremely concise to avoid exceeding token limits.
    6. Include a unique "scanId": "${Date.now()}" in the response.
  `;
  try {
    const response = await safeGenerateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scanId: { type: Type.STRING },
            id: { type: Type.STRING, description: "URL-safe slug of the ingredient name (e.g. 'red-40')" },
            name: { type: Type.STRING },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
            category: { type: Type.STRING },
            score: { type: Type.INTEGER, description: "Whole number health score from 1 to 10. Must be conservative if evidence is limited." },
            scoreReasoning: { type: Type.STRING, description: "Concise explanation of the score (max 2 sentences). Do NOT include inline citations." },
            summaryShort: { type: Type.STRING, description: "Very brief summary (max 1 sentence). Do NOT include inline citations." },
            positives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of max 5 health benefits. Each item max 10 words. Do NOT include inline citations. FORBIDDEN: Do not include manufacturing or processing benefits." },
            negatives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of max 5 concerns. Each item max 10 words. Do NOT include inline citations." },
            evidenceOverview: { type: Type.STRING, description: "Brief overview of scientific evidence (max 3 sentences). Do NOT include inline citations." },
            expertSources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific titles, report names, or URLs of reliable expert sources (e.g. 'FDA GRAS Notice 123', 'EFSA Opinion on X [2021]'). Generic organization names are NOT enough." },
            confidenceLevel: { type: Type.STRING },
            evidenceType: { type: Type.STRING },
            studies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  authors: { type: Type.STRING },
                  journal: { type: Type.STRING },
                  year: { type: Type.INTEGER },
                  type: { type: Type.STRING },
                  quality: { type: Type.STRING },
                  populationType: { type: Type.STRING },
                  sampleSize: { type: Type.STRING },
                  population: { type: Type.STRING },
                  design: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  keyFindings: { type: Type.STRING },
                  limitations: { type: Type.STRING },
                  url: { type: Type.STRING },
                  pmid: { type: Type.STRING }
                },
                required: ["id", "title", "keyFindings", "limitations", "year", "journal"]
              }
            },
            lastReviewed: { type: Type.STRING },
            status: { type: Type.STRING },
            studyQualitySummary: { type: Type.STRING },
            regulatoryWeight: { type: Type.NUMBER },
            regulatoryConsensus: { type: Type.STRING },
            evidenceStrength: { type: Type.STRING },
            humanEvidence: { type: Type.STRING },
            evolvingEvidence: { type: Type.BOOLEAN, description: "Whether scientific consensus is actively shifting or new major studies are ongoing." },
            evolvingEvidenceNote: { type: Type.STRING, description: "REQUIRED if evolvingEvidence is true. A concise scientific note explaining what is currently being researched or debated. Do NOT use dates." },
            lastScientificRefresh: { type: Type.STRING, description: "The current date in YYYY-MM-DD format." }
          },
          required: ["id", "name", "score", "category", "scoreReasoning", "summaryShort", "positives", "negatives", "evidenceOverview", "confidenceLevel", "evidenceType", "studies", "lastReviewed", "status", "studyQualitySummary", "regulatoryWeight", "regulatoryConsensus", "evidenceStrength", "humanEvidence", "evolvingEvidence", "lastScientificRefresh"]
        },
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 3072,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }, 3, 5000);

    const rawText = response.text || '{}';
    // Remove markdown code blocks if present
    let jsonText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    
    if (!jsonText) {
      throw new Error("Empty response from AI");
    }

    try {
      return JSON.parse(jsonText);
    } catch (parseError) {
      console.warn("Initial JSON parse failed, attempting repair...", parseError);
      try {
        const repairedJson = repairJson(jsonText);
        return JSON.parse(repairedJson);
      } catch (repairError) {
        console.error("JSON repair failed:", repairError);
        // If it's still failing and we have retries left, we could theoretically retry the whole AI call
        // but safeGenerateContent already does retries for network/quota.
        // For now, let's throw a more descriptive error
        throw new Error(`Failed to parse AI response as JSON: ${jsonText.substring(0, 100)}...`);
      }
    }
  } catch (error: any) {
    if (retries > 0 && (error instanceof SyntaxError || error.message.includes('parse'))) {
      console.warn(`JSON parse error in ingredient data, retrying... (${retries} left)`);
      return generateIngredientDataWithAI(name, currentStudyCount, retries - 1);
    }
    console.error("AI generation failed:", error);
    throw error;
  }
}

export async function matchIngredientsWithAI(unrecognizedNames: string[], knownIngredients: {id: string, name: string, synonyms: string[]}[], retries = 2): Promise<any> {
  if (unrecognizedNames.length === 0) return {};

  const results: Record<string, { standardName: string, synonyms: string[], reasoning?: string } | null> = {};
  const namesToAnalyze: string[] = [];

  // 1. Check cache first
  for (const name of unrecognizedNames) {
    const cached = await getIngredientMapping(name);
    if (cached) {
      const ing = knownIngredients.find(i => i.id === cached.mappedId);
      if (ing) {
        results[name] = { standardName: ing.name, synonyms: ing.synonyms, reasoning: cached.reasoning };
      }
    } else {
      namesToAnalyze.push(name);
    }
  }

  if (namesToAnalyze.length === 0) return results;

  // 2. Find relevant candidates for each unrecognized ingredient
  const candidatesMap: Record<string, typeof knownIngredients> = {};
  for (const name of namesToAnalyze) {
    const lowerName = name.toLowerCase();
    candidatesMap[name] = knownIngredients.filter(ing => 
      ing && typeof ing.name === 'string' && (
        ing.name.toLowerCase().includes(lowerName) || 
        lowerName.includes(ing.name.toLowerCase()) ||
        (ing.synonyms && ing.synonyms.some(s => typeof s === 'string' && (s.toLowerCase().includes(lowerName) || lowerName.includes(s.toLowerCase()))))
      )
    ).slice(0, 5); // Limit candidates per ingredient
  }

  const prompt = `
    You are an expert food scientist and database matcher.
    
    UNRECOGNIZED INGREDIENTS FROM LABEL:
    ${namesToAnalyze.map((name, i) => `${i + 1}. ${name}`).join('\n')}
    
    POTENTIAL MATCHES (ID: Name):
    ${Object.entries(candidatesMap).map(([name, candidates]) => 
      `${name}: ${candidates.map(c => `${c.id}: ${c.name}`).join(', ')}`
    ).join('\n')}
    
    TASK:
    For each unrecognized ingredient, find the most logical match from the provided potential matches. 
    - If an exact match exists (ignoring case), prioritize it.
    - If multiple partial matches exist, choose the closest semantic match.
    
    CRITICAL DISTINCTIONS:
    - NEVER map "Soluble Corn Fiber", "Corn Fiber", or "Resistant Maltodextrin" to "Maltodextrin".
    - DO NOT confuse starches/sugars with fibers.
    - If the ingredient is "Maltodextrin", match it ONLY to the ID "maltodextrin". Do not match to variants like "de5".
    - DO NOT match to a category if a specific chemical match is available.
    - DO NOT invent new ingredient IDs.
    
    SPECIAL HANDLING FOR PARENTHESES:
    - If format is "A (B)", match the specific chemical/biological name, not the generic category.
    - Example: "Thickener (Xanthan Gum)" -> "Xanthan Gum".
    
    If no good match exists, return null.
    
    RETURN FORMAT:
    Return ONLY a JSON object: {"scanId": "${Date.now()}", "Ingredient Name": {"mappedId": "id", "confidence": 0.95, "reasoning": "..."}}
  `;

  try {
    const response = await safeGenerateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }, 5, 5000);

    const rawText = response.text || '{}';
    // Remove markdown code blocks if present
    let jsonText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    
    if (!jsonText) {
      throw new Error("Empty response from AI");
    }

    let aiResults;
    try {
      aiResults = JSON.parse(jsonText);
    } catch (parseError) {
      console.warn("Initial JSON parse failed in matching, attempting repair...", parseError);
      try {
        const repairedJson = repairJson(jsonText);
        aiResults = JSON.parse(repairedJson);
      } catch (repairError) {
        console.error("JSON repair failed in matching:", repairError);
        throw new Error(`Failed to parse AI matching response: ${jsonText.substring(0, 100)}...`);
      }
    }
    
    // 3. Cache results
    for (const [name, result] of Object.entries(aiResults)) {
      if (result && typeof result === 'object' && 'mappedId' in result && 'confidence' in result) {
        const { mappedId, confidence, reasoning } = result as { mappedId: string, confidence: number, reasoning?: string };
        const ing = knownIngredients.find(i => i.id === mappedId);
        if (ing) {
          results[name] = { standardName: ing.name, synonyms: ing.synonyms, reasoning };
          await saveIngredientMapping({ 
            originalName: name, 
            mappedId: mappedId, 
            confidence: confidence,
            status: confidence >= 0.9 ? 'confirmed' : 'pending',
            reasoning: reasoning
          });
        } else {
          results[name] = null;
        }
      } else {
        results[name] = null;
      }
    }

    return results;
  } catch (error: any) {
    if (retries > 0 && (error instanceof SyntaxError || error.message.includes('parse'))) {
      console.warn(`JSON parse error in matching, retrying... (${retries} left)`);
      return matchIngredientsWithAI(unrecognizedNames, knownIngredients, retries - 1);
    }
    console.error("AI matching failed:", error);
    throw error;
  }
}
