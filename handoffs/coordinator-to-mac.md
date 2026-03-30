# Coordinator → Mac Claw

## Standing coordination protocol
This file is now the default mailbox from Windows/WhatsApp Claw to Mac Claw.

### Default behavior
Before starting any major IngrediScore work:
1. `git pull` latest from `origin/master`
2. Read:
   - `STATUS.md`
   - `NEXT_STEPS.md`
   - `BLOCKERS.md`
   - `handoffs/coordinator-to-mac.md`
   - `handoffs/mac-to-coordinator.md`
3. Follow the current instruction below unless a newer blocker or higher-priority repo state changes the plan.

After completing any meaningful work block:
1. Update `STATUS.md` if project state changed
2. Update `BLOCKERS.md` if a blocker was found/cleared
3. Update `handoffs/mac-to-coordinator.md` with a concise execution report
4. Commit with a clear message
5. Push to `origin/master`

## Current instruction
Proceed with the next real execution step for IngrediScore:

1. Create a real buildable Xcode SwiftUI iOS app project shell for `IngrediScore`.
2. Integrate the existing `ingrediscore-native/` scaffold into that project.
3. Attempt the first simulator build.
4. Fix whatever can be fixed autonomously.
5. Record the outcome in the shared repo files.

## Defaults unless Jonathan says otherwise
- App name: `IngrediScore`
- Interface: SwiftUI
- Language: Swift
- Bundle identifier: `com.jonathan.ingrediscore`

## Purpose
Use this repo as the shared source of truth so Jonathan does not have to manually relay every message between Claws.
