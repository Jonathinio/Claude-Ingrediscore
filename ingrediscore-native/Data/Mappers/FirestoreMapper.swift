import Foundation

enum FirestoreMapper {
    static func mapProduct(document: FirestoreDocumentDTO) -> Product {
        let fields = document.fields
        let barcode = fields.string("barcode")
        let name = fields.string("name") ?? barcode ?? "Unknown Product"
        let brand = fields.string("brand")
        let rawIngredientText = fields.string("ingredientsRaw")
        let updatedAt = fields.timestampDate("updatedAt") ?? fields.timestampDate("scannedAt") ?? Date()

        let analysis = mapProductAnalysis(fields: fields)
        let imageRefs = ProductImageRefs(
            frontImageURL: nil,
            ingredientsImageURL: nil,
            nutritionImageURL: nil
        )

        return Product(
            id: barcode ?? document.name.split(separator: "/").last.map(String.init) ?? UUID().uuidString,
            barcode: barcode,
            name: name,
            brand: brand,
            rawIngredientText: rawIngredientText,
            analysis: analysis,
            imageRefs: imageRefs,
            updatedAt: updatedAt
        )
    }

    static func mapIngredient(document: FirestoreDocumentDTO) -> Ingredient {
        let fields = document.fields
        return mapIngredient(fields: fields, fallbackID: document.name.split(separator: "/").last.map(String.init) ?? UUID().uuidString)
    }

    static func mapIngredient(fields: [String: FirestoreValueDTO], fallbackID: String) -> Ingredient {
        Ingredient(
            id: fields.string("id") ?? fallbackID,
            canonicalName: fields.string("name") ?? fields.string("canonicalName") ?? fallbackID,
            aliases: fields.stringArray("synonyms"),
            category: mapIngredientCategory(fields.string("category")),
            score: fields.integer("score") ?? 5,
            scoreReasoning: fields.string("scoreReasoning") ?? "No score reasoning available yet.",
            summaryShort: fields.string("summaryShort") ?? "No summary available yet.",
            positives: fields.stringArray("positives"),
            negatives: fields.stringArray("negatives"),
            evidenceOverview: fields.string("evidenceOverview") ?? "Evidence overview unavailable.",
            confidenceLevel: mapConfidenceLevel(fields.string("confidenceLevel")),
            evidenceType: mapEvidenceType(fields.string("evidenceType")),
            studies: mapStudies(fields.mapArray("studies"))
        )
    }

    static func mapProductAnalysis(fields: [String: FirestoreValueDTO]) -> ProductAnalysis? {
        let analysisFields = fields.map("analysis") ?? [:]

        let score = analysisFields.integer("overallScore")
            ?? analysisFields.integer("score")
            ?? fields.integer("score")

        let summary = analysisFields.string("summary") ?? fields.string("summary")

        guard let overallScore = score, let summary else {
            return nil
        }

        let ingredients = mapIngredientMatches(
            analysisFields.mapArray("ingredients") + fields.mapArray("ingredientsParsed")
        )

        return ProductAnalysis(
            overallScore: overallScore,
            summary: summary,
            scoreExplanation: analysisFields.string("scoreExplanation")
                ?? analysisFields.string("scoreReasoning")
                ?? fields.string("summary")
                ?? "Analysis explanation unavailable.",
            confidenceLevel: mapConfidenceLevel(analysisFields.string("confidenceLevel")),
            evidenceBasis: analysisFields.string("evidenceBasis")
                ?? "Backed by recovered Firestore ingredient data.",
            keyConcerns: analysisFields.stringArray("keyConcerns"),
            positiveAttributes: analysisFields.stringArray("positiveAttributes"),
            loweredScoreBy: analysisFields.stringArray("loweredScoreBy"),
            improvedScoreBy: analysisFields.stringArray("improvedScoreBy"),
            processingLevel: mapProcessingLevel(analysisFields.string("processingLevel")),
            ingredients: ingredients,
            scoreVersion: ScoringVersion(
                id: "firestore-v1",
                parserVersion: "firestore",
                ingredientModelVersion: "firestore",
                scoringRulesVersion: "firestore",
                rationaleVersion: "firestore"
            )
        )
    }

    static func mapIngredientMatches(_ maps: [[String: FirestoreValueDTO]]) -> [IngredientMatch] {
        maps.compactMap { map in
            let originalName = map.string("originalName") ?? map.string("name") ?? map.string("displayName") ?? "Unknown Ingredient"
            let displayName = map.string("displayName") ?? originalName
            let nestedIngredient = map.map("ingredient").map { nested in
                mapIngredient(fields: nested, fallbackID: nested.string("id") ?? displayName.lowercased().replacingOccurrences(of: " ", with: "-"))
            }

            return IngredientMatch(
                id: map.string("id") ?? displayName.lowercased().replacingOccurrences(of: " ", with: "-"),
                originalName: originalName,
                displayName: displayName,
                matchType: mapMatchType(map.string("matchType")),
                confidence: mapConfidenceLevel(map.string("confidence")),
                ingredient: nestedIngredient,
                subIngredients: []
            )
        }
    }

    static func mapStudies(_ maps: [[String: FirestoreValueDTO]]) -> [EvidenceStudy] {
        maps.map { map in
            EvidenceStudy(
                id: map.string("id") ?? UUID().uuidString,
                title: map.string("title") ?? "Untitled Study",
                authors: map.string("authors"),
                journal: map.string("journal"),
                year: map.integer("year"),
                type: map.string("type") ?? "Unknown",
                quality: mapStudyQuality(map.string("quality")),
                populationType: mapPopulationType(map.string("populationType")),
                sampleSize: map.string("sampleSize"),
                duration: map.string("duration"),
                keyFindings: map.string("keyFindings") ?? "",
                limitations: map.string("limitations") ?? "",
                url: map.string("url").flatMap(URL.init(string:)),
                pmid: map.string("pmid")
            )
        }
    }

    static func mapConfidenceLevel(_ value: String?) -> ConfidenceLevel {
        switch value?.lowercased() {
        case "high": return .high
        case "low": return .low
        default: return .moderate
        }
    }

    static func mapProcessingLevel(_ value: String?) -> ProcessingLevel {
        switch value?.lowercased() {
        case "minimally processed", "minimallyprocessed": return .minimallyProcessed
        case "ultra processed", "ultraprocessed": return .ultraProcessed
        default: return .moderatelyProcessed
        }
    }

    static func mapMatchType(_ value: String?) -> MatchType {
        switch value?.lowercased() {
        case "exact": return .exact
        case "alias": return .alias
        case "compound": return .compound
        default: return .unknown
        }
    }

    static func mapStudyQuality(_ value: String?) -> StudyQuality {
        switch value?.lowercased() {
        case "high": return .high
        case "lower", "low": return .lower
        default: return .moderate
        }
    }

    static func mapPopulationType(_ value: String?) -> PopulationType {
        switch value?.lowercased() {
        case "animal": return .animal
        case "cell", "cellstudy", "cell study": return .cellStudy
        default: return .human
        }
    }

    static func mapIngredientCategory(_ value: String?) -> IngredientCategory {
        let normalized = value?
            .lowercased()
            .replacingOccurrences(of: "&", with: "and")
            .replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: "/", with: "")

        switch normalized {
        case "sweeteners": return .sweeteners
        case "preservatives": return .preservatives
        case "emulsifiers": return .emulsifiers
        case "coloradditives", "colors": return .colorAdditives
        case "oilsfats", "oilsandfats": return .oilsFats
        case "grainsstarches": return .grainsStarches
        case "vitaminsminerals": return .vitaminsMinerals
        case "flavorings", "flavourings": return .flavorings
        case "thickenersgums": return .thickenersGums
        case "acidityregulators": return .acidityRegulators
        case "antioxidants": return .antioxidants
        case "dairy": return .dairy
        case "enzymes": return .enzymes
        case "cultures": return .cultures
        case "produce": return .produce
        case "proteins": return .proteins
        case "spicesherbs", "spices": return .spicesHerbs
        default: return .other
        }
    }

    static func mapEvidenceType(_ value: String?) -> EvidenceType {
        switch value?.lowercased() {
        case "systematicreview", "systematic review": return .systematicReview
        case "metaanalysis", "meta analysis", "meta-analysis": return .metaAnalysis
        case "rct": return .rct
        case "observational": return .observational
        case "animalinvitro", "animal/in vitro": return .animalInVitro
        case "regulatory": return .regulatory
        default: return .mixed
        }
    }
}
