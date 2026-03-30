# IngrediScore Product Spec

## 1. Core product definition
IngrediScore is an evidence-based food analysis platform that helps users understand the health implications of ingredients and products. It uses AI-assisted analysis plus a curated database of clinical studies to produce objective health scores, processing-level assessments, and explainable nutritional insights.

### Primary problem solved
Users struggle with label confusion: ingredient panels are dense, marketing language is noisy, and it is hard to know what matters. IngrediScore translates complex labels into science-backed, actionable information.

## 2. Primary use cases

### Barcode scanning
- Identify a product instantly by UPC/EAN.
- Retrieve an existing product analysis from the shared database when available.

### AI-driven label analysis
- Capture or enter an ingredient list for products not already in the database.
- Run AI-assisted analysis to generate a holistic product score and reasoning.

### Ingredient search
- Look up ingredients directly.
- Surface score, category, confidence, and underlying clinical evidence.

### Cloud synchronization
- Authenticated users can sync history and personal product data across devices.

### Community contributions
- Users can contribute new product and ingredient data that becomes part of the shared library after verification.

## 3. Navigation structure

### Primary navigation
Persistent bottom tab bar:
- Home
- Search
- Scan
- Food
- Menu

### Secondary navigation
Menu overlay or secondary menu destination for:
- History
- Leaderboard
- About
- Support / research info
- Settings

### Detail navigation
Standard push/pop navigation for:
- Search → Ingredient Detail
- Scan / Food → Product Page

## 4. Screen-by-screen behavior

### Home page
Purpose: dashboard and entry point.

Key features:
- Food Fact Insight: rotating AI-generated nutrition or health tip
- Global Library Stats: ingredient count and total clinical study count
- System Status: backend / AI connectivity indicators
- Quick Actions: fast paths into Search and Scan

### Search page
Purpose: ingredient library exploration.

Key features:
- search bar
- synonym-aware matching
- category filters
- sorting (score high→low, score low→high, name)
- ingredient cards with name, score, category

### Scan page
Purpose: core product analysis interaction.

Key features:
- barcode scanner
- manual entry path
- image capture modes (front, nutrition, ingredients)
- analysis trigger for re-analysis flow
- success feedback and transition into product page

### Product page
Purpose: full product analysis results.

Key features:
- large overall score gauge
- processing level badge
- AI summary
- ingredient breakdown with per-ingredient scores
- key concerns / positive attributes
- detailed score explanation

### Ingredient detail page
Purpose: deep evidence view for a single ingredient.

Key features:
- evidence overview / consensus summary
- clinical studies list
- regulatory status
- confidence level
- richer explanation of why the ingredient received its score

### History page
Purpose: previously scanned or viewed items.

Key features:
- chronological list
- product cards with score/date
- sync indicators

### Leaderboard page
Purpose: gamified community contributions.

Key features:
- user rankings
- verified scans
- ingredient contributions

### Settings page
Purpose: app configuration.

Key features:
- theme toggle
- read saver mode
- API key management for Gemini access / rate limit flexibility

## 5. Authentication and user state

### Authentication method
- Google Sign-In via Firebase Auth

### Anonymous state
- local-only scans/results
- no cloud sync
- no contribution-linked identity

### Authenticated state
- createdBy tracking
- sync with Firestore
- leaderboard participation
- user stats recalculation

## 6. Camera and scanner behavior
- native barcode scanning is a high-priority rebuild target for iOS
- OCR / ingredient image capture should support AI-backed parsing
- success states should feel immediate and tactile (haptics)

## 7. Product analysis logic
Hybrid deterministic + AI-driven scoring model.

### Weighted base scoring
- 1st ingredient: 5x weight
- 2nd ingredient: 3x weight
- 3rd ingredient: 2x weight
- remaining ingredients: 1x weight

### Category penalties
- Sweeteners: -1.0
- Artificial Colors: -1.0
- Preservatives: -0.5
- Emulsifiers / Stabilizers: -0.5

### AI refinement
Gemini 3 Flash refines:
- summary
- holistic concerns
- hidden patterns and nuanced issues

## 8. Ingredient analysis logic

### Score ranges
- 8–10: strong evidence of benefit or neutrality
- 5–7: mixed evidence or generic/unclear term
- 1–4: strong evidence of potential harm

### Matching behavior
- ingredient cleaning removes adjectives and marketing qualifiers
- synonym map normalizes variants and aliases

## 9. Barcode / product lookup logic
1. local cache check
2. Firestore check
3. if not found: ingredient capture / entry → AI analysis → create new product record

## 10. Data model / storage / backend

### Firestore collections
- `products`
- `ingredients`
- `ingredientMappings`
- `users`
- `leaderboard`
- `facts`

### Important storage note
The recovered historical data currently lives in the named Firestore database:
- `ai-studio-38be78cd-dd16-4388-b437-a416b88e1f0c`

### Local persistence goal
Use native-friendly caching/offline mechanisms rather than replicating the exact old IndexedDB implementation.

## 11. AI / LLM behavior
- model: Gemini 3 Flash family
- search support for clinical evidence gathering
- robust JSON repair / retry handling
- circuit breaker / fallback behavior for quota and transient failures

## 12. UI / design behavior
- modern technical / clean-density aesthetic
- rounded cards
- high-contrast typography
- safe-area-aware mobile layout
- the app should remain information-dense without becoming cluttered

## 13. States and edge cases
- offline mode should still surface cached data
- quota exceeded should show clear warnings
- unknown ingredient fallback should remain explainable and conservative

## 14. Rebuild priorities for native iOS
1. Native backend visibility using recovered Firebase data
2. Search / library depth with real ingredient corpus
3. Proper scan experience (barcode + OCR/manual)
4. Product and ingredient detail parity with real backend fields
5. Menu / history / leaderboard / settings depth
6. Google Sign-In and sync behavior
7. Better offline persistence and native UX polish

## 15. Executive summary
Core flow:
- Scan barcode → Firestore lookup → optional AI analysis → holistic score/result page

Key rule:
- Do not oversimplify the product or ingredient detail experiences.
- The product depends on clear, rich, evidence-backed explanation — not just a number.
