import Foundation

@MainActor
final class BarcodeScanViewModel: ObservableObject {
    @Published var barcodeInput = "012345678905"
    @Published var isLoading = false
    @Published var loadedProduct: Product?

    private let productRepository: ProductRepository

    init(productRepository: ProductRepository) {
        self.productRepository = productRepository
    }

    func lookup() async {
        guard !barcodeInput.isEmpty else { return }
        isLoading = true
        defer { isLoading = false }
        loadedProduct = try? await productRepository.lookupProduct(barcode: barcodeInput)
    }
}
