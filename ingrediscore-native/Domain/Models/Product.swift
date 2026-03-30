import Foundation

struct ProductImageRefs: Codable, Hashable {
    let frontImageURL: URL?
    let ingredientsImageURL: URL?
    let nutritionImageURL: URL?
}

struct Product: Identifiable, Codable, Hashable {
    let id: String
    let barcode: String?
    let name: String
    let brand: String?
    let rawIngredientText: String?
    let analysis: ProductAnalysis?
    let imageRefs: ProductImageRefs?
    let updatedAt: Date
}
