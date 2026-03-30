import Foundation
import SwiftUI

final class AppRouter: ObservableObject {
    @Published var path = NavigationPath()

    func reset() {
        path = NavigationPath()
    }
}
