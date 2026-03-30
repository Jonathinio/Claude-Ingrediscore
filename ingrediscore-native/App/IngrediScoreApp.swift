import SwiftUI
import FirebaseCore

final class FirebaseAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        return true
    }
}

@main
struct IngrediScoreApp: App {
    @UIApplicationDelegateAdaptor(FirebaseAppDelegate.self) private var appDelegate
    @StateObject private var router = AppRouter()
    private let environment: AppEnvironment

    init() {
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
