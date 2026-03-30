import Foundation

struct LiveProductRepository: ProductRepository {
    let apiClient: APIClient
    let cacheStore: CacheStoreProtocol

    func recentProducts() async throws -> [Product] {
        try await cacheStore.loadRecentProducts()
    }

    func lookupProduct(barcode: String) async throws -> Product? {
        let request = BarcodeLookupRequestDTO(barcode: barcode, locale: "en-US")
        let response = try await apiClient.post(
            path: ProductEndpoints.lookupBarcode,
            body: request,
            as: BarcodeLookupResponseDTO.self
        )

        guard response.found, let productDTO = response.product else {
            return nil
        }

        let product = DTOMapper.map(productDTO)
        try await cacheStore.saveRecentProduct(product)
        return product
    }

    func saveViewedProduct(_ product: Product) async throws {
        try await cacheStore.saveRecentProduct(product)
    }
}
