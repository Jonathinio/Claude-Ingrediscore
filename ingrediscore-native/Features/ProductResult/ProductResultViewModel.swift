import Foundation

@MainActor
final class ProductResultViewModel: ObservableObject {
    @Published var product: Product

    init(product: Product) {
        self.product = product
    }
}
