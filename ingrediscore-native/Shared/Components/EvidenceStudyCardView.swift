import SwiftUI

struct EvidenceStudyCardView: View {
    let study: EvidenceStudy

    var body: some View {
        SectionCard(title: study.title) {
            VStack(alignment: .leading, spacing: AppSpacing.small) {
                Text([study.journal, study.year.map(String.init)].compactMap { $0 }.joined(separator: " • "))
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text(study.keyFindings)
                    .font(.subheadline)

                Text("Limitations: \(study.limitations)")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
