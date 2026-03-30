import Foundation

struct LiveAnalysisRepository: AnalysisRepository {
    let apiClient: APIClient

    func analyzeIngredientsText(_ text: String) async throws -> ProductAnalysis {
        let request = IngredientTextAnalysisRequestDTO(
            rawText: text,
            productName: nil,
            brand: nil,
            locale: "en-US"
        )

        let response = try await apiClient.post(
            path: AnalysisEndpoints.analyzeIngredientsText,
            body: request,
            as: IngredientTextAnalysisResponseDTO.self
        )

        return DTOMapper.map(response.analysis)
    }

    func ingredientDetail(id: String) async throws -> Ingredient? {
        let response = try await apiClient.get(
            path: AnalysisEndpoints.ingredientDetail(id: id),
            as: IngredientDetailResponseDTO.self
        )

        return DTOMapper.map(response.ingredient)
    }
}
