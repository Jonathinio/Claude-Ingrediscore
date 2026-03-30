# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- A real Xcode project exists in `IngrediScore/IngrediScore.xcodeproj`.
- The SwiftUI app shell builds and launches successfully in Simulator.
- The app has entered the parity-reconstruction phase against `reference/web-prototype/`.
- A concrete parity gap list now exists in `PARITY_GAP_LIST.md`.
- Firebase backend recovery is confirmed: the real historical backend appears to be the project `just-keyword-477517-m5`, and the live Firestore schema has been inspected/documented in `FIREBASE_RECOVERY_NOTES.md`.
- `GoogleService-Info.plist` for `com.jonathan.ingrediscore` has been added to the native project.
- First backend reconnection pass is now implemented: the app compiles with a read-only Firestore REST adapter and Firebase-backed repositories for barcode product lookup and ingredient detail retrieval.

## Current objective
Validate and expand the first live backend path so the native app increasingly uses recovered Firebase data instead of mock scaffold data.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
