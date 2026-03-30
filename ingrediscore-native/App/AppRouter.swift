import Foundation
import SwiftUI

enum AppTab: Hashable {
    case home
    case search
    case scan
    case food
    case menu
}

final class AppRouter: ObservableObject {
    @Published var path = NavigationPath()
    @Published var selectedTab: AppTab = .home

    func reset() {
        path = NavigationPath()
    }

    func openTab(_ tab: AppTab) {
        selectedTab = tab
    }
}
