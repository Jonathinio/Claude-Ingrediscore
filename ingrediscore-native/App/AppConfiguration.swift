import Foundation

enum AppMode {
    case mock
    case live
}

struct AppConfiguration {
    let mode: AppMode
    let apiBaseURL: URL?

    static func current() -> AppConfiguration {
        // Placeholder default while developing scaffold off-device.
        AppConfiguration(mode: .mock, apiBaseURL: URL(string: "https://api.example.com"))
    }
}
