# IngrediScore v2 Technical Specification

This document translates the v2 blueprint into implementation-oriented specifications for the native iOS rebuild.

---

## 1. Objective

Build IngrediScore as a native iOS app with production-oriented architecture, fast label/barcode scanning, explainable ingredient scoring, local caching, and a backend-supported analysis pipeline suitable for future App Store release.

---

## 2. Scope of v2 Initial Release

### In scope
- native iOS app
- barcode scanning
- ingredient label scanning via camera
- on-device OCR extraction
- backend-assisted parsing and scoring
- product result screen
- ingredient detail screen
- local scan history/cache
- confidence-aware explanations
- evidence summary display

### Out of scope for initial release
- social/community features
- leaderboard
- crowdsourced moderation UI
- Android app
- full in-app admin/reviewer tools
- advanced personalization/recommendation systems

---

## 3. iOS App Architecture

## 3.1 Architectural pattern
Recommended pattern:
- SwiftUI + MVVM
- dependency-injected services
- domain models separate from transport DTOs
- repository layer for local/remote coordination

Optional evolution path:
- move to TCA later only if state complexity genuinely justifies it

## 3.2 App modules

### App module
Responsibilities:
- app lifecycle
- root navigation
- dependency container
- environment configuration

### Feature modules
- Home
- ScanBarcode
- ScanIngredients
- ProductResult
- IngredientDetail
- History
- Settings

### Domain module
- Product
- Ingredient
- EvidenceStudy
- ProductAnalysis
- ScoringVersion
- parsing/scoring abstractions

### Data module
- API client
- repositories
- local persistence models
- mappers
- image preprocessing helpers

### Shared module
- design system
- reusable components
- utilities
- error presentation

---

## 4. Proposed iOS Project Structure

```text
IngrediScore/
  App/
    IngrediScoreApp.swift
    AppRouter.swift
    AppEnvironment.swift
    DependencyContainer.swift

  Features/
    Home/
      HomeView.swift
      HomeViewModel.swift

    ScanBarcode/
      BarcodeScanView.swift
      BarcodeScanViewModel.swift
      BarcodeScannerService.swift

    ScanIngredients/
      IngredientScanView.swift
      IngredientScanViewModel.swift
      CameraCaptureView.swift
      OCRService.swift
      ImagePreprocessingService.swift

    ProductResult/
      ProductResultView.swift
      ProductResultViewModel.swift
      ScoreBadgeView.swift
      IngredientRowView.swift

    IngredientDetail/
      IngredientDetailView.swift
      IngredientDetailViewModel.swift
      EvidenceStudyCard.swift

    History/
      HistoryView.swift
      HistoryViewModel.swift

    Settings/
      SettingsView.swift
      SettingsViewModel.swift

  Domain/
    Models/
      Product.swift
      Ingredient.swift
      EvidenceStudy.swift
      ProductAnalysis.swift
      IngredientMatch.swift
      ScoringVersion.swift
    Protocols/
      ProductRepository.swift
      AnalysisRepository.swift

  Data/
    Remote/
      APIClient.swift
      DTOs/
      Endpoints/
    Local/
      CacheStore.swift
      SwiftDataModels.swift
      PersistenceController.swift
    Repositories/
      DefaultProductRepository.swift
      DefaultAnalysisRepository.swift
    Mappers/
      DTOMapper.swift

  Shared/
    Components/
    DesignSystem/
    Utilities/
    Extensions/

  Tests/
    Unit/
    Snapshot/
    Parsing/
    Scoring/
```

---

## 5. Native Scanning Stack

## 5.1 Barcode scanning
Use:
- AVFoundation metadata capture

Requirements:
- UPC/EAN support
- low-latency detection
- clear framing overlay
- haptic confirmation on successful scan
- safe handoff to result lookup

## 5.2 Ingredient label scanning
Use:
- AVFoundation for camera capture
- Vision for OCR (`VNRecognizeTextRequest`)

Requirements:
- guided capture overlay
- still-image capture rather than continuous OCR on every frame initially
- retake option
- crop/region prioritization for ingredient label area
- OCR confidence handling

## 5.3 OCR extraction pipeline
Flow:
1. capture image
2. apply lightweight preprocessing
3. run Vision OCR
4. aggregate text blocks
5. isolate likely ingredient section
6. pass cleaned text to backend

## 5.4 Preprocessing ideas
- contrast enhancement
- grayscale conversion where helpful
- crop to probable label region
- orientation correction
- downscaling for performance if needed

---

## 6. Backend / Service Boundary

The iOS app should not own full scientific parsing/scoring logic.

### Client sends
For barcode:
- barcode value
- optional locale
- optional app version / score version context

For ingredient scan:
- OCR text
- optional raw captured image reference in future
- optional extracted product name/brand if available

### Backend returns
- normalized product model
- ingredient matches
- product analysis
- confidence levels
- evidence summaries
- score version

### Why this boundary exists
- keeps scoring consistent across versions
- avoids client-side AI fragility
- enables future re-analysis without app updates
- centralizes scientific data maintenance

---

## 7. Proposed API Contracts

## 7.1 Barcode lookup
`POST /v1/products/lookup-barcode`

Request:
```json
{
  "barcode": "012345678905",
  "locale": "en-US"
}
```

Response:
```json
{
  "found": true,
  "product": { ... },
  "analysis": { ... },
  "source": "cache|database|external"
}
```

## 7.2 Ingredient text analysis
`POST /v1/analysis/ingredients-text`

Request:
```json
{
  "rawText": "Ingredients: water, sugar, citric acid, natural flavors...",
  "productName": "Optional",
  "brand": "Optional",
  "locale": "en-US"
}
```

Response:
```json
{
  "normalizedIngredients": [ ... ],
  "analysis": { ... },
  "scoreVersion": { ... }
}
```

## 7.3 Ingredient detail
`GET /v1/ingredients/{ingredientId}`

Response:
```json
{
  "ingredient": { ... },
  "studies": [ ... ]
}
```

## 7.4 Product detail refresh
`POST /v1/products/{productId}/reanalyze`

Use later for:
- score updates
- backend recalculation
- improved ingredient models

---

## 8. Swift Domain Models

## 8.1 Product
```swift
struct Product: Identifiable, Codable, Hashable {
    let id: String
    let barcode: String?
    let name: String
    let brand: String?
    let rawIngredientText: String?
    let analysis: ProductAnalysis?
    let imageRefs: ProductImageRefs?
    let updatedAt: Date
}
```

## 8.2 ProductAnalysis
```swift
struct ProductAnalysis: Codable, Hashable {
    let overallScore: Int
    let summary: String
    let scoreExplanation: String
    let confidenceLevel: ConfidenceLevel
    let evidenceBasis: String
    let keyConcerns: [String]
    let positiveAttributes: [String]
    let loweredScoreBy: [String]
    let improvedScoreBy: [String]
    let processingLevel: ProcessingLevel
    let ingredients: [IngredientMatch]
    let scoreVersion: ScoringVersion
}
```

## 8.3 Ingredient
```swift
struct Ingredient: Identifiable, Codable, Hashable {
    let id: String
    let canonicalName: String
    let aliases: [String]
    let category: IngredientCategory
    let score: Int
    let scoreReasoning: String
    let summaryShort: String
    let positives: [String]
    let negatives: [String]
    let evidenceOverview: String
    let confidenceLevel: ConfidenceLevel
    let evidenceType: EvidenceType
    let studies: [EvidenceStudy]
}
```

## 8.4 IngredientMatch
```swift
struct IngredientMatch: Identifiable, Codable, Hashable {
    let id: String
    let originalName: String
    let displayName: String
    let matchType: MatchType
    let confidence: ConfidenceLevel
    let ingredient: Ingredient?
    let subIngredients: [IngredientMatch]
}
```

## 8.5 EvidenceStudy
```swift
struct EvidenceStudy: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let authors: String?
    let journal: String?
    let year: Int?
    let type: String
    let quality: StudyQuality
    let populationType: PopulationType
    let sampleSize: String?
    let duration: String?
    let keyFindings: String
    let limitations: String
    let url: URL?
    let pmid: String?
}
```

---

## 9. Local Persistence Strategy

## 9.1 Store locally
- recent scanned products
- recent ingredient details
- result summaries
- timestamps / cache freshness

## 9.2 Do not require local storage of everything
The app does not need a full mirror of the backend for MVP.

## 9.3 Cache policy
Suggested policy:
- barcode results cached for quick repeat access
- scanned ingredient analyses cached locally
- stale data may be refreshed silently in background when online

## 9.4 Offline behavior
MVP offline behavior:
- users can view previously scanned/cached products
- OCR may still run locally
- full fresh analysis requires network
- show explicit "offline / cached result" label where needed

---

## 10. Repository Design

## 10.1 ProductRepository
Responsibilities:
- lookup product by barcode
- fetch cached product
- save viewed/scanned product locally
- refresh product from backend

## 10.2 AnalysisRepository
Responsibilities:
- submit OCR text for analysis
- fetch ingredient detail
- fetch refreshed product analysis

## 10.3 CacheStore
Responsibilities:
- local save/load
- eviction policy
- cache freshness metadata

---

## 11. UX and Performance Targets

## 11.1 Performance targets
- barcode detect: near-instant once code is visible
- OCR capture to extracted text: ideally under 1.5 seconds on modern devices
- cached product load: under 300 ms perceived
- remote analysis result: ideally under 2 seconds on a good path

## 11.2 UX principles
- show progress clearly
- avoid long blank waits
- return partial structure early where possible
- allow retakes quickly
- explain uncertainty instead of hiding it

## 11.3 Loading states
For ingredient scan:
- Capturing image...
- Reading label...
- Parsing ingredients...
- Scoring product...

For barcode scan:
- Scanning...
- Looking up product...
- Analyzing result...

---

## 12. Error Handling

## 12.1 Categories
- camera permission errors
- OCR failure / unreadable label
- no barcode result found
- backend timeout
- unsupported product data
- low-confidence parse result

## 12.2 UX response
- actionable messages
- retry paths
- retake flow
- fallback to manual entry later if needed (not MVP-required)

---

## 13. Security and Privacy Direction

### Principles
- avoid storing unnecessary raw images long-term unless product strategy explicitly needs it
- keep AI keys out of client app
- route sensitive model access through backend when possible
- present clear educational / non-medical disclaimer

### Client secret rule
The native app should not embed privileged API keys for complex backend or model orchestration.

---

## 14. Testing Strategy

## 14.1 Unit tests
- model decoding
- repository logic
- cache behavior
- mappers

## 14.2 Parsing/scoring tests
Even if backend-owned, maintain fixture-based tests for:
- nested ingredients
- grouping labels
- OCR noise cleanup expectations
- score output shape validation

## 14.3 UI tests
- scan flow navigation
- product detail rendering
- offline cache read path

## 14.4 Device testing
Required before release:
- multiple iPhone sizes
- real barcode packaging
- ingredient labels under varied lighting
- camera permissions
- poor network conditions

---

## 15. Release-Oriented Constraints

To be considered App Store-ready later, the app should eventually include:
- polished native navigation and camera UX
- privacy policy
- disclaimer language
- crash reporting / observability
- accessibility pass
- branding assets
- App Store metadata package

These are not all required before code starts, but the architecture must support them.

---

## 16. First Milestone Implementation Plan

## Milestone 1 goal
A native iOS skeleton that can:
- launch
- navigate between key screens
- scan a barcode locally
- capture an ingredient label image
- run local OCR
- display mocked product analysis results
- save/reload local mock history

### Milestone 1 deliverables
- SwiftUI app shell
- navigation router
- design system primitives
- barcode scan feature
- ingredient scan feature with OCR service
- mocked repositories
- local cache scaffolding
- sample result/detail/history screens

### Why mocked first
This lets us validate native UX before backend entanglement.

---

## 17. Milestone 2 Implementation Plan

Goal:
- wire app to real backend contracts
- replace mocks with live data flows

Deliverables:
- API client
- DTO mapping
- barcode lookup integration
- OCR text analysis integration
- real ingredient detail fetch
- cached remote results

---

## 18. Recommended Immediate Next Action

After this tech spec, the next best move is:

**Create the native iOS project scaffold and first milestone file structure**

That is the first code-producing step that directly advances the rebuild.
