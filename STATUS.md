# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- A real Xcode project exists in `IngrediScore/IngrediScore.xcodeproj`.
- The SwiftUI app shell builds and launches successfully in Simulator.
- The app has now entered the parity-reconstruction phase against `reference/web-prototype/`.
- A concrete parity gap list now exists in `PARITY_GAP_LIST.md`.
- First parity restoration pass is underway: the native home screen has been rebuilt from a plain list into a more branded, card-based dashboard that is materially closer to the web prototype’s structure and tone.

## Current objective
Continue closing the parity gap between the native SwiftUI app and the web prototype, starting with visual structure and key interaction flows.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
