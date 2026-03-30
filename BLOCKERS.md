# BLOCKERS

## Active blockers
- No hard technical blocker for simulator build or first launch: the project builds successfully.
- Native/web parity is still incomplete across multiple screens and flows.
- Firebase is not yet integrated through the full native SDK; the current reconnection path uses a read-only Firestore REST adapter as the fastest working bridge.
- Ingredient text analysis / OCR flow is not yet wired to Firebase-backed live analysis.
- Some native models are still simplified relative to the full historical Firestore schema, so live mapping currently uses a pragmatic adapter layer rather than a full-fidelity model overhaul.
- App resources and branding are still placeholder-level rather than final product assets.

## Decisions that may be needed soon
- Whether to keep the REST-bridge approach temporarily or invest immediately in full Firebase SDK integration
- Final bundle identifier if different from `com.jonathan.ingrediscore`
- Minimum iOS deployment target
- Apple signing team / provisioning setup for device builds
- Whether to keep the generated project structure as-is or replace it with a cleaner hand-authored/project-generator-backed setup
- Final app icon / launch asset / branding direction
- Which major parity flow should be prioritized after home/product result/ingredient detail parity (scan flow, search/library, bottom navigation shell, etc.)

## Rule
When a blocker cannot be resolved autonomously, add it here with:
- what is blocked
- why it is blocked
- what options exist
- what Jonathan needs to decide
