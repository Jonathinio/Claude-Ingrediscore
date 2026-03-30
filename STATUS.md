# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- The native iOS app now has both an Xcode project and a CocoaPods-backed workspace; the canonical build entry point is `IngrediScore/IngrediScore.xcworkspace`.
- The SwiftUI app shell builds and launches successfully in Simulator.
- The app has entered the parity-reconstruction phase against `reference/web-prototype/`.
- A concrete parity gap list now exists in `PARITY_GAP_LIST.md`.
- A shared repo product blueprint now exists in `PRODUCT_SPEC.md`.
- Firebase backend recovery is confirmed.
- Home/dashboard, product result, ingredient detail, and shell parity restoration have all started.
- The real Firebase iOS SDK is integrated, Search/Food use the correct named Firestore database, and live backend data is surfacing in the app.
- Home dashboard stats now use backend-driven ingredient and evidence totals.
- Search has now moved beyond a bare list into a more real ingredient-library surface with live ingredient loading, sorting, category chips, and visible filtered-count behavior.

## Current objective
Use the recovered Firebase dataset plus the new product spec to deepen Search/library behavior and continue rebuilding the app’s core flows on top of real data.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
