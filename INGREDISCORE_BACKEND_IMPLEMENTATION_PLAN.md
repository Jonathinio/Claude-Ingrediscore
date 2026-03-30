# IngrediScore Backend Implementation Plan

This document maps the backend API specification to a practical implementation strategy for IngrediScore v2.

---

## 1. Goal

Implement a backend layer that sits behind the native iOS client and provides:
- barcode-based product lookup
- ingredient text parsing and analysis
- ingredient detail retrieval
- re-analysis support
- scoring/versioning consistency

The backend should isolate the client from direct scientific logic and from prototype-specific frontend concerns.

---

## 2. Recommended Near-Term Architecture

## Option A: Recommended pragmatic path
Use:
- Firebase as the initial data store / auth platform
- a lightweight API/service layer in front of Firebase
- Gemini or equivalent model access only through backend services

### Why this is recommended
- fastest path from current prototype state
- leverages current Firebase-oriented data
- avoids forcing the iOS app to talk directly to Firestore for business logic
- keeps future migration options open

## Option B: Cleaner but slower path
Use:
- Postgres + API service
- optional Firebase Auth later

### Why not first
- more migration work immediately
- slower time to first native integration
- more backend setup overhead right now

### Current recommendation
Start with **Option A** unless data complexity or existing Firebase quality turns out to be much worse than expected.

---

## 3. Backend Layers

### 3.1 API layer
Responsibilities:
- validate requests
- orchestrate lookups and analysis flows
- map backend/domain data into API response contracts
- normalize errors
- attach score version metadata

### 3.2 Domain services layer
Responsibilities:
- barcode lookup orchestration
- ingredient text parsing orchestration
- product scoring
- ingredient detail assembly
- re-analysis workflows

### 3.3 Data access layer
Responsibilities:
- Firestore/product store access
- ingredient data access
- evidence/study retrieval
- alias/mapping lookup
- cache lookup/write-through behavior if implemented server-side

### 3.4 AI integration layer
Responsibilities:
- ambiguous ingredient resolution
- rationale generation
- optional evidence summarization

Important:
- AI should not be the sole authority for score assignment
- AI outputs should be normalized into structured backend records

---

## 4. Proposed Service Modules

### 4.1 ProductLookupService
Used by:
- `POST /v1/products/lookup-barcode`

Responsibilities:
- validate barcode
- check internal product store
- optionally fall back to external product source later
- return normalized product if found
- return `found: false` if absent

### 4.2 IngredientParsingService
Used by:
- `POST /v1/analysis/ingredients-text`

Responsibilities:
- clean input text
- isolate ingredient section
- tokenize ingredients
- build nested ingredient tree
- identify unresolved ingredients

### 4.3 IngredientCanonicalizationService
Used by:
- parsing flow
- re-analysis

Responsibilities:
- match aliases/synonyms to canonical ingredient IDs
- return match type + confidence
- preserve unknown ingredients explicitly

### 4.4 ScoringService
Used by:
- analysis flow
- re-analysis

Responsibilities:
- compute ingredient-informed product score
- assign confidence level
- produce summary, explanation, concerns, positives
- attach score version metadata

### 4.5 IngredientDetailService
Used by:
- `GET /v1/ingredients/{ingredientId}`

Responsibilities:
- fetch canonical ingredient record
- fetch linked studies/evidence
- assemble complete ingredient detail payload

### 4.6 ReanalysisService
Used by:
- `POST /v1/products/{productId}/reanalyze`

Responsibilities:
- fetch raw product input / prior data
- rerun parsing and scoring with latest versions
- update stored product record
- return updated analysis

---

## 5. Data Storage Mapping (Firebase-first path)

## 5.1 Firestore collections (proposed)

### `products`
Stores:
- product ID
- barcode
- name
- brand
- raw ingredient text
- normalized analysis payload
- score version metadata
- timestamps

### `ingredients`
Stores:
- canonical ingredient profile
- aliases
- scoring fields
- evidence summary fields
- confidence
- evidence type
- timestamps

### `ingredientMappings`
Stores:
- raw label alias
- canonical ingredient ID
- confidence
- status
- reasoning
- timestamps

### `studies`
Option A:
- embedded per ingredient for simplicity

Option B:
- standalone collection keyed by ingredientId + studyId

Recommendation:
- start simple if current data is small
- move to dedicated collection if evidence/query complexity grows

### `scoreVersions`
Stores:
- current active model/scoring versions
- historical versions
- release notes / model notes

---

## 6. Request Flow Mapping

## 6.1 Barcode lookup flow
1. API validates barcode
2. ProductLookupService queries `products`
3. If found, response is assembled and returned
4. If not found, return `found: false`
5. Optional future step: call external product DB, enrich, store, return

## 6.2 Ingredient text analysis flow
1. API validates `rawText`
2. IngredientParsingService tokenizes and structures input
3. IngredientCanonicalizationService resolves ingredients
4. ScoringService computes analysis
5. API returns normalized ingredients + analysis + version metadata
6. Optional: store derived product analysis if appropriate

## 6.3 Ingredient detail flow
1. API fetches ingredient from `ingredients`
2. Fetch related studies/evidence
3. Return assembled payload

## 6.4 Reanalysis flow
1. API fetches product
2. extract raw ingredient text / stored inputs
3. rerun parsing + canonicalization + scoring
4. write updated analysis back to `products`
5. return updated product

---

## 7. Scoring Implementation Direction

### Recommended rule
Use deterministic scoring backed by curated ingredient data.

### Product score inputs
- ingredient scores
- ingredient order
- unresolved ingredients
- compound ingredients
- additive flags
- confidence penalties

### AI usage
AI may assist with:
- alias resolution in unresolved cases
- explanation wording
- evidence summarization

AI should not directly invent the final score without structured guardrails.

---

## 8. Versioning Strategy

Every stored analysis should carry:
- parser version
- ingredient model version
- scoring rules version
- rationale version

### Why
- enables reanalysis later
- makes score provenance visible
- prevents silent changes from becoming impossible to debug

---

## 9. Recommended MVP Backend Implementation Order

### Step 1
Implement read-oriented endpoints first:
- barcode lookup
- ingredient detail

### Step 2
Implement ingredient text analysis
- parser
- canonicalizer
- scoring response assembly

### Step 3
Implement reanalysis support
- product reload
- rerun latest scoring

### Step 4
Add optional admin/review workflows later
- unknown ingredient review
- score model tuning
- evidence refresh tools

---

## 10. Firebase Fit Assessment

## Firebase is a good near-term fit for:
- moving fast
- storing product records
- storing ingredient records
- simple sync and document retrieval
- bootstrapping a small team/product

## Firebase is weaker for:
- highly relational evidence queries
- complex analytics over studies/ingredients/products
- scientific/admin workflows with many joins

### Conclusion
Firebase is acceptable for v2 initial implementation if hidden behind an API layer.

That API layer is what prevents today’s choice from becoming tomorrow’s trap.

---

## 11. Backend Access Needed Later

Once implementation starts, likely required access includes:
- Firebase project config
- Firestore collections / schema visibility
- rules/config access
- Gemini/backend runtime config
- hosting/function environment if applicable

Not required for architecture/spec work.

---

## 12. Suggested Runtime Shape

Possible implementation options:

### Option 1
Node/TypeScript API layer
- natural fit with current web prototype ecosystem
- easier sharing of some parsing logic if desired

### Option 2
Python/FastAPI API layer
- clean for service-oriented backend work
- good for scientific/data workflows

### Recommendation
Pick the runtime based on your implementation comfort later.

For now, the key decision is **API layer in front of Firebase**, not the exact language.

---

## 13. Risks to Watch

### Technical
- messy legacy Firebase data
- unresolved ingredient alias quality
- AI overreach in parsing/scoring path
- latency if analysis path becomes too model-heavy

### Product
- score trust if methodology is opaque
- overclaiming health impact
- user confusion around ambiguous ingredients

---

## 14. Immediate Next Step After This Plan

After this implementation plan, the next strongest move is:

- either create a backend task breakdown
- or continue tightening the native client to align with these backend contracts

### My recommendation
Continue client-side alignment next, then request real backend access only when we are ready to implement against a chosen backend path.
