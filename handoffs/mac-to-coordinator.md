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
- Date/time: 2026-03-30 14:14 CDT
- What I changed:
  - Verified Firebase CLI is installed and authenticated locally as `jonathanisreed@gmail.com`.
  - Inspected available Firebase projects and determined the likely real historical IngrediScore backend is `just-keyword-477517-m5`, not the mostly empty `ingrediscore` project.
  - Confirmed that `just-keyword-477517-m5` contains:
    - a registered web app
    - a registered iOS app
    - a live Firestore database
  - Recovered/config-inspected the web and iOS Firebase app configuration via CLI.
  - Queried the live Firestore database and confirmed the real collection layout:
    - `facts`
    - `ingredientMappings`
    - `ingredients`
    - `leaderboard`
    - `products`
    - `users`
  - Sampled live schema fields from key collections and documented the recovery map in `FIREBASE_RECOVERY_NOTES.md`.
  - Identified the main native reconnection issue: the historical Firebase iOS app is tied to bundle ID `com.ashlynn.foodscanner`, while the current native app uses `com.jonathan.ingrediscore`.
- Build status:
  - Native app build status unchanged: simulator build/launch path remains working.
- New blockers:
  - To reconnect cleanly, the current native bundle ID likely needs its own Firebase iOS app registration and fresh `GoogleService-Info.plist`.
- Decisions needed from Jonathan:
  - Approve/use `just-keyword-477517-m5` as the canonical recovered backend.
  - Preferably register a new Firebase iOS app for `com.jonathan.ingrediscore` in that project.
- Recommended next step:
  - Register the current native bundle ID in Firebase, obtain `GoogleService-Info.plist`, then begin replacing mock repositories with Firebase-backed native repositories.
- Commit(s):
  - Pending local commit(s) from this update.
