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
- Date/time: 2026-03-30 17:57 CDT
- What I changed:
  - Confirmed the real backend issue from runtime logs: Firestore SDK was initially connecting to `(default)` while the recovered data lives in named database `ai-studio-38be78cd-dd16-4388-b437-a416b88e1f0c`.
  - Updated Firebase repositories to use the configured named Firestore database instead of the default database.
  - Rebuilt successfully against the workspace after the named-database fix.
  - Runtime validation from Jonathan confirmed live data is now surfacing:
    - Search loaded 200 ingredients
    - Food loaded 13 products
  - Raised the Search ingredient load cap from 200 to 1000 so more of the recovered ingredient library can appear.
  - Rebuilt successfully again after the cap increase.
- Build status:
  - `xcodebuild -workspace IngrediScore.xcworkspace -scheme IngrediScore -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.3.1' build` succeeds.
- New blockers:
  - No hard build blocker.
  - Main remaining work is scaling/polishing the Search/Food experience now that live backend visibility exists.
- Decisions needed from Jonathan:
  - None immediately required.
- Recommended next step:
  - Verify the larger ingredient load in Search, then improve search/library UX and continue replacing scaffolded paths with live Firebase-backed ones.
- Commit(s):
  - Pending local commit(s) from this update.
