import Foundation

@MainActor
final class HistoryViewModel: ObservableObject {
    @Published var products: [Product] = []

    private let productRepository: ProductRepository

    init(productRepository: ProductRepository) {
        self.productRepository = productRepository
    }

    func load() async {
        products = (try? await productRepository.recentProducts()) ?? []
    }
}
