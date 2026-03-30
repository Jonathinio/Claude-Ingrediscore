# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- A real Xcode project exists in `IngrediScore/IngrediScore.xcodeproj`.
- The SwiftUI app shell builds and launches successfully in Simulator.
- The app has entered the parity-reconstruction phase against `reference/web-prototype/`.
- A concrete parity gap list now exists in `PARITY_GAP_LIST.md`.
- First parity restoration pass is underway on the native UI.
- Firebase backend recovery is now confirmed: the real historical backend appears to be the project `just-keyword-477517-m5`, and the live Firestore schema has been inspected/documented in `FIREBASE_RECOVERY_NOTES.md`.

## Current objective
Reconnect the native SwiftUI app to the recovered historical Firebase backend while continuing parity reconstruction against the web prototype.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
