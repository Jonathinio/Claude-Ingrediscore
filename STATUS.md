# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- The native iOS app now has both an Xcode project and a CocoaPods-backed workspace; after Firebase SDK integration, the canonical build entry point is `IngrediScore/IngrediScore.xcworkspace`.
- The SwiftUI app shell builds and launches successfully in Simulator.
- The app has entered the parity-reconstruction phase against `reference/web-prototype/`.
- A concrete parity gap list now exists in `PARITY_GAP_LIST.md`.
- Firebase backend recovery is confirmed.
- Home/dashboard, product result, ingredient detail, and shell parity restoration have all started.
- A major backend milestone is now complete: the real Firebase iOS SDK (FirebaseCore, FirebaseAuth, FirebaseFirestore via CocoaPods) is integrated, Firebase is configured at app startup, and collection-backed Search/Food reads are now routed through Firestore SDK code instead of the rejected REST list bridge.

## Current objective
Runtime-verify that Search/Food now surface real Firebase-backed ingredient/product collections through the Firestore SDK path, then continue deepening backend coverage and UI parity on top of real data.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
