import SwiftUI

struct IngredientDetailView: View {
    let ingredient: Ingredient

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                heroSection
                whySection

                if !ingredient.negatives.isEmpty {
                    insightSection(
                        title: "Potential Concerns",
                        subtitle: "Things worth watching",
                        items: ingredient.negatives,
                        tint: .red,
                        systemImage: "exclamationmark.triangle.fill"
                    )
                }

                if !ingredient.positives.isEmpty {
                    insightSection(
                        title: "Potential Benefits",
                        subtitle: "Helpful signals in the evidence",
                        items: ingredient.positives,
                        tint: .green,
                        systemImage: "plus.circle.fill"
                    )
                }

                if !ingredient.studies.isEmpty {
                    evidenceSection
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Ingredient")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Ingredient Profile")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    Text(ingredient.canonicalName)
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.primary)

                    if !ingredient.aliases.isEmpty {
                        Text(ingredient.aliases.prefix(3).joined(separator: " • "))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                Spacer(minLength: 12)

                ScoreBadgeView(score: ingredient.score)
                    .scaleEffect(1.35)
                    .padding(.top, 8)
            }

            HStack(spacing: 10) {
                statusPill
                confidencePill
            }

            Text(ingredient.summaryShort)
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundStyle(Color.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .stroke(Color.black.opacity(0.04), lineWidth: 1)
        )
    }

    private var whySection: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Why This Score")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    Text("How the current evidence shaped the rating")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                ZStack {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color(.secondarySystemBackground))
                        .frame(width: 44, height: 44)
                    Image(systemName: "waveform.path.ecg")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(Color.primary)
                }
            }

            Text(ingredient.scoreReasoning)
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .foregroundStyle(Color.primary)
                .fixedSize(horizontal: false, vertical: true)

            Divider()
                .overlay(Color.black.opacity(0.06))

            Text(ingredient.evidenceOverview)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .stroke(Color.black.opacity(0.04), lineWidth: 1)
        )
    }

    private func insightSection(title: String, subtitle: String, items: [String], tint: Color, systemImage: String) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(tint)

                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(tint.opacity(0.7))
                }

                Spacer()

                ZStack {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(tint.opacity(0.14))
                        .frame(width: 44, height: 44)

                    Image(systemName: systemImage)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(tint)
                }
            }

            VStack(alignment: .leading, spacing: 14) {
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 12) {
                        Circle()
                            .fill(tint.opacity(0.9))
                            .frame(width: 8, height: 8)
                            .padding(.top, 6)

                        Text(item)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(Color.primary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(tint.opacity(0.05))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .stroke(tint.opacity(0.08), lineWidth: 1)
        )
    }

    private var evidenceSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Evidence")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .textCase(.uppercase)
                    .tracking(2)
                    .foregroundStyle(.secondary)

                Text("Key studies and references behind the score")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 4)

            VStack(spacing: 12) {
                ForEach(ingredient.studies) { study in
                    EvidenceStudyCardView(study: study)
                }
            }
        }
    }

    private var statusPill: some View {
        let tint: Color = ingredient.score >= 8 ? .green : (ingredient.score >= 5 ? .orange : .red)
        let label: String = ingredient.score >= 8 ? "Likely Beneficial" : (ingredient.score >= 5 ? "Mixed Evidence" : "Potential Concern")
        let symbol: String = ingredient.score >= 8 ? "checkmark.circle.fill" : (ingredient.score >= 5 ? "exclamationmark.circle.fill" : "exclamationmark.triangle.fill")

        return Label(label, systemImage: symbol)
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(tint.opacity(0.12))
            .foregroundStyle(tint)
            .clipShape(Capsule())
    }

    private var confidencePill: some View {
        Text(ingredient.confidenceLevel.rawValue.capitalized + " Confidence")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(.secondarySystemBackground))
            .foregroundStyle(.secondary)
            .clipShape(Capsule())
    }
}
