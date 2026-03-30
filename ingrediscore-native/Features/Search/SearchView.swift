import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var query = ""
    @State private var recentProducts: [Product] = []

    private var filteredProducts: [Product] {
        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return recentProducts }
        return recentProducts.filter {
            $0.name.localizedCaseInsensitiveContains(query) ||
            ($0.brand?.localizedCaseInsensitiveContains(query) ?? false) ||
            ($0.barcode?.localizedCaseInsensitiveContains(query) ?? false)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Search")
                    .font(.system(size: 30, weight: .bold, design: .rounded))

                TextField("Search products, brands, or barcodes", text: $query)
                    .textFieldStyle(.roundedBorder)

                VStack(spacing: 12) {
                    ForEach(filteredProducts) { product in
                        Button {
                            router.path.append(AppRoute.productResult(product))
                        } label: {
                            HStack(spacing: 16) {
                                ScoreBadgeView(score: product.analysis?.overallScore ?? 5)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(product.name)
                                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                                        .foregroundStyle(Color.primary)
                                    Text(product.brand ?? "Unknown Brand")
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
        .task {
            recentProducts = (try? await environment.productRepository.recentProducts()) ?? []
        }
    }
}
