# IngrediScore Handoff Note

If resuming this project from another chat/session/device, start here.

## Project status
IngrediScore is being rebuilt from a hybrid React/Vite/Capacitor prototype into a native iOS app.

The current hybrid prototype is in:
- `ingrediscore/`

The native rebuild scaffold is in:
- `ingrediscore-native/`

## Core docs to read first
1. `INGREDISCORE_V2_BLUEPRINT.md`
2. `INGREDISCORE_V2_TECH_SPEC.md`
3. `INGREDISCORE_BACKEND_API_SPEC.md`
4. `INGREDISCORE_BACKEND_IMPLEMENTATION_PLAN.md`
5. `INGREDISCORE_BACKEND_TASK_BREAKDOWN.md`
6. `ingrediscore-native/Docs/DOCS_INDEX.md`

## Git / repo status
- Remote repo: `https://github.com/Jonathinio/Claude-Ingrediscore.git`
- Branch pushed: `master`
- Key commit: `43efb9a` (`Add IngrediScore native rebuild plans and scaffold`)

## Important reality check
This Windows machine does not have:
- `xcodebuild`
- `swift`

So it cannot produce a real buildable Xcode project here. It can still produce source scaffolding, architecture, docs, API specs, and migration plans.

## Next external step
When Jonathan is at a Mac:
- log into GitHub
- install/open Xcode
- clone the repo
- create/open a real SwiftUI iOS project
- import scaffolded files from `ingrediscore-native/`
- continue native implementation there

## User preference
Jonathan asked Claw to continue autonomously and only stop when access, credentials, or a real product decision is needed.
