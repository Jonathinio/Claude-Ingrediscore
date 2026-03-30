# SwiftData / Core Data Plan

## Recommended initial direction
Use SwiftData first unless Xcode/runtime constraints force Core Data.

## Local entities to model
- CachedProduct
- CachedIngredient
- CacheMetadata

## CachedProduct fields
- id
- barcode
- name
- brand
- rawIngredientText
- analysisBlob / structured fields
- updatedAt
- lastViewedAt

## CachedIngredient fields
- id
- canonicalName
- score
- summaryShort
- serialized detail payload
- updatedAt

## CacheMetadata fields
- key
- value
- updatedAt

## Strategy
- store recent products locally for fast history
- keep ingredient detail cache opportunistic
- allow background refresh when online
- do not attempt full backend mirroring for MVP

## Migration path
Start with in-memory cache in scaffold -> replace with SwiftData persistence once on Mac/Xcode.
