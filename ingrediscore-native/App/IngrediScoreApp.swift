import SwiftUI
import FirebaseCore

@main
struct IngrediScoreApp: App {
    @StateObject private var router = AppRouter()
    private let environment: AppEnvironment

    init() {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        self.environment = AppEnvironment.bootstrap()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(router)
                .environment(\.appEnvironment, environment)
        }
    }
}
