import Foundation

struct MockProductRepository: ProductRepository {
    let cacheStore: CacheStoreProtocol

    func recentProducts() async throws -> [Product] {
        try await cacheStore.loadRecentProducts()
    }

    func lookupProduct(barcode: String) async throws -> Product? {
        MockData.sampleProducts.first { $0.barcode == barcode }
    }

    func saveViewedProduct(_ product: Product) async throws {
        try await cacheStore.saveRecentProduct(product)
    }

    func allProducts(limit: Int) async throws -> [Product] {
        Array(MockData.sampleProducts.prefix(limit))
    }
}

struct MockAnalysisRepository: AnalysisRepository {
    func analyzeIngredientsText(_ text: String) async throws -> ProductAnalysis {
        MockData.sampleAnalysis
    }

    func ingredientDetail(id: String) async throws -> Ingredient? {
        MockData.sampleIngredients.first { $0.id == id }
    }

    func allIngredients(limit: Int) async throws -> [Ingredient] {
        Array(MockData.sampleIngredients.prefix(limit))
    }
}
