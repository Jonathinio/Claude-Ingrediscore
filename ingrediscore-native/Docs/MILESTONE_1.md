# Milestone 1: Native App Shell

## Goal
Create the first native iOS milestone scaffold for IngrediScore.

## Included in this scaffold
- App entry point
- Navigation router
- App environment / dependency bootstrap
- Core domain models
- Repository protocols
- Mock repositories
- In-memory cache store
- Home screen
- Barcode scan prototype screen
- Ingredient scan prototype screen
- Product result screen
- Ingredient detail screen
- History screen
- Settings screen

## Important note
This is a source scaffold, not yet a buildable Xcode project, because the current machine does not have Xcode/Swift tooling installed.

## What gets replaced later
- text-field barcode prototype -> AVFoundation barcode scanner
- text-editor ingredient prototype -> camera capture + Vision OCR
- in-memory cache -> SwiftData/Core Data implementation
- mock repositories -> live API-backed repositories

## Success criteria for milestone 1
On a Mac/Xcode environment, the first buildable project should be able to:
- launch successfully
- navigate all scaffolded screens
- show mock analysis results
- persist viewed mock products locally
