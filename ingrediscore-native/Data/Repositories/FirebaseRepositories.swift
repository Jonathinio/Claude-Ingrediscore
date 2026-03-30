import Foundation

struct FirebaseProductRepository: ProductRepository {
    let firestoreClient: FirestoreRESTClient
    let cacheStore: CacheStoreProtocol

    func recentProducts() async throws -> [Product] {
        try await cacheStore.loadRecentProducts()
    }

    func lookupProduct(barcode: String) async throws -> Product? {
        do {
            let document = try await firestoreClient.getDocument(path: "products/\(barcode)")
            let product = FirestoreMapper.mapProduct(document: document)
            try await cacheStore.saveRecentProduct(product)
            return product
        } catch {
            return nil
        }
    }

    func saveViewedProduct(_ product: Product) async throws {
        try await cacheStore.saveRecentProduct(product)
    }
}

struct FirebaseAnalysisRepository: AnalysisRepository {
    let firestoreClient: FirestoreRESTClient

    func analyzeIngredientsText(_ text: String) async throws -> ProductAnalysis {
        throw AppError.unknown("Ingredient text analysis is not wired to Firebase yet.")
    }

    func ingredientDetail(id: String) async throws -> Ingredient? {
        let document = try await firestoreClient.getDocument(path: "ingredients/\(id)")
        return FirestoreMapper.mapIngredient(document: document)
    }
}
