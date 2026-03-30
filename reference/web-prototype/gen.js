import fs from 'fs';
import 'dotenv/config';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generate() {
  console.log("Generating facts...");
  const prompt = `Generate 100 highly diverse, interesting, and educational facts about food. 
  Categories should include: Food History, Nutrition Science, Food Manufacturing, Agriculture & Farming, Culinary Chemistry, Ingredient Origins, Food Labeling Laws, Fermentation, Food Preservation, Flavor Science, Botany of Food, Food Safety.
  Do not repeat facts. Make them 1-2 sentences each. Do not include facts about the most expensive foods.
  Return as JSON: { "facts": [{ "fact": "...", "category": "..." }] }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            facts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fact: { type: Type.STRING },
                  category: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    const existing = JSON.parse(fs.readFileSync('./src/data/facts.json', 'utf8'));
    const combined = [...existing, ...data.facts];
    fs.writeFileSync('./src/data/facts.json', JSON.stringify(combined, null, 2));
    console.log(`Added ${data.facts.length} facts. Total is now ${combined.length}.`);
  } catch (e) {
    console.error(e);
  }
}

generate();
