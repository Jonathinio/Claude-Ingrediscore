# Prototype to Native Migration Map

## Purpose
Map important concepts from the current hybrid prototype into the native iOS rebuild.

## Keep as product references
- home / scan / result / detail / history flow
- score explanation concepts
- ingredient breakdown concepts
- evidence summary concepts
- confidence messaging concepts

## Replace with native modules
- web camera flow -> `Features/ScanIngredients` + AVFoundation/Vision
- html5-qrcode flow -> `Features/ScanBarcode` + AVFoundation
- giant `App.tsx` -> modular SwiftUI feature views + view models
- IndexedDB cache -> SwiftData/Core Data
- client-side AI orchestration -> backend API + repositories

## Domain shapes worth preserving conceptually
- Product
- ProductAnalysis
- Ingredient
- IngredientMatch
- EvidenceStudy
- ScoringVersion

## Backend assumptions to preserve carefully
- Firebase may remain initial cloud source
- local cache remains important
- AI remains assistive, not sole scoring authority

## Do not carry forward directly
- AI Studio key flows
- web permission handling UI
- browser-specific camera workarounds
- prototype-specific error handling tied to iframes / domains
