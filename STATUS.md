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
- A new Firebase iOS app registration for the current bundle ID now exists, and `GoogleService-Info.plist` for `com.jonathan.ingrediscore` has been added to the native Xcode project resources.

## Current objective
Integrate Firebase SDK into the native iOS app and begin replacing mock repositories with Firebase-backed repositories that read from the recovered historical backend.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
