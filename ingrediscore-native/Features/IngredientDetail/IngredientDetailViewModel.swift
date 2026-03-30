import Foundation

@MainActor
final class IngredientDetailViewModel: ObservableObject {
    @Published var ingredient: Ingredient

    init(ingredient: Ingredient) {
        self.ingredient = ingredient
    }
}
