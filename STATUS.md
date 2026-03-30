# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- A real Xcode project now exists in `IngrediScore/IngrediScore.xcodeproj`.
- The SwiftUI app shell has been created and wired to the existing native scaffold.
- Mac Claw verified a successful simulator build with `xcodebuild -project IngrediScore/IngrediScore.xcodeproj -scheme IngrediScore -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.3.1' build`.
- Mac Claw also installed and launched the app successfully in the iPhone 17 simulator via `simctl`.
- Concurrency-safety fixes were applied so the scaffold builds cleanly under the current Xcode/Swift toolchain.
- The project currently still relies on a somewhat awkward nested resource path layout inside `IngrediScore/IngrediScore/IngrediScore/` for assets/preview resources; this is functional but not yet cleaned up.

## Current objective
Move from the first running app shell to a cleaner, more maintainable Xcode project structure while preserving a working simulator launch path.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
