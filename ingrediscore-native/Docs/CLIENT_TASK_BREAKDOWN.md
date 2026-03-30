# Native Client Task Breakdown

## Phase 1: App shell
- finalize app environment bootstrapping
- finalize mock/live configuration approach
- keep root navigation stable

## Phase 2: Native scanning
- replace barcode prototype view with AVFoundation scanner
- replace ingredient text prototype with camera capture + Vision OCR
- implement scan overlays
- add retake/error states

## Phase 3: Local persistence
- replace in-memory cache with SwiftData/Core Data
- persist scan history
- define cache freshness metadata

## Phase 4: Live backend integration
- switch to live APIClient mode
- wire live repositories
- test DTO decoding against real endpoints
- add robust user-facing error states

## Phase 5: UX refinement
- loading polish
- confidence messaging polish
- evidence display refinement
- accessibility pass

## Phase 6: Release prep
- permissions strings
- app icon / branding
- privacy/disclaimer copy
- TestFlight prep
