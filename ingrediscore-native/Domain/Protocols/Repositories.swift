import Foundation

protocol ProductRepository: Sendable {
    func recentProducts() async throws -> [Product]
    func lookupProduct(barcode: String) async throws -> Product?
    func saveViewedProduct(_ product: Product) async throws
    func allProducts(limit: Int) async throws -> [Product]
}

protocol AnalysisRepository: Sendable {
    func analyzeIngredientsText(_ text: String) async throws -> ProductAnalysis
    func ingredientDetail(id: String) async throws -> Ingredient?
    func allIngredients(limit: Int) async throws -> [Ingredient]
}

protocol CacheStoreProtocol: Sendable {
    func loadRecentProducts() async throws -> [Product]
    func saveRecentProduct(_ product: Product) async throws
}
