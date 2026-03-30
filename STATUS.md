# STATUS

## Current project state
- Shared coordination through the `Claude-Ingrediscore` repo is now working between Windows/WhatsApp Claw and Mac Claw.
- Default branch is `master`.
- Native iOS code currently lives in `ingrediscore-native/`.
- The native codebase is a scaffold, not yet a real Xcode app project.
- Mac Claw verified the Swift sources typecheck against the iPhone Simulator SDK.
- Mac Claw reported there is currently no `.xcodeproj`, `.xcworkspace`, `Package.swift`, or `Podfile` in the repo.
- Mac Claw made and committed one scaffold warning fix in `ingrediscore-native/Features/ScanIngredients/IngredientScanView.swift`.

## Current objective
Create a real buildable Xcode SwiftUI iOS app shell for IngrediScore, integrate the existing scaffold, and get the first simulator build working.

## Working model
- Mac Claw is the execution environment for Xcode/iOS work.
- Windows/WhatsApp Claw is the coordinator/planner.
- Shared truth for project state should live in this repo.
