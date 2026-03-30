import SwiftUI

struct ScoreBadgeView: View {
    let score: Int

    private var color: Color {
        switch score {
        case 8...10: return AppColors.positive
        case 5...7: return AppColors.caution
        default: return AppColors.negative
        }
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.15))
                .frame(width: 56, height: 56)

            Text("\(score)")
                .font(.headline)
                .foregroundStyle(color)
        }
    }
}
