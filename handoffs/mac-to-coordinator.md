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
- Date/time: 2026-03-30 15:48 CDT
- What I changed:
  - Diagnosed the real reason collection-backed UI was not surfacing data: Firestore REST list reads were failing with 403, while the original web app used the proper Firebase client SDK path.
  - Added CocoaPods support to the native project with Firebase SDK dependencies:
    - `FirebaseAuth`
    - `FirebaseFirestore`
  - Generated and adopted `IngrediScore.xcworkspace` as the canonical build entry point after pod integration.
  - Updated app startup to configure Firebase via `FirebaseApp.configure()`.
  - Switched the collection-backed Firebase repositories from the temporary REST list bridge to real Firestore SDK reads for products and ingredients.
  - Fixed Swift 6 / mapper integration issues that surfaced during the first workspace builds.
  - Achieved a successful workspace build and simulator launch with the real Firebase SDK integrated.
- Build status:
  - `xcodebuild -workspace IngrediScore.xcworkspace -scheme IngrediScore -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.3.1' build` succeeds.
  - App launches successfully in Simulator from the workspace build products.
- New blockers:
  - No hard build blocker.
  - Runtime confirmation is still needed to verify Search/Food now visibly populate from Firestore SDK reads.
- Decisions needed from Jonathan:
  - None immediately required to continue.
- Recommended next step:
  - Re-test Search and Food in the running app now that the Firestore SDK path is in place, confirm real data visibility, then continue expanding live backend coverage and parity on top of that.
- Commit(s):
  - Pending local commit(s) from this update.
