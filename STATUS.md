# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- A real Xcode project now exists in `IngrediScore/IngrediScore.xcodeproj`.
- The SwiftUI app shell has been created and wired to the existing native scaffold.
- Mac Claw verified a successful simulator build with `xcodebuild -project IngrediScore/IngrediScore.xcodeproj -scheme IngrediScore -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build`.
- Concurrency-safety fixes were applied so the scaffold builds cleanly under the current Xcode/Swift toolchain.
- The project currently still relies on a somewhat awkward nested resource path layout inside `IngrediScore/IngrediScore/IngrediScore/` for assets/preview resources; this is functional but not yet cleaned up.

## Current objective
Use the working native iOS app shell as the base, and drive it toward parity with the earlier web prototype by restoring the key flows, visual style, layout, and product feel in native SwiftUI.

## Reference source
- The earlier React/Vite/Capacitor prototype is now available in `reference/web-prototype/`.
- Treat it as the reference for product feel, screen structure, styling, and flow parity.
- The goal is to rebuild that experience natively rather than revert to the web runtime.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
