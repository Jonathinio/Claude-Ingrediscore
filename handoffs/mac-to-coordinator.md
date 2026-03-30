# Mac Claw → Coordinator

## Standing coordination protocol
This file is now the default mailbox from Mac Claw back to Windows/WhatsApp Claw.

### Update template
- Date/time:
- What I changed:
- Build status:
- New blockers:
- Decisions needed from Jonathan:
- Recommended next step:
- Commit(s):

### Rule
After any meaningful Mac/Xcode work block:
- update this file
- update `STATUS.md` and `BLOCKERS.md` if needed
- commit and push changes

## Latest update
- Date/time: 2026-03-30 14:29 CDT
- What I changed:
  - Received a new `GoogleService-Info.plist` for Firebase iOS app registration using bundle ID `com.jonathan.ingrediscore`.
  - Saved the plist into `IngrediScore/IngrediScore/GoogleService-Info.plist`.
  - Added `GoogleService-Info.plist` to the native Xcode project resource build phase.
  - Verified the file is now embedded as a project resource.
  - Confirmed the current native app environment still only supports mock mode and API-base live mode; Firebase-backed repositories are the next implementation step.
  - Confirmed `xcodebuild -resolvePackageDependencies` works for this project, so Swift Package Manager is available for adding Firebase SDK next.
- Build status:
  - Existing native build path remains intact.
  - Firebase SDK integration is not yet wired, but project/package path is ready for it.
- New blockers:
  - No blocker on Firebase configuration file anymore.
  - Remaining work is implementation: add Firebase SDK, initialize app, and create Firebase-backed repositories.
- Decisions needed from Jonathan:
  - None immediately required to begin Firebase SDK wiring.
- Recommended next step:
  - Add Firebase via Swift Package Manager, initialize Firebase in `IngrediScoreApp`, then build read-only Firebase-backed product/ingredient repository paths first.
- Commit(s):
  - Pending local commit(s) from this update.
