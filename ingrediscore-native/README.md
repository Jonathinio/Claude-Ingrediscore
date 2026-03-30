# IngrediScore Native iOS Scaffold

This folder contains the first native iOS rebuild scaffold for IngrediScore.

## Purpose

This is not yet a buildable Xcode project. It is the source-layout and milestone scaffold for the native Swift/SwiftUI app, created in a workspace that currently does not have Xcode or Swift installed.

It is intended to:
- define the native file structure
- establish app/module boundaries
- provide starter Swift source files
- make the later transition into Xcode straightforward

## Current limitations

This machine currently does not have:
- `xcodebuild`
- `swift`

So the scaffold can be authored here, but a real `.xcodeproj` / build/test cycle will need to happen on a Mac with Xcode.

## Milestone 1 goal

A native iOS app shell that can eventually:
- launch
- navigate key screens
- scan barcodes locally
- capture ingredient labels
- run on-device OCR
- render mocked product analysis
- store mocked history locally

## Structure

- `App/` app entry and routing
- `Features/` screen-level modules
- `Domain/` pure app models/protocols
- `Data/` local/remote/repository layers
- `Shared/` reusable components/utilities
- `Docs/` implementation notes
- `Tests/` planned test directories

## Next step on a Mac

1. Create a new Xcode iOS app project named `IngrediScore`
2. Add these folders/files into the project
3. Set up targets and bundle identifier
4. Begin wiring the first milestone UI and services
