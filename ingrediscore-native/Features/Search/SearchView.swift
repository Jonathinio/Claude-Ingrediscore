import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var query = ""
    @State private var ingredients: [Ingredient] = []
    @State private var isLoading = false
    @State private var loadError: String?

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

                if let loadError {
                    debugStateCard(
                        title: "Ingredient load failed",
                        message: loadError,
                        tint: .red
                    )
                } else if ingredients.isEmpty, !isLoading {
                    debugStateCard(
                        title: "No ingredients loaded",
                        message: "The screen loaded zero items from the current backend path.",
                        tint: .orange
                    )
                } else {
                    Text("Loaded \(ingredients.count) ingredients")
                        .font(.caption)
                        .foregroundStyle(.secondary)
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
            loadError = nil
            do {
                let loaded = try await environment.analysisRepository.allIngredients(limit: 1000)
                print("[SearchView] loaded ingredients count=\(loaded.count)")
                ingredients = loaded
            } catch {
                let message = error.localizedDescription
                print("[SearchView] failed to load ingredients error=\(message)")
                loadError = message
            }
            isLoading = false
        }
    }

    private func debugStateCard(title: String, message: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(1.5)
                .foregroundStyle(tint)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(tint.opacity(0.08)))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(tint.opacity(0.12), lineWidth: 1))
    }
}
