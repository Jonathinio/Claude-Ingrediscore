# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- A real Xcode project exists in `IngrediScore/IngrediScore.xcodeproj`.
- The SwiftUI app shell builds and launches successfully in Simulator.
- The app has entered the parity-reconstruction phase against `reference/web-prototype/`.
- A concrete parity gap list now exists in `PARITY_GAP_LIST.md`.
- Firebase backend recovery is confirmed and the first live Firestore-backed native data path is implemented.
- Home/dashboard parity restoration has started.
- Product result parity restoration has started.
- Ingredient detail parity restoration has started.
- A first-pass bottom navigation/app shell restoration is in place.
- Backend reconnection has now advanced beyond single-document lookups: Search and Food screens are wired to repository methods that load ingredient/product collections from Firestore-backed list reads.

## Current objective
Make the recovered Firebase dataset visible and useful throughout the native app UI, while continuing shell/parity refinement on top of real data.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
