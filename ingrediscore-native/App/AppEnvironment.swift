import Foundation
import SwiftUI

struct AppEnvironment {
    let configuration: AppConfiguration
    let productRepository: ProductRepository
    let analysisRepository: AnalysisRepository
    let cacheStore: CacheStoreProtocol

    static func bootstrap() -> AppEnvironment {
        let configuration = AppConfiguration.current()
        let cacheStore = InMemoryCacheStore()

        switch configuration.mode {
        case .mock:
            return AppEnvironment(
                configuration: configuration,
                productRepository: MockProductRepository(cacheStore: cacheStore),
                analysisRepository: MockAnalysisRepository(),
                cacheStore: cacheStore
            )

        case .live:
            guard let apiBaseURL = configuration.apiBaseURL else {
                return AppEnvironment(
                    configuration: AppConfiguration(mode: .mock, apiBaseURL: nil),
                    productRepository: MockProductRepository(cacheStore: cacheStore),
                    analysisRepository: MockAnalysisRepository(),
                    cacheStore: cacheStore
                )
            }

            let apiClient = APIClient(baseURL: apiBaseURL)
            return AppEnvironment(
                configuration: configuration,
                productRepository: LiveProductRepository(apiClient: apiClient, cacheStore: cacheStore),
                analysisRepository: LiveAnalysisRepository(apiClient: apiClient),
                cacheStore: cacheStore
            )
        }
    }
}

private struct AppEnvironmentKey: EnvironmentKey {
    static let defaultValue = AppEnvironment.bootstrap()
}

extension EnvironmentValues {
    var appEnvironment: AppEnvironment {
        get { self[AppEnvironmentKey.self] }
        set { self[AppEnvironmentKey.self] = newValue }
    }
}
