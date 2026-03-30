import SwiftUI

struct IngredientRowView: View {
    let match: IngredientMatch

    var body: some View {
        HStack(spacing: AppSpacing.medium) {
            ScoreBadgeView(score: match.ingredient?.score ?? 5)

            VStack(alignment: .leading, spacing: AppSpacing.xSmall) {
                Text(match.displayName)
                    .font(.headline)

                Text(match.originalName)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                Text(match.matchType.rawValue.capitalized)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }

            Spacer()
        }
        .padding(.vertical, AppSpacing.small)
    }
}
