import Foundation

actor InMemoryCacheStore: CacheStoreProtocol {
    private var recentProducts: [Product] = MockData.sampleProducts

    func loadRecentProducts() async throws -> [Product] {
        recentProducts
    }

    func saveRecentProduct(_ product: Product) async throws {
        recentProducts.removeAll { $0.id == product.id }
        recentProducts.insert(product, at: 0)
    }
}
