import SwiftUI

struct ProductResultView: View {
    let product: Product
    @EnvironmentObject private var router: AppRouter

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: AppSpacing.large) {
                SectionCard(title: product.name) {
                    VStack(alignment: .leading, spacing: AppSpacing.small) {
                        if let brand = product.brand {
                            Text(brand)
                                .foregroundStyle(.secondary)
                        }

                        if let analysis = product.analysis {
                            HStack(spacing: AppSpacing.medium) {
                                ScoreBadgeView(score: analysis.overallScore)
                                VStack(alignment: .leading, spacing: AppSpacing.small) {
                                    ConfidenceBadgeView(confidence: analysis.confidenceLevel)
                                    Text(analysis.summary)
                                        .font(.subheadline)
                                }
                            }

                            Text(analysis.scoreExplanation)
                                .font(.body)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                if let analysis = product.analysis {
                    SectionCard(title: "Ingredients") {
                        VStack(spacing: AppSpacing.small) {
                            ForEach(analysis.ingredients) { match in
                                Button {
                                    if let ingredient = match.ingredient {
                                        router.path.append(AppRoute.ingredientDetail(ingredient))
                                    }
                                } label: {
                                    IngredientRowView(match: match)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
            .padding(AppSpacing.medium)
        }
        .navigationTitle("Result")
    }
}
