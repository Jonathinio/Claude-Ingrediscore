# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- A real Xcode project now exists in `IngrediScore/IngrediScore.xcodeproj`.
- The SwiftUI app shell has been created and wired to the existing native scaffold.
- Mac Claw verified a successful simulator build with `xcodebuild -project IngrediScore/IngrediScore.xcodeproj -scheme IngrediScore -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build`.
- Concurrency-safety fixes were applied so the scaffold builds cleanly under the current Xcode/Swift toolchain.

## Current objective
Stabilize the newly created iOS app shell, reduce temporary project-generation hacks, and prepare for opening/running/debugging the app in Xcode with real product settings.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
