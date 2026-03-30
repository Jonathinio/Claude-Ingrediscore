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
- Date/time: 2026-03-30 15:21 CDT
- What I changed:
  - Switched priority toward deeper backend visibility so recovered Firebase data can actually appear in the native UI.
  - Expanded repository protocols to support collection-backed reads (`allProducts(limit:)`, `allIngredients(limit:)`).
  - Implemented Firestore REST collection listing support in `FirestoreRESTClient`.
  - Added document-list DTO support for Firestore list responses.
  - Extended Firebase-backed repositories so they can load product and ingredient collections from Firestore, not just single-document lookups.
  - Updated Search to load live ingredient collections from Firebase-backed repositories.
  - Updated Food to load live product collections from Firebase-backed repositories.
  - Rebuilt successfully after the backend/list integration pass.
- Build status:
  - `xcodebuild -project IngrediScore/IngrediScore.xcodeproj -scheme IngrediScore -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.3.1' build` succeeds.
  - Search/Food now compile against collection-backed Firebase reads.
- New blockers:
  - No new hard blocker.
  - Runtime validation is still needed to confirm the live Firestore list endpoints return the expected real dataset in-app.
  - The current Firestore bridge still uses a pragmatic REST adapter rather than full native Firebase SDK integration.
- Decisions needed from Jonathan:
  - None immediately required to continue backend integration.
- Recommended next step:
  - Run the updated app and verify Search/Food visibly populate from real Firebase data; then refine mapping depth and expand live backend coverage into more flows.
- Commit(s):
  - Pending local commit(s) from this update.
