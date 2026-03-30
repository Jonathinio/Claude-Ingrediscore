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
- Date/time: 2026-03-30 18:01 CDT
- What I changed:
  - Corrected the home dashboard stat cards so they no longer use recent-library/mock-derived values.
  - Replaced `Recent Library` with `Ingredients`.
  - Wired the home screen to load backend-driven ingredient totals via `allIngredients(limit: 1000)`.
  - Wired the home screen to compute `Clinical Evidence` as the total summed study count across the loaded ingredient profiles.
  - Rebuilt successfully against the workspace after the dashboard stat correction.
- Build status:
  - `xcodebuild -workspace IngrediScore.xcworkspace -scheme IngrediScore -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.3.1' build` succeeds.
- New blockers:
  - No new hard blocker.
  - Search/library experience still needs scaling/polish for the larger ingredient dataset.
- Decisions needed from Jonathan:
  - None immediately required.
- Recommended next step:
  - Re-run the updated build and verify the home dashboard now shows ingredient and clinical evidence totals that better reflect the recovered backend, then continue improving search/library UX and deeper backend-backed flows.
- Commit(s):
  - Pending local commit(s) from this update.
