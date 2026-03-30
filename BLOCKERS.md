# BLOCKERS

## Active blockers
- No hard technical blocker for workspace build or simulator launch: the app now builds successfully through `IngrediScore.xcworkspace`.
- Native/web parity is still incomplete across multiple screens and flows.
- Ingredient text analysis / OCR flow is not yet wired to Firebase-backed live analysis.
- Some native models are still simplified relative to the full historical Firestore schema, so live mapping currently uses a pragmatic adapter layer rather than a full-fidelity model overhaul.
- App resources and branding are still placeholder-level rather than final product assets.
- New shell pages exist now, but they are still first-pass implementations and do not yet fully match the original web app’s visual polish or all linked destinations.
- Search/Food backend visibility is now working, but search/library UX still needs better scaling and polish for the larger recovered ingredient dataset.

## Decisions that may be needed soon
- Whether to fully retire the REST bridge now that the Firebase SDK path is working for collection reads
- Final bundle identifier if different from `com.jonathan.ingrediscore`
- Minimum iOS deployment target
- Apple signing team / provisioning setup for device builds
- Whether to keep the generated project structure as-is or replace it with a cleaner hand-authored/project-generator-backed setup
- Final app icon / launch asset / branding direction
- Which shell area should be prioritized next after backend visibility is confirmed (scan flow, search/library depth, menu/info pages, contributor/support pages, etc.)

## Rule
When a blocker cannot be resolved autonomously, add it here with:
- what is blocked
- why it is blocked
- what options exist
- what Jonathan needs to decide
