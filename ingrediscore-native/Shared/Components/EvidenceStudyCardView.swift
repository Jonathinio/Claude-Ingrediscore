import SwiftUI

struct EvidenceStudyCardView: View {
    let study: EvidenceStudy

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(study.title)
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color.primary)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(metaLine)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 12)

                qualityPill
            }

            Text(study.keyFindings)
                .font(.subheadline)
                .foregroundStyle(Color.primary)
                .fixedSize(horizontal: false, vertical: true)

            Text("Limitations: \(study.limitations)")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
    }

    private var metaLine: String {
        [study.journal, study.year.map(String.init), study.populationTypeLabel]
            .compactMap { $0 }
            .joined(separator: " • ")
    }

    private var qualityPill: some View {
        Text(study.qualityLabel)
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(Color(.secondarySystemBackground))
            .foregroundStyle(.secondary)
            .clipShape(Capsule())
    }
}

private extension EvidenceStudy {
    var qualityLabel: String {
        switch quality {
        case .high: return "High Quality"
        case .moderate: return "Moderate Quality"
        case .lower: return "Lower Quality"
        }
    }

    var populationTypeLabel: String {
        switch populationType {
        case .human: return "Human"
        case .animal: return "Animal"
        case .cellStudy: return "Cell Study"
        }
    }
}
