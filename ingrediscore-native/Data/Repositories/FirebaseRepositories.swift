import Foundation
import FirebaseCore
import FirebaseFirestore

private enum FirestoreDatabaseProvider {
    static func database(named databaseID: String) throws -> Firestore {
        guard let app = FirebaseApp.app() else {
            throw AppError.unknown("Firebase app is not configured.")
        }
        return Firestore.firestore(app: app, database: databaseID)
    }
}

struct FirebaseProductRepository: ProductRepository {
    let firestoreClient: FirestoreRESTClient
    let cacheStore: CacheStoreProtocol
    let databaseID: String

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

    func allProducts(limit: Int) async throws -> [Product] {
        let db = try FirestoreDatabaseProvider.database(named: databaseID)
        let snapshot = try await db.collection("products").limit(to: limit).getDocuments()
        let products = snapshot.documents.map { document in
            FirestoreMapper.mapProduct(fields: document.data().mapValues(FirestoreMapper.convert), fallbackID: document.documentID)
        }
        for product in products {
            try await cacheStore.saveRecentProduct(product)
        }
        return products
    }
}

struct FirebaseAnalysisRepository: AnalysisRepository {
    let firestoreClient: FirestoreRESTClient
    let databaseID: String

    func analyzeIngredientsText(_ text: String) async throws -> ProductAnalysis {
        throw AppError.unknown("Ingredient text analysis is not wired to Firebase yet.")
    }

    func ingredientDetail(id: String) async throws -> Ingredient? {
        let document = try await firestoreClient.getDocument(path: "ingredients/\(id)")
        return FirestoreMapper.mapIngredient(document: document)
    }

    func allIngredients(limit: Int) async throws -> [Ingredient] {
        let db = try FirestoreDatabaseProvider.database(named: databaseID)
        let snapshot = try await db.collection("ingredients").limit(to: limit).getDocuments()
        return snapshot.documents.map { document in
            FirestoreMapper.mapIngredient(fields: document.data().mapValues(FirestoreMapper.convert), fallbackID: document.documentID)
        }
    }
}
