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
- Date/time: 2026-03-30 13:33 CDT
- What I changed:
  - Pulled latest from `origin/master` and continued Mac-side execution.
  - Investigated the resource-path issue in `IngrediScore.xcodeproj`.
  - Identified the root cause: the inner app group path in the Xcode project caused assets/preview resources to resolve through an extra nested directory level.
  - Repaired the inner app group path in the project file so resources now resolve from the canonical `IngrediScore/IngrediScore/` app directories.
  - Re-verified simulator build success after the project fix.
  - Re-installed and re-launched the app successfully in the iPhone 17 simulator after the cleanup.
- Build status:
  - `xcodebuild -project IngrediScore/IngrediScore.xcodeproj -scheme IngrediScore -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.3.1' build` succeeds.
  - App install succeeds.
  - App launch succeeds in iPhone 17 simulator.
- New blockers:
  - No blocker to first running iOS app shell.
  - Remaining issues are cleanup/polish/productization, not basic project validity.
- Decisions needed from Jonathan:
  - None immediately required for continued technical cleanup.
- Recommended next step:
  - Keep cleaning/hardening the Xcode project and replace placeholder app assets/settings, then begin the next real functionality pass (scanner/backend/persistence depending on product priority).
- Commit(s):
  - Pending local commit(s) from this update.
