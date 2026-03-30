import SwiftUI

struct SectionCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.small) {
            Text(title)
                .font(.headline)
            content
        }
        .padding(AppSpacing.medium)
        .background(AppColors.secondarySurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}
