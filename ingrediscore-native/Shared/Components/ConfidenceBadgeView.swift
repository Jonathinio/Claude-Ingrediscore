import SwiftUI

struct ConfidenceBadgeView: View {
    let confidence: ConfidenceLevel

    private var color: Color {
        switch confidence {
        case .high: return AppColors.positive
        case .moderate: return AppColors.caution
        case .low: return AppColors.negative
        }
    }

    var body: some View {
        Text(confidence.rawValue.capitalized)
            .font(.caption.bold())
            .padding(.horizontal, AppSpacing.small)
            .padding(.vertical, AppSpacing.xSmall)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}
