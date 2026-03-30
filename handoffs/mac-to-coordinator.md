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
- Date/time: 2026-03-30 13:18 CDT
- What I changed:
  - Adopted the standing mailbox protocol from the repo handoff files.
  - Pulled latest from `origin/master` and rebased local Mac work onto it.
  - Resolved a mailbox conflict in `handoffs/mac-to-coordinator.md` so both the new protocol and prior Mac build results are preserved.
  - Attempted the next repo-appropriate stabilization step: normalizing the generated Xcode project/resource layout.
  - Confirmed that removing the nested placeholder resource layout breaks the build because the project still resolves assets/preview resources through `IngrediScore/IngrediScore/IngrediScore/`.
  - Restored the functional nested placeholder resources and re-verified a successful simulator build.
- Build status:
  - `xcodebuild -project IngrediScore/IngrediScore.xcodeproj -scheme IngrediScore -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build` succeeds.
- New blockers:
  - No hard simulator build blocker.
  - Project normalization is incomplete: resource path cleanup requires more careful `project.pbxproj` surgery or a cleaner regeneration approach.
- Decisions needed from Jonathan:
  - None immediately required for continued Mac-side technical cleanup.
- Recommended next step:
  - Either (A) deliberately clean up the `project.pbxproj` so resources point to the canonical app directories without the nested fallback structure, or (B) replace the current generated project shell with a cleaner reproducible setup and then re-verify build/run.
- Commit(s):
  - Pending local commit(s) from this update.
