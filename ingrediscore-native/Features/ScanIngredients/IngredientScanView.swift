import SwiftUI

struct IngredientScanView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var rawText = "Ingredients: oats, sugar, citric acid, natural flavors"
    @State private var isLoading = false

    var body: some View {
        Form {
            Section("Ingredient Scan Prototype") {
                Text("Native camera capture + Vision OCR will replace this text input prototype in the buildable Xcode project.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

                TextEditor(text: $rawText)
                    .frame(minHeight: 160)

                Button(isLoading ? "Analyzing..." : "Analyze Ingredients") {
                    Task {
                        isLoading = true
                        defer { isLoading = false }

                        let analysis = try? await environment.analysisRepository.analyzeIngredientsText(rawText)
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

                        if let analysis {
                            try? await environment.productRepository.saveViewedProduct(product)
                            router.path.append(AppRoute.productResult(product))
                        }
                    }
                }
                .disabled(isLoading || rawText.isEmpty)
            }
        }
        .navigationTitle("Scan Ingredients")
    }
}
