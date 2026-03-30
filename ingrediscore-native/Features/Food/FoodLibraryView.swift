import SwiftUI

struct FoodLibraryView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var products: [Product] = []
    @State private var isLoading = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Food")
                    .font(.system(size: 30, weight: .bold, design: .rounded))

                Text("Recovered product library from Firebase.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                if isLoading {
                    ProgressView("Loading products…")
                        .padding(.top, 16)
                }

                VStack(spacing: 12) {
                    ForEach(products) { product in
                        Button {
                            router.path.append(AppRoute.productResult(product))
                        } label: {
                            HStack(spacing: 16) {
                                RoundedRectangle(cornerRadius: 18, style: .continuous)
                                    .fill(Color(.secondarySystemBackground))
                                    .frame(width: 54, height: 54)
                                    .overlay(Image(systemName: "shippingbox.fill").foregroundStyle(.secondary))
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(product.name)
                                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                                        .foregroundStyle(Color.primary)
                                    Text(product.brand ?? "Unknown Brand")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                ScoreBadgeView(score: product.analysis?.overallScore ?? 5)
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
            guard products.isEmpty else { return }
            isLoading = true
            products = (try? await environment.productRepository.allProducts(limit: 100)) ?? []
            isLoading = false
        }
    }
}
