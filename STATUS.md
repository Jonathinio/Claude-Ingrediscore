# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- The native iOS app now has both an Xcode project and a CocoaPods-backed workspace; the canonical build entry point is `IngrediScore/IngrediScore.xcworkspace`.
- The SwiftUI app shell builds and launches successfully in Simulator.
- The app has entered the parity-reconstruction phase against `reference/web-prototype/`.
- A concrete parity gap list now exists in `PARITY_GAP_LIST.md`.
- Firebase backend recovery is confirmed.
- Home/dashboard, product result, ingredient detail, and shell parity restoration have all started.
- A major backend milestone is now complete: the real Firebase iOS SDK (FirebaseCore, FirebaseAuth, FirebaseFirestore via CocoaPods) is integrated, Firebase is configured at app startup, and collection-backed Search/Food reads now use the correct named Firestore database instead of `(default)`.
- Runtime proof now exists that live backend data is surfacing in the app: Search loaded 200 ingredients and Food loaded 13 products before the ingredient cap was raised.
- The ingredient collection fetch cap has now been raised from 200 to 1000 so more of the recovered library can surface in Search.

## Current objective
Keep expanding visible use of the recovered Firebase dataset throughout the native UI while continuing shell/parity refinement on top of real data.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
