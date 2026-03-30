# BLOCKERS

## Active blockers
- No hard technical blocker for workspace build or simulator launch: the app builds successfully through `IngrediScore.xcworkspace`.
- Native/web parity is still incomplete across multiple screens and flows.
- The Scan flow now has real camera plumbing, but still needs runtime validation on device/simulator and likely more polish around permission, overlay UX, and success/fallback transitions.
- OCR/image-based product capture still needs to be rebuilt beyond the current fallback routing.
- Ingredient text analysis / OCR flow is not yet wired to Firebase-backed live analysis.
- Some native models are still simplified relative to the full historical Firestore schema, so live mapping currently uses a pragmatic adapter layer rather than a full-fidelity model overhaul.
- App resources and branding are still placeholder-level rather than final product assets.
- New shell pages exist now, but they are still first-pass implementations and do not yet fully match the original web app’s visual polish or all linked destinations.
- Search/library behavior is improving, but still needs richer filtering, better result density, and larger-library UX polish to fully match the original product intent.
- Firebase startup/log cleanliness still needs follow-up; earlier runtime logs suggested initialization/lifecycle cleanup is not fully polished.

## Decisions that may be needed soon
- Whether to fully retire the REST bridge now that the Firebase SDK path is working for collection reads
- Final bundle identifier if different from `com.jonathan.ingrediscore`
- Minimum iOS deployment target
- Apple signing team / provisioning setup for device builds
- Whether to keep the generated project structure as-is or replace it with a cleaner hand-authored/project-generator-backed setup
- Final app icon / launch asset / branding direction
- Which major flow should be prioritized immediately after the camera-backed scan step (OCR/manual capture, leaderboard/auth, history sync, etc.)

## Rule
When a blocker cannot be resolved autonomously, add it here with:
- what is blocked
- why it is blocked
- what options exist
- what Jonathan needs to decide
