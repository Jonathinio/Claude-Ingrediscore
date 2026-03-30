import SwiftUI

struct ErrorStateView: View {
    let title: String
    let message: String
    let retryTitle: String?
    let retryAction: (() -> Void)?

    var body: some View {
        VStack(spacing: AppSpacing.medium) {
            Text(title)
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            if let retryTitle, let retryAction {
                Button(retryTitle, action: retryAction)
                    .buttonStyle(.borderedProminent)
            }
        }
        .padding(AppSpacing.large)
    }
}
