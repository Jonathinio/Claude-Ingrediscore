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
- Date/time: 2026-03-30 14:36 CDT
- What I changed:
  - Continued native Firebase reconnection without waiting on full SDK package integration.
  - Added a read-only Firestore REST client using the recovered Firebase project/database/API configuration.
  - Added Firestore DTO parsing and a Firestore-to-domain mapper layer.
  - Added Firebase-backed repository implementations for:
    - barcode product lookup via Firestore `products/{barcode}`
    - ingredient detail lookup via Firestore `ingredients/{id}`
  - Extended app configuration/environment to support a new `.firebase` mode and made it the active default for this build.
  - Repaired the Xcode project group path again so resources (including `GoogleService-Info.plist`) resolve from the canonical app directory.
  - Added the new backend files to the Xcode target and re-verified a successful app build.
- Build status:
  - `xcodebuild -project IngrediScore/IngrediScore.xcodeproj -scheme IngrediScore -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.3.1' build` succeeds.
  - App now compiles with the first live Firebase-backed read path included.
- New blockers:
  - No hard build blocker.
  - Live backend path is still partial: ingredient text analysis/OCR is not yet backed by the recovered Firebase backend.
  - Full native Firebase SDK integration is still pending if/when we want auth/storage/realtime features beyond the current REST bridge.
- Decisions needed from Jonathan:
  - None immediately required to continue technical integration.
- Recommended next step:
  - Validate the live Firestore-backed barcode lookup end-to-end in Simulator/Xcode, then expand live product/result mapping and history flows before deciding whether full Firebase SDK integration is worth doing immediately.
- Commit(s):
  - Pending local commit(s) from this update.
