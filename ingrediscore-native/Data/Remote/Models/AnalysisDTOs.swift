import Foundation

struct BarcodeLookupRequestDTO: Codable {
    let barcode: String
    let locale: String
}

struct BarcodeLookupResponseDTO: Codable {
    let found: Bool
    let product: ProductDTO?
    let analysis: ProductAnalysisDTO?
    let source: String?
}

struct IngredientTextAnalysisRequestDTO: Codable {
    let rawText: String
    let productName: String?
    let brand: String?
    let locale: String
}

struct IngredientTextAnalysisResponseDTO: Codable {
    let normalizedIngredients: [IngredientMatchDTO]
    let analysis: ProductAnalysisDTO
    let scoreVersion: ScoringVersionDTO
}

struct IngredientDetailResponseDTO: Codable {
    let ingredient: IngredientDTO
    let studies: [EvidenceStudyDTO]
}
