import Foundation

enum AnalysisEndpoints {
    static let analyzeIngredientsText = "/v1/analysis/ingredients-text"
    static func ingredientDetail(id: String) -> String { "/v1/ingredients/\(id)" }
}
