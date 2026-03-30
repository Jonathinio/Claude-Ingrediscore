# IngrediScore Backend API Specification

This document defines the proposed backend API contract for IngrediScore v2.

The goal is to provide a stable, deterministic interface between the native iOS app and the backend analysis/data services.

---

## 1. Design Principles

### 1.1 Client role
The client should:
- capture barcode or ingredient text
- call backend APIs
- render returned results
- cache results locally

The client should not be the source of truth for:
- scientific scoring
- ingredient canonicalization
- evidence selection
- score versioning

### 1.2 Backend role
The backend should:
- look up products
- parse ingredient text
- canonicalize ingredient names
- compute scores
- attach evidence and confidence
- version scoring outputs
- support later re-analysis

### 1.3 API principles
- JSON only
- deterministic output structure
- confidence always explicit
- versioning always explicit
- stable IDs where possible
- error responses structured and predictable

---

## 2. Authentication Strategy

### Initial MVP recommendation
Allow app access to these analysis endpoints without requiring end-user login for core scanning.

Reason:
- faster MVP
- lower user friction
- scanning is core value

### Later optional auth
Auth can be added for:
- account sync
- saved history across devices
- reviewer/admin tools

---

## 3. Top-Level API Surface

### Core endpoints
- `POST /v1/products/lookup-barcode`
- `POST /v1/analysis/ingredients-text`
- `GET /v1/ingredients/{ingredientId}`
- `GET /v1/products/{productId}`
- `POST /v1/products/{productId}/reanalyze`

### Optional future endpoints
- `POST /v1/products/upsert`
- `POST /v1/ingredients/review-unknown`
- `GET /v1/score-versions/current`
- `POST /v1/admin/ingredients`

---

## 4. Common Envelope and Error Format

## 4.1 Success pattern
Success responses may return plain resource JSON for simplicity in MVP, but all should include version fields where relevant.

## 4.2 Error response shape
```json
{
  "error": {
    "code": "BARCODE_NOT_FOUND",
    "message": "No product was found for the supplied barcode.",
    "retryable": false,
    "details": {
      "barcode": "012345678905"
    }
  }
}
```

## 4.3 Standard error codes
- `INVALID_REQUEST`
- `BARCODE_NOT_FOUND`
- `OCR_TEXT_EMPTY`
- `ANALYSIS_FAILED`
- `INGREDIENT_NOT_FOUND`
- `RATE_LIMITED`
- `UPSTREAM_TIMEOUT`
- `INTERNAL_ERROR`

---

## 5. Shared Domain Payloads

## 5.1 ConfidenceLevel
Allowed values:
- `low`
- `moderate`
- `high`

## 5.2 ProcessingLevel
Allowed values:
- `minimallyProcessed`
- `moderatelyProcessed`
- `ultraProcessed`

## 5.3 MatchType
Allowed values:
- `exact`
- `alias`
- `unknown`
- `compound`

## 5.4 StudyQuality
Allowed values:
- `high`
- `moderate`
- `lower`

## 5.5 Ingredient category
Should map to a finite enum-like set, e.g.:
- `sweeteners`
- `preservatives`
- `emulsifiers`
- `colorAdditives`
- `oilsFats`
- `grainsStarches`
- `vitaminsMinerals`
- `flavorings`
- `thickenersGums`
- `acidityRegulators`
- `antioxidants`
- `dairy`
- `enzymes`
- `cultures`
- `produce`
- `proteins`
- `spicesHerbs`
- `other`

---

## 6. Resource Schemas

## 6.1 ScoringVersion
```json
{
  "id": "v1",
  "parserVersion": "v1",
  "ingredientModelVersion": "v1",
  "scoringRulesVersion": "v1",
  "rationaleVersion": "v1"
}
```

## 6.2 EvidenceStudy
```json
{
  "id": "study-123",
  "title": "Example Study Title",
  "authors": "Smith et al.",
  "journal": "Nutrition Journal",
  "year": 2023,
  "type": "RCT",
  "quality": "moderate",
  "populationType": "human",
  "sampleSize": "120 adults",
  "duration": "12 weeks",
  "keyFindings": "Observed association with improved glycemic response.",
  "limitations": "Short duration and limited sample diversity.",
  "url": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
  "pmid": "12345678"
}
```

## 6.3 Ingredient
```json
{
  "id": "citric-acid",
  "canonicalName": "Citric Acid",
  "aliases": ["E330"],
  "category": "acidityRegulators",
  "score": 6,
  "scoreReasoning": "Generally recognized as safe in common food use, but not strongly beneficial.",
  "summaryShort": "Common acidity regulator used in packaged foods.",
  "positives": ["Widely studied"],
  "negatives": ["Limited direct health benefit"],
  "evidenceOverview": "Evidence largely supports safe use in food processing concentrations.",
  "confidenceLevel": "moderate",
  "evidenceType": "regulatory",
  "studies": []
}
```

## 6.4 IngredientMatch
```json
{
  "id": "citric-acid",
  "originalName": "citric acid",
  "displayName": "Citric Acid",
  "matchType": "exact",
  "confidence": "moderate",
  "ingredient": { },
  "subIngredients": []
}
```

## 6.5 ProductAnalysis
```json
{
  "overallScore": 6,
  "summary": "Moderately processed product with a mixed ingredient profile.",
  "scoreExplanation": "Score is reduced by added sweeteners and processing additives, but no extreme-risk ingredients were detected.",
  "confidenceLevel": "moderate",
  "evidenceBasis": "Confidence is moderate because several ingredients are well characterized, but exact concentrations are unknown from the label.",
  "keyConcerns": ["Added sweeteners", "Processing additives"],
  "positiveAttributes": ["No major red-flag additives"],
  "loweredScoreBy": ["Sugar", "Natural Flavors"],
  "improvedScoreBy": ["Oats"],
  "processingLevel": "moderatelyProcessed",
  "ingredients": [],
  "scoreVersion": { }
}
```

## 6.6 Product
```json
{
  "id": "product-123",
  "barcode": "012345678905",
  "name": "Sample Granola Bar",
  "brand": "IngrediScore Labs",
  "rawIngredientText": "Oats, sugar, citric acid, natural flavors",
  "analysis": { },
  "updatedAt": "2026-03-29T12:00:00Z"
}
```

---

## 7. Endpoint: Lookup Product by Barcode

### Route
`POST /v1/products/lookup-barcode`

### Purpose
Look up a product using a barcode and return normalized product + analysis data if available.

### Request
```json
{
  "barcode": "012345678905",
  "locale": "en-US"
}
```

### Response: found
```json
{
  "found": true,
  "product": {
    "id": "product-123",
    "barcode": "012345678905",
    "name": "Sample Granola Bar",
    "brand": "IngrediScore Labs",
    "rawIngredientText": "Oats, sugar, citric acid, natural flavors",
    "analysis": {
      "overallScore": 6,
      "summary": "Moderately processed product with a mixed ingredient profile.",
      "scoreExplanation": "Score is reduced by added sweeteners and processing additives, but no extreme-risk ingredients were detected.",
      "confidenceLevel": "moderate",
      "evidenceBasis": "Confidence is moderate because ingredient identities are clearer than exact amounts.",
      "keyConcerns": ["Added sweeteners", "Processing additives"],
      "positiveAttributes": ["No major red-flag additives"],
      "loweredScoreBy": ["Sugar"],
      "improvedScoreBy": ["Oats"],
      "processingLevel": "moderatelyProcessed",
      "ingredients": [],
      "scoreVersion": {
        "id": "v1",
        "parserVersion": "v1",
        "ingredientModelVersion": "v1",
        "scoringRulesVersion": "v1",
        "rationaleVersion": "v1"
      }
    },
    "updatedAt": "2026-03-29T12:00:00Z"
  },
  "source": "database"
}
```

### Response: not found
```json
{
  "found": false,
  "product": null,
  "analysis": null,
  "source": "none"
}
```

### Notes
- `source` may be `database`, `cache`, `external`, or `none`
- endpoint should not fail just because a product is unknown; use `found: false`

---

## 8. Endpoint: Analyze Ingredient Text

### Route
`POST /v1/analysis/ingredients-text`

### Purpose
Accept ingredient text extracted from a label and return normalized ingredient matches plus product-level analysis.

### Request
```json
{
  "rawText": "Ingredients: oats, sugar, citric acid, natural flavors",
  "productName": "Optional Product Name",
  "brand": "Optional Brand",
  "locale": "en-US"
}
```

### Response
```json
{
  "normalizedIngredients": [
    {
      "id": "oats",
      "originalName": "oats",
      "displayName": "Oats",
      "matchType": "exact",
      "confidence": "high",
      "ingredient": {
        "id": "oats",
        "canonicalName": "Oats",
        "aliases": [],
        "category": "grainsStarches",
        "score": 8,
        "scoreReasoning": "Whole-grain oat ingredients are generally associated with positive nutritional characteristics.",
        "summaryShort": "Whole grain ingredient with favorable evidence profile.",
        "positives": ["Whole grain profile"],
        "negatives": [],
        "evidenceOverview": "Evidence generally supports oat intake as part of a healthy diet.",
        "confidenceLevel": "high",
        "evidenceType": "mixed",
        "studies": []
      },
      "subIngredients": []
    },
    {
      "id": "unknown-natural-flavors",
      "originalName": "natural flavors",
      "displayName": "Natural Flavors",
      "matchType": "unknown",
      "confidence": "low",
      "ingredient": null,
      "subIngredients": []
    }
  ],
  "analysis": {
    "overallScore": 6,
    "summary": "Moderately processed product with a mixed ingredient profile.",
    "scoreExplanation": "Score is reduced by added sweeteners and unresolved flavoring ambiguity.",
    "confidenceLevel": "moderate",
    "evidenceBasis": "Several ingredients are well understood, but some grouped or ambiguous ingredients reduce certainty.",
    "keyConcerns": ["Added sweeteners", "Ambiguous flavoring"],
    "positiveAttributes": ["Contains oats"],
    "loweredScoreBy": ["Sugar", "Natural Flavors"],
    "improvedScoreBy": ["Oats"],
    "processingLevel": "moderatelyProcessed",
    "ingredients": [],
    "scoreVersion": {
      "id": "v1",
      "parserVersion": "v1",
      "ingredientModelVersion": "v1",
      "scoringRulesVersion": "v1",
      "rationaleVersion": "v1"
    }
  },
  "scoreVersion": {
    "id": "v1",
    "parserVersion": "v1",
    "ingredientModelVersion": "v1",
    "scoringRulesVersion": "v1",
    "rationaleVersion": "v1"
  }
}
```

### Validation rules
- reject empty or whitespace-only `rawText`
- reject implausibly short text that cannot be analyzed
- preserve original text for debugging/auditing if needed server-side

### Notes
- `normalizedIngredients` should preserve tree structure for compounds through `subIngredients`
- unknown ingredients are allowed and should not crash the endpoint

---

## 9. Endpoint: Get Ingredient Detail

### Route
`GET /v1/ingredients/{ingredientId}`

### Purpose
Fetch full ingredient detail, including studies.

### Response
```json
{
  "ingredient": {
    "id": "citric-acid",
    "canonicalName": "Citric Acid",
    "aliases": ["E330"],
    "category": "acidityRegulators",
    "score": 6,
    "scoreReasoning": "Generally recognized as safe in common food use, but not strongly beneficial.",
    "summaryShort": "Common acidity regulator used in packaged foods.",
    "positives": ["Widely studied"],
    "negatives": ["Limited direct health benefit"],
    "evidenceOverview": "Evidence largely supports safe use in food processing concentrations.",
    "confidenceLevel": "moderate",
    "evidenceType": "regulatory",
    "studies": [
      {
        "id": "study-123",
        "title": "Example Study Title",
        "authors": "Smith et al.",
        "journal": "Nutrition Journal",
        "year": 2023,
        "type": "RCT",
        "quality": "moderate",
        "populationType": "human",
        "sampleSize": "120 adults",
        "duration": "12 weeks",
        "keyFindings": "Observed association with improved glycemic response.",
        "limitations": "Short duration and limited sample diversity.",
        "url": "https://pubmed.ncbi.nlm.nih.gov/12345678/",
        "pmid": "12345678"
      }
    ]
  },
  "studies": []
}
```

### Notes
- `studies` can be duplicated inside the ingredient object or returned top-level, but one pattern should be chosen and kept consistent
- recommendation: keep studies nested inside `ingredient`, and remove top-level duplication later for cleanliness

---

## 10. Endpoint: Get Product Detail

### Route
`GET /v1/products/{productId}`

### Purpose
Fetch a previously analyzed product by ID.

### Response
Return full `Product` resource.

---

## 11. Endpoint: Reanalyze Product

### Route
`POST /v1/products/{productId}/reanalyze`

### Purpose
Re-run scoring/parsing using the latest backend model versions.

### Request
```json
{
  "force": true
}
```

### Response
Return updated full `Product` resource.

### Notes
Useful for:
- score model updates
- improved ingredient mappings
- refreshed evidence

---

## 12. Unknown Ingredient Handling

### Principles
- unknown ingredients are expected and must be represented explicitly
- backend should not hide uncertainty
- unknown ingredients should reduce confidence and may affect score conservatively

### Representation
Unknown ingredient match example:
```json
{
  "id": "unknown-natural-flavors",
  "originalName": "natural flavors",
  "displayName": "Natural Flavors",
  "matchType": "unknown",
  "confidence": "low",
  "ingredient": null,
  "subIngredients": []
}
```

---

## 13. Compound Ingredient Handling

### Requirement
The API must support nested ingredient trees.

### Example
```json
{
  "id": "compound-seasoning",
  "originalName": "seasoning (salt, garlic powder, onion powder)",
  "displayName": "Seasoning",
  "matchType": "compound",
  "confidence": "moderate",
  "ingredient": null,
  "subIngredients": [
    {
      "id": "salt",
      "originalName": "salt",
      "displayName": "Salt",
      "matchType": "exact",
      "confidence": "high",
      "ingredient": { },
      "subIngredients": []
    }
  ]
}
```

---

## 14. Versioning Requirements

Every analysis response must include a scoring/version payload.

Why:
- allows future re-analysis
- helps users and developers understand score provenance
- prevents silent score drift

Minimum requirement:
- include `scoreVersion` in analysis responses

---

## 15. Rate Limits and Timeouts

### Expected client behavior
Client should handle:
- retryable network failures
- timeout-based failures
- temporary rate limits

### Backend recommendation
If rate limited:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again shortly.",
    "retryable": true,
    "details": {
      "retryAfterSeconds": 30
    }
  }
}
```

---

## 16. Observability Fields (Optional but Recommended)

Useful optional fields:
- requestId
- generatedAt
- source
- latencyMs

Example:
```json
{
  "requestId": "req_123",
  "generatedAt": "2026-03-29T12:00:00Z",
  "source": "database",
  "product": { }
}
```

---

## 17. MVP Backend Recommendation

For the first live backend version, prioritize:
- barcode lookup
- ingredient text analysis
- ingredient detail fetch
- reanalysis support

Do not overbuild initially.

---

## 18. Immediate Next Step After This Spec

After approving this API spec, the next technical step should be:
- convert these endpoint definitions into Swift client DTO usage and/or backend implementation tasks
- decide whether Firebase remains the initial data store behind this API layer
