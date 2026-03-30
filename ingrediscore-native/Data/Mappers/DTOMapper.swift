import Foundation

enum DTOMapper {
    static func map(_ dto: ScoringVersionDTO) -> ScoringVersion {
        ScoringVersion(
            id: dto.id,
            parserVersion: dto.parserVersion,
            ingredientModelVersion: dto.ingredientModelVersion,
            scoringRulesVersion: dto.scoringRulesVersion,
            rationaleVersion: dto.rationaleVersion
        )
    }

    static func map(_ dto: EvidenceStudyDTO) -> EvidenceStudy {
        EvidenceStudy(
            id: dto.id,
            title: dto.title,
            authors: dto.authors,
            journal: dto.journal,
            year: dto.year,
            type: dto.type,
            quality: StudyQuality(rawValue: dto.quality) ?? .moderate,
            populationType: PopulationType(rawValue: dto.populationType) ?? .human,
            sampleSize: dto.sampleSize,
            duration: dto.duration,
            keyFindings: dto.keyFindings,
            limitations: dto.limitations,
            url: dto.url.flatMap(URL.init(string:)),
            pmid: dto.pmid
        )
    }

    static func map(_ dto: IngredientDTO) -> Ingredient {
        Ingredient(
            id: dto.id,
            canonicalName: dto.canonicalName,
            aliases: dto.aliases,
            category: IngredientCategory(rawValue: dto.category) ?? .other,
            score: dto.score,
            scoreReasoning: dto.scoreReasoning,
            summaryShort: dto.summaryShort,
            positives: dto.positives,
            negatives: dto.negatives,
            evidenceOverview: dto.evidenceOverview,
            confidenceLevel: ConfidenceLevel(rawValue: dto.confidenceLevel) ?? .moderate,
            evidenceType: EvidenceType(rawValue: dto.evidenceType) ?? .mixed,
            studies: dto.studies.map(map)
        )
    }

    static func map(_ dto: IngredientMatchDTO) -> IngredientMatch {
        IngredientMatch(
            id: dto.id,
            originalName: dto.originalName,
            displayName: dto.displayName,
            matchType: MatchType(rawValue: dto.matchType) ?? .unknown,
            confidence: ConfidenceLevel(rawValue: dto.confidence) ?? .moderate,
            ingredient: dto.ingredient.map(map),
            subIngredients: dto.subIngredients.map(map)
        )
    }

    static func map(_ dto: ProductAnalysisDTO) -> ProductAnalysis {
        ProductAnalysis(
            overallScore: dto.overallScore,
            summary: dto.summary,
            scoreExplanation: dto.scoreExplanation,
            confidenceLevel: ConfidenceLevel(rawValue: dto.confidenceLevel) ?? .moderate,
            evidenceBasis: dto.evidenceBasis,
            keyConcerns: dto.keyConcerns,
            positiveAttributes: dto.positiveAttributes,
            loweredScoreBy: dto.loweredScoreBy,
            improvedScoreBy: dto.improvedScoreBy,
            processingLevel: ProcessingLevel(rawValue: dto.processingLevel) ?? .moderatelyProcessed,
            ingredients: dto.ingredients.map(map),
            scoreVersion: map(dto.scoreVersion)
        )
    }

    static func map(_ dto: ProductDTO) -> Product {
        Product(
            id: dto.id,
            barcode: dto.barcode,
            name: dto.name,
            brand: dto.brand,
            rawIngredientText: dto.rawIngredientText,
            analysis: dto.analysis.map(map),
            imageRefs: nil,
            updatedAt: Date()
        )
    }
}
