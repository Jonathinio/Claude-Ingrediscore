import SwiftUI

struct IngredientDetailView: View {
    let ingredient: Ingredient

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.large) {
                SectionCard(title: ingredient.canonicalName) {
                    VStack(alignment: .leading, spacing: AppSpacing.small) {
                        HStack(spacing: AppSpacing.medium) {
                            ScoreBadgeView(score: ingredient.score)
                            ConfidenceBadgeView(confidence: ingredient.confidenceLevel)
                        }

                        Text(ingredient.summaryShort)
                            .foregroundStyle(.secondary)
                    }
                }

                SectionCard(title: "Why") {
                    VStack(alignment: .leading, spacing: AppSpacing.small) {
                        Text(ingredient.scoreReasoning)
                        Text(ingredient.evidenceOverview)
                            .foregroundStyle(.secondary)
                    }
                }

                if !ingredient.positives.isEmpty {
                    SectionCard(title: "Positives") {
                        ForEach(ingredient.positives, id: \.self) { item in
                            Text("• \(item)")
                        }
                    }
                }

                if !ingredient.negatives.isEmpty {
                    SectionCard(title: "Concerns") {
                        ForEach(ingredient.negatives, id: \.self) { item in
                            Text("• \(item)")
                        }
                    }
                }

                if !ingredient.studies.isEmpty {
                    VStack(alignment: .leading, spacing: AppSpacing.medium) {
                        Text("Evidence")
                            .font(.headline)

                        ForEach(ingredient.studies) { study in
                            EvidenceStudyCardView(study: study)
                        }
                    }
                }
            }
            .padding(AppSpacing.medium)
        }
        .navigationTitle("Ingredient")
    }
}
