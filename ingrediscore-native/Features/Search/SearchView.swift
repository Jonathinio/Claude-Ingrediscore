import SwiftUI

struct SearchView: View {
    enum SortOption: String, CaseIterable, Identifiable {
        case scoreHighToLow = "Score ↓"
        case scoreLowToHigh = "Score ↑"
        case name = "Name"

        var id: String { rawValue }
    }

    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var query = ""
    @State private var ingredients: [Ingredient] = []
    @State private var isLoading = false
    @State private var loadError: String?
    @State private var selectedCategory: IngredientCategory?
    @State private var sortOption: SortOption = .scoreHighToLow

    private var filteredIngredients: [Ingredient] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)

        let base = ingredients.filter { ingredient in
            let matchesQuery = trimmed.isEmpty ||
                ingredient.canonicalName.localizedCaseInsensitiveContains(trimmed) ||
                ingredient.aliases.contains(where: { $0.localizedCaseInsensitiveContains(trimmed) })
            let matchesCategory = selectedCategory == nil || ingredient.category == selectedCategory
            return matchesQuery && matchesCategory
        }

        switch sortOption {
        case .scoreHighToLow:
            return base.sorted { lhs, rhs in
                if lhs.score == rhs.score { return lhs.canonicalName < rhs.canonicalName }
                return lhs.score > rhs.score
            }
        case .scoreLowToHigh:
            return base.sorted { lhs, rhs in
                if lhs.score == rhs.score { return lhs.canonicalName < rhs.canonicalName }
                return lhs.score < rhs.score
            }
        case .name:
            return base.sorted { $0.canonicalName < $1.canonicalName }
        }
    }

    private var topCategories: [IngredientCategory] {
        let counts = Dictionary(grouping: ingredients, by: \.category).mapValues(\.count)
        return counts.sorted { lhs, rhs in
            if lhs.value == rhs.value { return lhs.key.rawValue < rhs.key.rawValue }
            return lhs.value > rhs.value
        }
        .map(\.key)
        .filter { $0 != .other }
        .prefix(8)
        .map { $0 }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Search")
                    .font(.system(size: 30, weight: .bold, design: .rounded))

                TextField("Search ingredients", text: $query)
                    .textFieldStyle(.roundedBorder)

                Picker("Sort", selection: $sortOption) {
                    ForEach(SortOption.allCases) { option in
                        Text(option.rawValue).tag(option)
                    }
                }
                .pickerStyle(.segmented)

                if !topCategories.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            categoryChip(title: "All", isSelected: selectedCategory == nil) {
                                selectedCategory = nil
                            }

                            ForEach(topCategories, id: \.self) { category in
                                categoryChip(
                                    title: prettyCategoryName(category),
                                    isSelected: selectedCategory == category
                                ) {
                                    selectedCategory = category
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

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
                    Text("Loaded \(ingredients.count) ingredients • showing \(filteredIngredients.count)")
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

    private func categoryChip(title: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(isSelected ? Color.black : Color(.systemBackground))
                .foregroundStyle(isSelected ? Color.white : Color.primary)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(Color.black.opacity(isSelected ? 0 : 0.08), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }

    private func prettyCategoryName(_ category: IngredientCategory) -> String {
        category.rawValue
            .replacingOccurrences(of: "([a-z])([A-Z])", with: "$1 $2", options: .regularExpression)
            .capitalized
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
