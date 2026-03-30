# FIREBASE RECOVERY NOTES

## Recovery status
Mac Claw successfully authenticated to Firebase CLI and inspected live Firebase project state.

## Relevant Firebase projects discovered

### 1. `ingrediscore`
- Display name: `Ingrediscore`
- Current status: mostly empty for backend purposes
- No registered apps found
- No Firestore database found
- Has hosting site only

### 2. `just-keyword-477517-m5`
- Display name: `My First Project`
- **This appears to be the real historical IngrediScore backend**
- Registered apps found:
  - iOS app: `1:889797304437:ios:b1874183a6a1317904d83c`
  - Web app: `1:889797304437:web:6ef79da721615d1404d83c`
- Firestore database found:
  - `projects/just-keyword-477517-m5/databases/ai-studio-38be78cd-dd16-4388-b437-a416b88e1f0c`
- Hosting site exists

## Important compatibility note
The historical Firebase iOS app is registered with bundle identifier:
- `com.ashlynn.foodscanner`

The current native SwiftUI app uses:
- `com.jonathan.ingrediscore`

This means the clean reconnection path is likely:
1. register a new iOS Firebase app for `com.jonathan.ingrediscore`
2. download a fresh `GoogleService-Info.plist`
3. integrate Firebase SDK into the native app

## Recovered web Firebase config (`just-keyword-477517-m5`)
```json
{
  "projectId": "just-keyword-477517-m5",
  "appId": "1:889797304437:web:6ef79da721615d1404d83c",
  "storageBucket": "just-keyword-477517-m5.firebasestorage.app",
  "apiKey": "[recovered via CLI]",
  "authDomain": "just-keyword-477517-m5.firebaseapp.com",
  "messagingSenderId": "889797304437",
  "projectNumber": "889797304437"
}
```

## Recovered Firestore collection list
Live Firestore collections in the historical backend:
- `facts`
- `ingredientMappings`
- `ingredients`
- `leaderboard`
- `products`
- `users`

## Observed schema samples

### `ingredients`
Observed fields include:
- `id`
- `name`
- `category`
- `score`
- `scoreReasoning`
- `summaryShort`
- `positives`
- `negatives`
- `evidenceOverview`
- `confidenceLevel`
- `evidenceType`
- `studies`
- `status`
- `studyQualitySummary`
- `regulatoryWeight`
- `regulatoryConsensus`
- `evidenceStrength`
- `humanEvidence`
- `expertSources`
- `evolvingEvidence`
- `evolvingEvidenceNote`
- `lastReviewed`
- `lastScientificRefresh`
- `updatedAt`
- `synonyms`

### `products`
Observed fields include:
- `barcode`
- `name`
- `brand`
- `ingredientsRaw`
- `ingredientsParsed`
- `score`
- `summary`
- `status`
- `frontImage`
- `nutritionImage`
- `ingredientsImage`
- `analysis`
- `createdBy`
- `scannedAt`
- `updatedAt`

### `ingredientMappings`
Observed fields include:
- `originalName`
- `mappedId`
- `confidence`
- `status`
- `reasoning`
- `updatedAt`

### `leaderboard`
Observed fields include:
- `uid`
- `displayName`
- `photoURL`
- `count`
- `updatedAt`

### `users`
Observed fields include:
- `uid`
- `displayName`
- `photoURL`
- `lastLogin`
- `updatedAt`

### `facts`
Observed fields include:
- `fact`
- `category`
- `createdAt`

## Implication for native app
The historical backend already has rich ingredient/product/evidence data. The native app does **not** need to invent a new backend model first; it should reconnect to this one.

## Recommended next steps
1. Register current native bundle ID (`com.jonathan.ingrediscore`) as a Firebase iOS app in `just-keyword-477517-m5`
2. Download `GoogleService-Info.plist`
3. Add Firebase iOS SDK (Firestore/Auth/Storage as needed) to the Xcode project
4. Create Firebase-backed repositories to replace or sit alongside `MockProductRepository` / `MockAnalysisRepository`
5. Map Firestore documents into native `Product`, `ProductAnalysis`, `Ingredient`, and related models
6. Start by reading live `ingredients` + `products`, then add writes/auth later
