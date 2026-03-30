# BLOCKERS

## Active blockers
- No hard technical blocker for workspace build or simulator launch: the app now builds successfully through `IngrediScore.xcworkspace`.
- Native/web parity is still incomplete across multiple screens and flows.
- The Scan tab now follows a better action-first structure, but true native barcode camera behavior is still not implemented yet.
- OCR/image-based product capture still needs to be rebuilt beyond the current fallback routing.
- Ingredient text analysis / OCR flow is not yet wired to Firebase-backed live analysis.
- Some native models are still simplified relative to the full historical Firestore schema, so live mapping currently uses a pragmatic adapter layer rather than a full-fidelity model overhaul.
- App resources and branding are still placeholder-level rather than final product assets.
- New shell pages exist now, but they are still first-pass implementations and do not yet fully match the original web app’s visual polish or all linked destinations.
- Search/library behavior is improving, but still needs richer filtering, better result density, and larger-library UX polish to fully match the original product intent.

## Decisions that may be needed soon
- Whether to fully retire the REST bridge now that the Firebase SDK path is working for collection reads
- Final bundle identifier if different from `com.jonathan.ingrediscore`
- Minimum iOS deployment target
- Apple signing team / provisioning setup for device builds
- Whether to keep the generated project structure as-is or replace it with a cleaner hand-authored/project-generator-backed setup
- Final app icon / launch asset / branding direction
- Which major flow should be prioritized immediately after this Scan correction (native barcode camera, OCR/manual analysis path, leaderboard/auth, history sync, etc.)

## Rule
When a blocker cannot be resolved autonomously, add it here with:
- what is blocked
- why it is blocked
- what options exist
- what Jonathan needs to decide
