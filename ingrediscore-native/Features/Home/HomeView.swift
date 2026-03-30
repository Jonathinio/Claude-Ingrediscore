import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var recentProducts: [Product] = []

    private var totalProducts: Int { recentProducts.count }

    private var totalIngredientsIndexed: Int {
        let ingredientIDs = recentProducts
            .compactMap(\.analysis)
            .flatMap(\.ingredients)
            .compactMap(\.ingredient?.id)
        return Set(ingredientIDs).count
    }

    private var totalEvidenceItems: Int {
        recentProducts
            .compactMap(\.analysis)
            .flatMap(\.ingredients)
            .compactMap(\.ingredient)
            .reduce(0) { $0 + $1.studies.count }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                headerSection
                statCardsSection
                scanActionsSection
                foodInsightSection
                sharedBrainSection

                if !recentProducts.isEmpty {
                    recentSection
                }

                quickLinksSection
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 28)
        }
        .background(Color(.systemGroupedBackground))
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .navigationBar)
        .task {
            recentProducts = (try? await environment.productRepository.recentProducts()) ?? []
        }
    }

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Text("IngrediScore")
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.primary)

                        Text("Native")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .textCase(.uppercase)
                            .tracking(1.5)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.green.opacity(0.12))
                            .foregroundStyle(Color.green)
                            .clipShape(Capsule())
                    }

                    Text("Evidence-based health insights for food ingredients.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 16)

                Label("Cloud Sync", systemImage: "checkmark.circle.fill")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .textCase(.uppercase)
                    .tracking(1.2)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.green.opacity(0.12))
                    .foregroundStyle(Color.green)
                    .clipShape(Capsule())
            }
        }
    }

    private var statCardsSection: some View {
        HStack(spacing: 14) {
            dashboardStatCard(
                title: "Recent Library",
                value: totalProducts,
                unit: "items",
                systemImage: "shippingbox.fill",
                tint: .green
            )

            dashboardStatCard(
                title: "Clinical Evidence",
                value: totalEvidenceItems,
                unit: "papers",
                systemImage: "book.fill",
                tint: .orange
            )
        }
    }

    private func dashboardStatCard(title: String, value: Int, unit: String, systemImage: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Label(title, systemImage: systemImage)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(1.2)
                .foregroundStyle(.secondary)

            HStack(alignment: .lastTextBaseline, spacing: 6) {
                Text("\(value)")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.primary)
                Text(unit)
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .textCase(.uppercase)
                    .tracking(1.0)
                    .foregroundStyle(.secondary)
            }

            if title == "Recent Library" {
                Text(totalIngredientsIndexed > 0 ? "\(totalIngredientsIndexed) ingredients indexed from recent products" : "Build your library by scanning products")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            } else {
                Text(totalEvidenceItems > 0 ? "Study count surfaced from currently loaded ingredient evidence" : "Evidence count will rise as richer data lands")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(tint.opacity(0.12), lineWidth: 1)
        )
    }

    private var scanActionsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Scan")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            VStack(spacing: 12) {
                dashboardActionCard(
                    title: "Scan Barcode",
                    subtitle: "Look up a product and jump straight into the native result flow.",
                    systemImage: "barcode.viewfinder",
                    tint: .green
                ) {
                    router.path.append(AppRoute.barcodeScan)
                }

                dashboardActionCard(
                    title: "Scan Ingredient Label",
                    subtitle: "Analyze a label when barcode lookup is not the right entry point.",
                    systemImage: "camera.viewfinder",
                    tint: .orange
                ) {
                    router.path.append(AppRoute.ingredientScan)
                }
            }
        }
    }

    private func dashboardActionCard(title: String, subtitle: String, systemImage: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(tint.opacity(0.14))
                        .frame(width: 58, height: 58)

                    Image(systemName: systemImage)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(tint)
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.primary)
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer(minLength: 12)

                Image(systemName: "chevron.right")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.tertiary)
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(Color(.systemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(Color.black.opacity(0.04), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private var foodInsightSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Food Insight")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .textCase(.uppercase)
                    .tracking(2)
                    .foregroundStyle(.secondary)
                Spacer()
                Image(systemName: "sparkles")
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 4)

            VStack(alignment: .leading, spacing: 16) {
                Text("Reference parity in progress")
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .textCase(.uppercase)
                    .tracking(1.5)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(.secondarySystemBackground))
                    .clipShape(Capsule())

                Text("The native app now builds and launches. The next phase is restoring the original polished UX from the web prototype inside SwiftUI.")
                    .font(.system(size: 20, weight: .medium, design: .rounded))
                    .foregroundStyle(Color.primary)
                    .multilineTextAlignment(.leading)
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 32, style: .continuous)
                    .fill(Color(.systemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 32, style: .continuous)
                    .stroke(Color.black.opacity(0.04), lineWidth: 1)
            )
        }
    }

    private var sharedBrainSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 10) {
                Image(systemName: "brain.head.profile")
                    .foregroundStyle(Color.green)
                Text("The Shared Brain")
                    .font(.headline)
                    .foregroundStyle(Color.primary)
            }

            Text("Every scan and ingredient review strengthens the product library. The current native build is still using a lightweight local/mock-backed scaffold, but the shared repo and app shell are now aligned for parity reconstruction.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.leading)

            HStack(spacing: 10) {
                ForEach(0..<3, id: \.self) { _ in
                    Circle()
                        .fill(Color(.secondarySystemBackground))
                        .frame(width: 24, height: 24)
                        .overlay(
                            Image(systemName: "person.fill")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.secondary)
                        )
                }

                Text("Community powered")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .textCase(.uppercase)
                    .tracking(1.2)
                    .foregroundStyle(Color.green)
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .stroke(Color.black.opacity(0.04), lineWidth: 1)
        )
    }

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Recent")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .textCase(.uppercase)
                    .tracking(2)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .padding(.horizontal, 4)

            VStack(spacing: 12) {
                ForEach(recentProducts.prefix(3)) { product in
                    Button {
                        router.path.append(AppRoute.productResult(product))
                    } label: {
                        HStack(spacing: 16) {
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(Color(.secondarySystemBackground))
                                .frame(width: 56, height: 56)
                                .overlay(
                                    Image(systemName: "shippingbox.fill")
                                        .foregroundStyle(.secondary)
                                )

                            VStack(alignment: .leading, spacing: 4) {
                                Text(product.name)
                                    .font(.system(size: 17, weight: .bold, design: .rounded))
                                    .foregroundStyle(Color.primary)
                                    .lineLimit(1)

                                Text(product.brand ?? "Unknown Brand")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }

                            Spacer()

                            if let score = product.analysis?.overallScore {
                                ScoreBadgeView(score: score)
                                    .scaleEffect(0.85)
                            }
                        }
                        .padding(18)
                        .background(
                            RoundedRectangle(cornerRadius: 26, style: .continuous)
                                .fill(Color(.systemBackground))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 26, style: .continuous)
                                .stroke(Color.black.opacity(0.04), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var quickLinksSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Quick Links")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            HStack(spacing: 12) {
                compactLinkCard(title: "History", systemImage: "clock.arrow.circlepath") {
                    router.path.append(AppRoute.history)
                }

                compactLinkCard(title: "Settings", systemImage: "gearshape.fill") {
                    router.path.append(AppRoute.settings)
                }
            }
        }
    }

    private func compactLinkCard(title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 16) {
                Image(systemName: systemImage)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(Color.primary)

                Text(title)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.primary)
            }
            .frame(maxWidth: .infinity, minHeight: 110, alignment: .topLeading)
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(Color(.systemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .stroke(Color.black.opacity(0.04), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
