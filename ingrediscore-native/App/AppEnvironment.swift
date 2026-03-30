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
                    configuration: AppConfiguration(
                        mode: .mock,
                        apiBaseURL: nil,
                        firebaseProjectID: nil,
                        firebaseDatabaseID: nil,
                        firebaseAPIKey: nil
                    ),
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

        case .firebase:
            guard
                let projectID = configuration.firebaseProjectID,
                let databaseID = configuration.firebaseDatabaseID,
                let apiKey = configuration.firebaseAPIKey
            else {
                return AppEnvironment(
                    configuration: AppConfiguration(
                        mode: .mock,
                        apiBaseURL: nil,
                        firebaseProjectID: nil,
                        firebaseDatabaseID: nil,
                        firebaseAPIKey: nil
                    ),
                    productRepository: MockProductRepository(cacheStore: cacheStore),
                    analysisRepository: MockAnalysisRepository(),
                    cacheStore: cacheStore
                )
            }

            let firestoreClient = FirestoreRESTClient(
                configuration: .init(
                    projectID: projectID,
                    databaseID: databaseID,
                    apiKey: apiKey
                )
            )

            return AppEnvironment(
                configuration: configuration,
                productRepository: FirebaseProductRepository(
                    firestoreClient: firestoreClient,
                    cacheStore: cacheStore,
                    databaseID: databaseID
                ),
                analysisRepository: FirebaseAnalysisRepository(
                    firestoreClient: firestoreClient,
                    databaseID: databaseID
                ),
                cacheStore: cacheStore
            )
        }
    }
}

private struct AppEnvironmentKey: EnvironmentKey {
    nonisolated(unsafe) static let defaultValue = AppEnvironment.bootstrap()
}

extension EnvironmentValues {
    var appEnvironment: AppEnvironment {
        get { self[AppEnvironmentKey.self] }
        set { self[AppEnvironmentKey.self] = newValue }
    }
}
