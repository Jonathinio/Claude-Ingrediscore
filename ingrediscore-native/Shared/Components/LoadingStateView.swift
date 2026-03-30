import SwiftUI

struct LoadingStateView: View {
    let title: String
    let subtitle: String?

    var body: some View {
        VStack(spacing: AppSpacing.medium) {
            ProgressView()
            Text(title)
                .font(.headline)
            if let subtitle {
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(AppSpacing.large)
    }
}
