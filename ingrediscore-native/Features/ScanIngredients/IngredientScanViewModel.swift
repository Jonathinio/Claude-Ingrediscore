import Foundation

@MainActor
final class IngredientScanViewModel: ObservableObject {
    @Published var rawText = "Ingredients: oats, sugar, citric acid, natural flavors"
    @Published var isLoading = false
    @Published var generatedProduct: Product?

    private let analysisRepository: AnalysisRepository
    private let productRepository: ProductRepository

    init(analysisRepository: AnalysisRepository, productRepository: ProductRepository) {
        self.analysisRepository = analysisRepository
        self.productRepository = productRepository
    }

    func analyze() async {
        guard !rawText.isEmpty else { return }
        isLoading = true
        defer { isLoading = false }

        guard let analysis = try? await analysisRepository.analyzeIngredientsText(rawText) else { return }

        let product = Product(
            id: UUID().uuidString,
            barcode: nil,
            name: "Scanned Product",
            brand: nil,
            rawIngredientText: rawText,
            analysis: analysis,
            imageRefs: nil,
            updatedAt: Date()
        )

        try? await productRepository.saveViewedProduct(product)
        generatedProduct = product
    }
}
