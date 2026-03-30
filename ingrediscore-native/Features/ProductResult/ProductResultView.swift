import SwiftUI

struct ProductResultView: View {
    let product: Product
    @EnvironmentObject private var router: AppRouter

    private var analysis: ProductAnalysis? { product.analysis }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                heroSection

                if let analysis {
                    insightCardsSection(analysis: analysis)
                    ingredientBreakdownSection(analysis: analysis)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Analysis")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(product.brand ?? "Scanned Product")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    Text(product.name)
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.primary)
                        .multilineTextAlignment(.leading)

                    if let barcode = product.barcode {
                        Label(barcode, systemImage: "barcode")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer(minLength: 12)

                if let score = analysis?.overallScore {
                    ScoreBadgeView(score: score)
                        .scaleEffect(1.35)
                        .padding(.top, 8)
                }
            }

            if let analysis {
                HStack(spacing: 10) {
                    resultStatusBadge(for: analysis)
                    confidencePill(analysis.confidenceLevel)
                }

                Text(analysis.summary)
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundStyle(Color.primary)

                Text(analysis.scoreExplanation)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
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

    private func insightCardsSection(analysis: ProductAnalysis) -> some View {
        VStack(spacing: 16) {
            concernCard(analysis: analysis)
            positiveCard(analysis: analysis)
        }
    }

    private func concernCard(analysis: ProductAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Critical Concerns")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(Color.red)

                    Text("Potential health impacts to consider")
                        .font(.caption)
                        .foregroundStyle(Color.red.opacity(0.7))
                }

                Spacer()

                iconBadge(systemImage: "exclamationmark.triangle.fill", tint: .red)
            }

            if analysis.keyConcerns.isEmpty {
                Text("No critical concerns identified.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .italic()
            } else {
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(Array(analysis.keyConcerns.enumerated()), id: \.offset) { _, concern in
                        bulletRow(text: concern, tint: .red)
                    }
                }
            }

            if !analysis.loweredScoreBy.isEmpty {
                driverChips(title: "Primary Drivers", items: analysis.loweredScoreBy, tint: .red)
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(Color.red.opacity(0.05))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .stroke(Color.red.opacity(0.08), lineWidth: 1)
        )
    }

    private func positiveCard(analysis: ProductAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Positive Attributes")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(Color.green)

                    Text("Beneficial nutritional qualities")
                        .font(.caption)
                        .foregroundStyle(Color.green.opacity(0.7))
                }

                Spacer()

                iconBadge(systemImage: "plus.circle.fill", tint: .green)
            }

            if analysis.positiveAttributes.isEmpty {
                Text("No significant positive attributes identified.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .italic()
            } else {
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(Array(analysis.positiveAttributes.enumerated()), id: \.offset) { _, attribute in
                        bulletRow(text: attribute, tint: .green)
                    }
                }
            }

            if !analysis.improvedScoreBy.isEmpty {
                driverChips(title: "Primary Drivers", items: analysis.improvedScoreBy, tint: .green)
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(Color.green.opacity(0.05))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .stroke(Color.green.opacity(0.08), lineWidth: 1)
        )
    }

    private func ingredientBreakdownSection(analysis: ProductAnalysis) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Ingredient Breakdown")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    Text("Tap an ingredient to explore the evidence.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal, 4)

            VStack(spacing: 12) {
                ForEach(analysis.ingredients) { match in
                    Button {
                        if let ingredient = match.ingredient {
                            router.path.append(AppRoute.ingredientDetail(ingredient))
                        }
                    } label: {
                        parityIngredientCard(match: match)
                    }
                    .buttonStyle(.plain)
                    .disabled(match.ingredient == nil)
                }
            }
        }
    }

    private func parityIngredientCard(match: IngredientMatch) -> some View {
        HStack(spacing: 16) {
            ScoreBadgeView(score: match.ingredient?.score ?? 5)

            VStack(alignment: .leading, spacing: 5) {
                Text(match.displayName)
                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                    .foregroundStyle(Color.primary)
                    .lineLimit(1)

                Text(match.ingredient?.category.rawValue.replacingOccurrences(of: "([a-z])([A-Z])", with: "$1 $2", options: .regularExpression).capitalized ?? match.originalName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }

            Spacer(minLength: 12)

            Image(systemName: "chevron.right")
                .font(.system(size: 15, weight: .bold))
                .foregroundStyle(.tertiary)
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(Color(.systemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
    }

    private func resultStatusBadge(for analysis: ProductAnalysis) -> some View {
        let score = analysis.overallScore
        let label: String
        let color: Color
        let symbol: String

        switch score {
        case 8...10:
            label = "Likely Beneficial"
            color = .green
            symbol = "checkmark.circle.fill"
        case 5...7:
            label = "Mixed Evidence"
            color = .orange
            symbol = "exclamationmark.circle.fill"
        default:
            label = "Potential Concern"
            color = .red
            symbol = "exclamationmark.triangle.fill"
        }

        return Label(label, systemImage: symbol)
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(color.opacity(0.12))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }

    private func confidencePill(_ confidence: ConfidenceLevel) -> some View {
        Text(confidence.rawValue.capitalized + " Confidence")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(.secondarySystemBackground))
            .foregroundStyle(.secondary)
            .clipShape(Capsule())
    }

    private func iconBadge(systemImage: String, tint: Color) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(tint.opacity(0.14))
                .frame(width: 44, height: 44)

            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(tint)
        }
    }

    private func bulletRow(text: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Circle()
                .fill(tint.opacity(0.9))
                .frame(width: 8, height: 8)
                .padding(.top, 6)

            Text(text)
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundStyle(Color.primary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func driverChips(title: String, items: [String], tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Divider()
                .overlay(tint.opacity(0.15))

            Text(title)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(tint.opacity(0.8))

            FlexibleChipWrap(items: items, tint: tint) { item in
                if let ingredient = analysis?.ingredients.first(where: { $0.displayName == item || $0.originalName == item })?.ingredient {
                    router.path.append(AppRoute.ingredientDetail(ingredient))
                }
            }
        }
    }
}

private struct FlexibleChipWrap: View {
    let items: [String]
    let tint: Color
    let tap: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(chunked(items, size: 2), id: \.self) { row in
                HStack(alignment: .top, spacing: 10) {
                    ForEach(row, id: \.self) { item in
                        Button {
                            tap(item)
                        } label: {
                            HStack(spacing: 8) {
                                Text(item)
                                    .font(.system(size: 11, weight: .bold, design: .rounded))
                                    .multilineTextAlignment(.leading)
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 10, weight: .bold))
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.systemBackground))
                            .foregroundStyle(tint)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .stroke(tint.opacity(0.12), lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }

                    if row.count == 1 {
                        Spacer()
                    }
                }
            }
        }
    }

    private func chunked(_ items: [String], size: Int) -> [[String]] {
        stride(from: 0, to: items.count, by: size).map {
            Array(items[$0 ..< Swift.min($0 + size, items.count)])
        }
    }
}
