import Foundation

enum MockData {
    static let sampleIngredient = Ingredient(
        id: "citric-acid",
        canonicalName: "Citric Acid",
        aliases: ["E330"],
        category: .acidityRegulators,
        score: 6,
        scoreReasoning: "Generally recognized as safe in common food use, but not strongly beneficial.",
        summaryShort: "Common acidity regulator used in packaged foods.",
        positives: ["Widely studied", "Commonly tolerated"],
        negatives: ["Limited direct health benefit"],
        evidenceOverview: "Evidence largely supports safe use in food processing concentrations.",
        confidenceLevel: .moderate,
        evidenceType: .regulatory,
        studies: []
    )

    static let sampleAnalysis = ProductAnalysis(
        overallScore: 6,
        summary: "Moderately processed product with a mixed ingredient profile.",
        scoreExplanation: "Score is pulled down by added sweeteners and processing-related additives, but no extreme-risk ingredients were detected.",
        confidenceLevel: .moderate,
        evidenceBasis: "Confidence is moderate because several ingredients are well characterized, but exact concentrations are not known from the label.",
        keyConcerns: ["Added sweeteners", "Processing additives"],
        positiveAttributes: ["No major red-flag additives"],
        loweredScoreBy: ["Sugar", "Natural Flavors"],
        improvedScoreBy: ["Oats"],
        processingLevel: .moderatelyProcessed,
        ingredients: [
            IngredientMatch(
                id: "citric-acid",
                originalName: "citric acid",
                displayName: "Citric Acid",
                matchType: .exact,
                confidence: .moderate,
                ingredient: sampleIngredient,
                subIngredients: []
            )
        ],
        scoreVersion: ScoringVersion(
            id: "v1",
            parserVersion: "v1",
            ingredientModelVersion: "v1",
            scoringRulesVersion: "v1",
            rationaleVersion: "v1"
        )
    )

    static let sampleProducts: [Product] = [
        Product(
            id: "sample-1",
            barcode: "012345678905",
            name: "Sample Granola Bar",
            brand: "IngrediScore Labs",
            rawIngredientText: "Oats, sugar, citric acid, natural flavors",
            analysis: sampleAnalysis,
            imageRefs: nil,
            updatedAt: Date()
        )
    ]

    static let sampleIngredients: [Ingredient] = [sampleIngredient]
}
