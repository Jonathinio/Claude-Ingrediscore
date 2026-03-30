import SwiftUI

struct HistoryView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var products: [Product] = []

    var body: some View {
        List(products) { product in
            Button(product.name) {
                router.path.append(AppRoute.productResult(product))
            }
        }
        .navigationTitle("History")
        .task {
            products = (try? await environment.productRepository.recentProducts()) ?? []
        }
    }
}
