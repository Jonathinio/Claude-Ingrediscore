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
- Search has moved beyond a bare list into a more real ingredient-library surface.
- Scan behavior now opens directly into barcode-first flow.
- A first real native camera-backed scanner layer is now in place: camera usage description, AVCapture session setup, live preview plumbing, and barcode metadata detection all compile successfully in the workspace build.

## Current objective
Keep turning the corrected barcode-first Scan flow into a real usable native scanner while continuing backend and parity work on top of the recovered product data.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
