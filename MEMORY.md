# MEMORY.md

## 2026-03-29
- Jonathan set up OpenClaw and named the assistant Claw.
- Claw has working local command execution in the workspace and can interact with OpenClaw tooling.
- WhatsApp outbound messaging was fixed by correcting the allowlist number to `+14582325611` and restarting the gateway.
- Jonathan is building an app called IngrediScore, originally prototyped as a React/Vite/Capacitor hybrid app exported from Google AI Studio.
- Decision: rebuild IngrediScore as a true native iOS app in Swift/SwiftUI; treat the existing hybrid app as a reference/prototype, not the long-term implementation base.
- The project repo is connected to GitHub at `https://github.com/Jonathinio/Claude-Ingrediscore.git`.
- A substantial native rebuild scaffold and planning package now exists in the workspace, including blueprint, technical spec, backend API spec, backend implementation plan, backend task breakdown, and `ingrediscore-native/` source scaffold.
- This Windows machine cannot run Xcode or Swift tooling, so future Xcode/native build work must happen on a Mac.
- Jonathan prefers Claw to work autonomously and only interrupt when access, credentials, or a real decision is required.
