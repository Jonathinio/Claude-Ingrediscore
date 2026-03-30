import SwiftUI

@main
struct IngrediScoreApp: App {
    @StateObject private var router = AppRouter()
    private let environment = AppEnvironment.bootstrap()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(router)
                .environment(\.appEnvironment, environment)
        }
    }
}
