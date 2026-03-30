import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var query = ""
    @State private var ingredients: [Ingredient] = []
    @State private var isLoading = false

    private var filteredIngredients: [Ingredient] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return ingredients }
        return ingredients.filter {
            $0.canonicalName.localizedCaseInsensitiveContains(trimmed) ||
            $0.aliases.contains(where: { $0.localizedCaseInsensitiveContains(trimmed) })
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Search")
                    .font(.system(size: 30, weight: .bold, design: .rounded))

                TextField("Search ingredients", text: $query)
                    .textFieldStyle(.roundedBorder)

                if isLoading {
                    ProgressView("Loading ingredients…")
                        .padding(.top, 16)
                }

                VStack(spacing: 12) {
                    ForEach(filteredIngredients) { ingredient in
                        Button {
                            router.path.append(AppRoute.ingredientDetail(ingredient))
                        } label: {
                            HStack(spacing: 16) {
                                ScoreBadgeView(score: ingredient.score)
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(ingredient.canonicalName)
                                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                                        .foregroundStyle(Color.primary)
                                    Text(ingredient.category.rawValue.replacingOccurrences(of: "([a-z])([A-Z])", with: "$1 $2", options: .regularExpression).capitalized)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .foregroundStyle(.tertiary)
                            }
                            .padding(18)
                            .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(Color(.systemBackground)))
                            .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).stroke(Color.black.opacity(0.05), lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(20)
        }
        .background(Color(.systemGroupedBackground))
        .task {
            guard ingredients.isEmpty else { return }
            isLoading = true
            ingredients = (try? await environment.analysisRepository.allIngredients(limit: 200)) ?? []
            isLoading = false
        }
    }
}
