# BLOCKERS

## Active blockers
- No hard technical blocker for simulator build or first launch: the project builds and launches successfully in Simulator.
- Native/web parity is still incomplete across most screens and flows.
- The native app still uses scaffolded data and simplified scan behavior in several places.
- Firebase configuration file is now present, but Firebase SDK and repository integration are not wired yet.
- App resources and branding are still placeholder-level rather than final product assets.

## Decisions that may be needed soon
- Final bundle identifier if different from `com.jonathan.ingrediscore`
- Minimum iOS deployment target
- Apple signing team / provisioning setup for device builds
- Whether to keep the generated project structure as-is or replace it with a cleaner hand-authored/project-generator-backed setup
- Final app icon / launch asset / branding direction
- Which major parity flow should be prioritized immediately after home/dashboard parity (product detail, scan flow, search/library, etc.)

## Rule
When a blocker cannot be resolved autonomously, add it here with:
- what is blocked
- why it is blocked
- what options exist
- what Jonathan needs to decide
