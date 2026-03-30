import SwiftUI

struct SettingsView: View {
    var body: some View {
        List {
            Section("About") {
                Text("IngrediScore v2 native scaffold")
                Text("Educational tool, not medical advice.")
                    .foregroundStyle(.secondary)
            }

            Section("Planned") {
                Text("Privacy settings")
                Text("Cache management")
                Text("Theme")
                Text("Account integration")
            }
        }
        .navigationTitle("Settings")
    }
}
