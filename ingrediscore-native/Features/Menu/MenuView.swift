import SwiftUI

struct MenuView: View {
    @EnvironmentObject private var router: AppRouter

    private let menuItems: [(title: String, subtitle: String, icon: String, route: AppRoute)] = [
        ("About Project", "Learn what IngrediScore is and how it works.", "info.circle", .about),
        ("Data History", "See recently scanned products.", "clock.arrow.circlepath", .history),
        ("System Settings", "Manage app-level preferences.", "gearshape", .settings)
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Menu")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                    Text("Project information, history, and system controls.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 16) {
                    Text("Cloud Sync Disabled")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Sign in and deeper sync features from the web app are not restored in native yet.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Button("Sign In (Coming Later)") {}
                            .buttonStyle(.borderedProminent)
                            .tint(.black)
                            .disabled(true)
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Color(.systemBackground)))
                    .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous).stroke(Color.black.opacity(0.05), lineWidth: 1))
                }

                VStack(spacing: 12) {
                    ForEach(menuItems, id: \.title) { item in
                        Button {
                            router.path.append(item.route)
                        } label: {
                            HStack(spacing: 14) {
                                Image(systemName: item.icon)
                                    .font(.system(size: 18, weight: .semibold))
                                    .frame(width: 28)
                                    .foregroundStyle(.secondary)

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.title)
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundStyle(Color.primary)
                                    Text(item.subtitle)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundStyle(.tertiary)
                            }
                            .padding(18)
                            .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(Color(.systemBackground)))
                            .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).stroke(Color.black.opacity(0.05), lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(20)
        }
        .background(Color(.systemGroupedBackground))
    }
}
