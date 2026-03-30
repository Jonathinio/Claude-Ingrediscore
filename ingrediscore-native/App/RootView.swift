import SwiftUI

struct RootView: View {
    @EnvironmentObject private var router: AppRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            HomeView()
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .barcodeScan:
                        BarcodeScanView()
                    case .ingredientScan:
                        IngredientScanView()
                    case .history:
                        HistoryView()
                    case .settings:
                        SettingsView()
                    case .productResult(let product):
                        ProductResultView(product: product)
                    case .ingredientDetail(let ingredient):
                        IngredientDetailView(ingredient: ingredient)
                    }
                }
        }
    }
}

enum AppRoute: Hashable {
    case barcodeScan
    case ingredientScan
    case history
    case settings
    case productResult(Product)
    case ingredientDetail(Ingredient)
}
