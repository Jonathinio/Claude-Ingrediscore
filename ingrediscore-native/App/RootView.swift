import SwiftUI

struct RootView: View {
    @EnvironmentObject private var router: AppRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            AppShellView()
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
                    case .about:
                        AboutView()
                    case .search:
                        SearchView()
                    case .foodLibrary:
                        FoodLibraryView()
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
    case about
    case search
    case foodLibrary
    case productResult(Product)
    case ingredientDetail(Ingredient)
}

struct AppShellView: View {
    @EnvironmentObject private var router: AppRouter

    var body: some View {
        TabView(selection: $router.selectedTab) {
            HomeView()
                .tag(AppTab.home)
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            SearchView()
                .tag(AppTab.search)
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }

            ScanHubView()
                .tag(AppTab.scan)
                .tabItem {
                    Label("Scan", systemImage: "camera.viewfinder")
                }

            FoodLibraryView()
                .tag(AppTab.food)
                .tabItem {
                    Label("Food", systemImage: "leaf.fill")
                }

            MenuView()
                .tag(AppTab.menu)
                .tabItem {
                    Label("Menu", systemImage: "line.3.horizontal")
                }
        }
    }
}
