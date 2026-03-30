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
- A major backend milestone is complete: the real Firebase iOS SDK is integrated, Search/Food now use the correct named Firestore database, and live backend data is surfacing in the app.
- Home dashboard stats have now been corrected to use backend-driven totals: `Ingredients` reflects live ingredient count and `Clinical Evidence` reflects the summed study count across loaded ingredient profiles.

## Current objective
Keep expanding visible use of the recovered Firebase dataset throughout the native UI while continuing shell/parity refinement on top of real data.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
