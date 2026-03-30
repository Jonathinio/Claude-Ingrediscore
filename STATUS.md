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
- A major app-shell restoration step is now in place: the native app has a real TabView-based bottom navigation shell with Home, Search, Scan, Food, and Menu tabs, plus first-pass native shell pages for Search, Food, Menu, About, and Scan hub.

## Current objective
Continue restoring the original app shell and UX structure around the now-improving native screens, while keeping the live backend reconnection path functional.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
