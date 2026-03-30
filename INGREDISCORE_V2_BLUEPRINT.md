# IngrediScore v2 Blueprint

## Purpose

This document defines the rebuild plan for IngrediScore as a real native iOS app suitable for production hardening and eventual App Store release.

It replaces the current prototype's mixed web / hybrid architecture with a deliberate native-first plan.

---

## 1. Product Definition

### Core concept
IngrediScore is an AI-assisted ingredient analysis app that helps users scan food labels or barcodes, identify ingredients, and understand the likely health impact of those ingredients based on evidence and transparent scoring rules.

### Primary user actions
- Scan a barcode to look up a product
- Scan an ingredient label with the camera
- View an overall product score
- View ingredient-by-ingredient analysis
- Read short rationale and optional deeper explanation
- Review evidence summaries and linked studies
- Revisit previous scans

### Product philosophy
- Native iPhone experience first
- Fast scanning and readable results
- Transparent scoring over black-box magic
- AI used as an assistant, not sole authority
- Confidence and uncertainty shown clearly
- Educational, not diagnostic or medical advice

---

## 2. Rebuild Strategy

### Current state
The existing exported project is a React/Vite/Capacitor hybrid app with Firebase + IndexedDB + Gemini integration and significant prototype logic concentrated in a very large client-side app layer.

### Decision
Use the current project as:
- product reference
- UX reference
- data-shape reference
- domain logic reference

Do **not** use it as the implementation foundation for v2.

### v2 implementation direction
Build a new app with:
- Swift
- SwiftUI
- AVFoundation
- Vision
- SwiftData or Core Data
- backend API layer

---

## 3. Target Architecture

### 3.1 Native iOS app
Responsibilities:
- barcode scanning
- camera capture
- OCR text extraction
- local image preprocessing where useful
- local cache/history
- rendering UI
- offline support for cached results
- network calls to backend APIs

Should **not** own:
- full canonical ingredient authority
- evidence ingestion
- scientific scoring source of truth
- heavy AI orchestration

### 3.2 Backend / service layer
Responsibilities:
- product lookup by barcode
- ingredient parsing and canonicalization
- product scoring
- rationale generation from structured data
- evidence lookup and summaries
- score versioning
- unknown ingredient review workflows
- optional admin tooling

### 3.3 Data layer
Short-term recommendation:
- Firebase may remain the initial backend/data platform if it speeds iteration
- Add a backend API layer instead of letting the app depend directly on Firestore for core business logic

Long-term optional path:
- move structured scientific / relational data into Postgres if evidence and admin complexity outgrow Firestore comfort

### 3.4 Local cache layer
Use SwiftData or Core Data to cache:
- scanned products
- ingredient profiles used recently
- recent analysis results
- pending offline work if needed later

---

## 4. Recommended Stack

### iOS
- Swift
- SwiftUI
- AVFoundation
- Vision
- SwiftData (preferred) or Core Data
- URLSession
- async/await

### Backend
Initial pragmatic option:
- Firebase Auth
- Firestore as initial data store
- custom API/service layer for parsing and scoring

Alternative cleaner option:
- Postgres + API service
- optional Firebase Auth or other auth later

### AI layer
- Gemini or equivalent model through backend
- deterministic rules first
- AI only for:
  - ambiguous ingredient normalization
  - rationale generation
  - evidence summarization
  - unknown ingredient triage

---

## 5. Core Screen Map

### 5.1 Home
Purpose:
- entry point for scan actions
- recent scans
- education / onboarding / trust messaging

Primary actions:
- Scan Barcode
- Scan Ingredients
- View History

### 5.2 Barcode Scan Screen
Purpose:
- fast UPC/EAN scan
- immediate lookup

Requirements:
- native barcode scanning
- loading state
- fallback when product not found

### 5.3 Ingredient Label Scan Screen
Purpose:
- capture ingredient label image
- extract text with OCR
- submit parsed result for scoring

Requirements:
- native camera preview
- guided crop / framing UI
- capture and retake flow
- OCR confidence / failure handling

### 5.4 Analysis Result Screen
Purpose:
- show overall product score
- show explanation and confidence
- show top concerns and positives
- show ingredient list

Requirements:
- fast initial render
- partial loading states if details stream in later
- cache result locally

### 5.5 Ingredient Detail Screen
Purpose:
- ingredient-level score
- explanation
- evidence overview
- studies and limitations

### 5.6 History Screen
Purpose:
- previously scanned products
- cached/offline accessible content

### 5.7 Settings Screen
Purpose:
- theme
- privacy/disclaimer info
- cache controls
- backend/account settings if accounts are added

### 5.8 Optional future screens
- Saved / favorites
- Account/profile
- Compare products
- Admin / reviewer tools (not in consumer app initially)

---

## 6. Core Data Models

### 6.1 Product
Fields:
- id
- barcode
- name
- brand
- rawIngredientText
- normalizedIngredients
- overallScore
- confidenceLevel
- scoreExplanation
- evidenceBasis
- positiveAttributes
- keyConcerns
- processingLevel
- imageRefs
- scoreVersion
- createdAt
- updatedAt

### 6.2 Ingredient
Fields:
- id
- canonicalName
- aliases
- category
- score
- scoreReasoning
- summaryShort
- positives
- negatives
- evidenceOverview
- confidenceLevel
- evidenceType
- regulatoryConsensus
- evidenceStrength
- humanEvidence
- evolvingEvidence
- evolvingEvidenceNote
- lastReviewed
- lastScientificRefresh
- scoreVersion

### 6.3 EvidenceStudy
Fields:
- id
- ingredientId
- title
- authors
- journal
- year
- type
- quality
- populationType
- sampleSize
- duration
- keyFindings
- limitations
- url
- pmid

### 6.4 IngredientAlias
Fields:
- alias
- ingredientId
- confidence
- status
- reasoning
- updatedAt

### 6.5 ProductAnalysis
Fields:
- productId
- matchedIngredients
- overallScore
- summary
- scoreExplanation
- confidenceLevel
- evidenceBasis
- keyConcerns
- positiveAttributes
- loweredScoreBy
- improvedScoreBy
- processingLevel
- scoreVersion

### 6.6 ScoringVersion
Fields:
- id
- parserVersion
- ingredientModelVersion
- scoringRulesVersion
- rationaleVersion
- createdAt
- notes

---

## 7. Scoring Philosophy

### Principles
- Scores are based on ingredient-level evidence and inferred product composition, not calories
- Deterministic rules should anchor scoring
- Confidence must be shown separately from score
- Unknowns reduce certainty and may affect score conservatively
- Product score should not pretend to know exact ingredient quantities when label data is limited

### Ingredient score
- 1 to 10
- paired with confidence
- tied to evidence quality and rationale

### Product score
Use weighted aggregation based on:
- ingredient scores
- ingredient order
- presence of high-concern additives
- unresolved / unknown ingredients
- ambiguous grouping labels
- confidence penalty where evidence or parsing is weak

### AI role
AI does **not** invent the score from scratch.
AI may:
- generate human-readable rationale
- summarize evidence
- assist with alias resolution
- classify ambiguous cases into structured outputs

---

## 8. Parsing Strategy

### Parsing stages
1. OCR text extraction
2. text cleanup
3. ingredient section isolation
4. tokenization with nested parentheses support
5. compound ingredient tree construction
6. alias / canonical matching
7. confidence assignment
8. scoring

### Special cases to support
- nested ingredients in parentheses
- grouping labels
- "contains less than 2% of"
- preservatives / additives with alternate names
- OCR noise and punctuation damage
- descriptive phrases that are not sub-ingredients

### Output shape
Represent ingredients as a tree when compounds exist, not just a flat list.

---

## 9. Reuse vs Rewrite

### Reuse as concepts / references
- product flow
- ingredient detail flow
- score badge and explanation concepts
- history/library concepts
- product / ingredient / study data shapes
- ingredient matching heuristics
- unknown ingredient workflow ideas

### Rewrite completely
- client architecture
- camera stack
- OCR stack
- barcode scanning implementation
- AI orchestration in client
- monolithic App.tsx style state management
- direct dependence on prototype web runtime assumptions

### Keep as temporary backend source if useful
- Firebase collections/data where practical
- existing ingredient records
- existing mappings if quality is acceptable

---

## 10. Build Phases

### Phase 1: Blueprint and specification
Deliverables:
- architecture doc
- data model doc
- scoring philosophy doc
- screen list and flows

### Phase 2: Native iOS foundation
Deliverables:
- Xcode project structure
- Swift models
- navigation shell
- design system primitives
- placeholder screens

### Phase 3: Scanning foundation
Deliverables:
- barcode scanner
- ingredient scan camera flow
- OCR service
- retake / error states

### Phase 4: Analysis and backend integration
Deliverables:
- API client
- product lookup flow
- ingredient parsing + scoring integration
- result rendering

### Phase 5: Local persistence and history
Deliverables:
- cached products
- recent scans
- offline read support

### Phase 6: Production hardening
Deliverables:
- performance optimization
- accessibility pass
- error reporting
- privacy/disclaimer text
- TestFlight readiness

### Phase 7: App Store preparation
Deliverables:
- final branding assets
- screenshots
- metadata
- privacy nutrition details
- release checklist

---

## 11. Near-Term Decisions

These decisions are needed soon:
- confirm native rebuild direction
- choose whether Firebase remains the initial backend
- choose whether account/login exists in v1 App Store release
- define scoring methodology version 1
- decide MVP scope for first shippable version

---

## 12. MVP Recommendation

Recommended first App Store MVP:
- barcode scanning
- ingredient label scanning
- overall product score
- ingredient-level breakdown
- short rationale
- confidence level
- evidence summaries
- cached history

Not required for MVP:
- social features
- leaderboard
- advanced admin tooling in app
- full crowdsourced moderation systems
- cross-platform parity

---

## 13. Key Risks

### Technical risks
- OCR quality on reflective / curved labels
- ingredient canonicalization complexity
- latency if too much AI is in the hot path
- cache consistency between client and backend

### Product risks
- user trust if score feels arbitrary
- overclaiming health impact
- unclear methodology

### Release risks
- weak privacy/disclaimer handling
- poor camera UX
- insufficient real-device testing

---

## 14. Definition of Success

IngrediScore v2 is successful when:
- the app feels like a real native iPhone app
- scan flows are fast and understandable
- scores are explainable and confidence-aware
- the system handles common ingredient labels reliably
- previous scans are cached and easy to revisit
- the app is structurally ready for App Store submission and testing

---

## 15. Immediate Next Build Step

After this blueprint, the next concrete deliverable should be:

**IngrediScore v2 technical specification package** containing:
- native iOS app structure
- backend/service boundaries
- Swift model definitions
- API contract drafts
- first milestone implementation plan

This is the document set that should directly drive coding.
