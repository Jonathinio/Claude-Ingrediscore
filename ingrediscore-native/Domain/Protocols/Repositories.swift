import Foundation

protocol ProductRepository {
    func recentProducts() async throws -> [Product]
    func lookupProduct(barcode: String) async throws -> Product?
    func saveViewedProduct(_ product: Product) async throws
}

protocol AnalysisRepository {
    func analyzeIngredientsText(_ text: String) async throws -> ProductAnalysis
    func ingredientDetail(id: String) async throws -> Ingredient?
}

protocol CacheStoreProtocol {
    func loadRecentProducts() async throws -> [Product]
    func saveRecentProduct(_ product: Product) async throws
}
