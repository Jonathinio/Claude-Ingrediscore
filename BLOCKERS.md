# BLOCKERS

## Active blockers
- No hard technical blocker for simulator build or first launch anymore: the project builds and launches successfully in Simulator.
- The generated Xcode project still needs cleanup/hardening before it should be treated as the long-term canonical project setup.
- The project file currently resolves app resources through a nested path layout under `IngrediScore/IngrediScore/IngrediScore/`; attempts to normalize that pathing need more careful project-file cleanup.
- App resources are placeholder-level only (basic asset catalog shell, no finalized icon/design assets).

## Decisions that may be needed soon
- Final bundle identifier if different from `com.jonathan.ingrediscore`
- Minimum iOS deployment target
- Apple signing team / provisioning setup for device builds
- Whether to keep the generated project structure as-is or replace it with a cleaner hand-authored/project-generator-backed setup
- Any real app icon / launch asset requirements needed for production polish

## Rule
When a blocker cannot be resolved autonomously, add it here with:
- what is blocked
- why it is blocked
- what options exist
- what Jonathan needs to decide
