# IngrediScore Backend Task Breakdown

This document turns the backend plan into actionable implementation work.

---

## Phase 1: Foundation

### 1.1 Choose backend runtime
Tasks:
- choose Node/TypeScript or Python/FastAPI
- create backend repo/service structure
- define environment config pattern
- define base URL strategy for iOS app

### 1.2 Establish API skeleton
Tasks:
- create `/v1` route group
- add health check endpoint
- add JSON error middleware / handler
- define request logging approach
- define timeout behavior

### 1.3 Define score version source
Tasks:
- create scoreVersions store/schema
- define active version lookup
- define version payload format used in all analysis responses

---

## Phase 2: Product lookup

### 2.1 Barcode lookup endpoint
Endpoint:
- `POST /v1/products/lookup-barcode`

Tasks:
- validate barcode input
- query product store by barcode
- map stored product to API contract
- return `found: false` when absent
- add tests for found/not-found cases

### 2.2 Product detail endpoint
Endpoint:
- `GET /v1/products/{productId}`

Tasks:
- validate product ID
- fetch stored product
- return structured not-found error when missing
- test detail retrieval

---

## Phase 3: Ingredient data

### 3.1 Ingredient detail endpoint
Endpoint:
- `GET /v1/ingredients/{ingredientId}`

Tasks:
- fetch canonical ingredient
- fetch attached studies/evidence
- map to contract
- handle not-found cleanly
- add tests for ingredient detail payloads

### 3.2 Ingredient mapping store
Tasks:
- define alias-to-canonical lookup pattern
- normalize alias casing/whitespace strategy
- define confidence/status fields
- define admin/review follow-up path for unresolved aliases

---

## Phase 4: Ingredient text analysis

### 4.1 Input validation
Endpoint:
- `POST /v1/analysis/ingredients-text`

Tasks:
- reject empty text
- reject obviously non-ingredient text
- normalize whitespace and punctuation
- preserve original text for internal debugging if needed

### 4.2 Parsing service
Tasks:
- isolate ingredient section
- split top-level ingredients
- preserve parentheses/nested groups
- support "contains less than 2%" style clauses
- output ingredient tree structure
- add parser fixtures/tests

### 4.3 Canonicalization service
Tasks:
- exact canonical match
- alias/synonym match
- unresolved ingredient representation
- confidence assignment
- optional AI-assisted fallback path for unresolved ingredients

### 4.4 Scoring service
Tasks:
- aggregate ingredient scores
- weight by ingredient order
- apply ambiguity/confidence penalties
- produce summary/explanation/concerns/positives
- attach score version payload
- add scoring test fixtures

### 4.5 Response assembly
Tasks:
- map ingredient tree + analysis to contract
- return deterministic payloads
- ensure unknown ingredients do not crash flow

---

## Phase 5: Reanalysis

### 5.1 Reanalysis endpoint
Endpoint:
- `POST /v1/products/{productId}/reanalyze`

Tasks:
- fetch stored product inputs
- rerun parser + canonicalizer + scorer
- write updated analysis
- return updated product
- add tests for version changes / updated output

---

## Phase 6: Firebase integration (if chosen)

### 6.1 Firestore mapping
Tasks:
- confirm collections actually in use
- map `products`, `ingredients`, `ingredientMappings`, `scoreVersions`
- define study storage pattern
- clean prototype-only fields if necessary

### 6.2 Access rules and service identity
Tasks:
- choose server-side credentials flow
- avoid exposing Firestore business logic directly to app client
- ensure backend service can read/write required collections

### 6.3 Data quality pass
Tasks:
- inspect existing ingredient records
- inspect existing alias mappings
- inspect product payload consistency
- identify fields that need migration or normalization

---

## Phase 7: Quality and observability

### 7.1 Error handling
Tasks:
- map internal failures to structured API errors
- add retryable flag rules
- add timeout and rate-limit responses

### 7.2 Logging / observability
Tasks:
- request IDs
- latency measurement
- analysis path logging
- upstream/model failure visibility

### 7.3 Tests
Tasks:
- endpoint tests
- parser fixtures
- scoring fixtures
- DTO contract tests
- unknown ingredient cases
- compound ingredient cases

---

## Phase 8: Nice-to-have follow-ups

### 8.1 External product enrichment
Tasks:
- integrate external barcode/product source
- normalize imported product data
- cache/store enriched product records

### 8.2 Admin/reviewer tooling
Tasks:
- review unresolved ingredients
- approve alias mappings
- revise ingredient evidence
- trigger bulk reanalysis

---

## Recommended implementation order
1. API skeleton
2. score version store
3. barcode lookup
4. ingredient detail
5. parser
6. canonicalization
7. scoring
8. ingredient text analysis endpoint
9. reanalysis endpoint
10. data quality pass
11. observability hardening
