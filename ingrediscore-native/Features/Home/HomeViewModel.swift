import Foundation

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var recentProducts: [Product] = []

    private let productRepository: ProductRepository

    init(productRepository: ProductRepository) {
        self.productRepository = productRepository
    }

    func load() async {
        recentProducts = (try? await productRepository.recentProducts()) ?? []
    }
}
