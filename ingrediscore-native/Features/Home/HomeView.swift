import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var recentProducts: [Product] = []

    var body: some View {
        List {
            Section("IngrediScore") {
                Button("Scan Barcode") {
                    router.path.append(AppRoute.barcodeScan)
                }

                Button("Scan Ingredient Label") {
                    router.path.append(AppRoute.ingredientScan)
                }

                Button("History") {
                    router.path.append(AppRoute.history)
                }

                Button("Settings") {
                    router.path.append(AppRoute.settings)
                }
            }

            if !recentProducts.isEmpty {
                Section("Recent") {
                    ForEach(recentProducts) { product in
                        Button(product.name) {
                            router.path.append(AppRoute.productResult(product))
                        }
                    }
                }
            }
        }
        .navigationTitle("IngrediScore")
        .task {
            recentProducts = (try? await environment.productRepository.recentProducts()) ?? []
        }
    }
}
