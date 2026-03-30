import Foundation

enum AppMode {
    case mock
    case live
    case firebase
}

struct AppConfiguration {
    let mode: AppMode
    let apiBaseURL: URL?
    let firebaseProjectID: String?
    let firebaseDatabaseID: String?
    let firebaseAPIKey: String?

    static func current() -> AppConfiguration {
        AppConfiguration(
            mode: .firebase,
            apiBaseURL: URL(string: "https://api.example.com"),
            firebaseProjectID: "just-keyword-477517-m5",
            firebaseDatabaseID: "ai-studio-38be78cd-dd16-4388-b437-a416b88e1f0c",
            firebaseAPIKey: "AIzaSyBX1TKbVXWxHg2IFdB5CAZjE8nORmghy_4"
        )
    }
}
