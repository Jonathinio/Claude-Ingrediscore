import Foundation

enum ConfidenceLevel: String, Codable, Hashable {
    case low
    case moderate
    case high
}

enum ProcessingLevel: String, Codable, Hashable {
    case minimallyProcessed
    case moderatelyProcessed
    case ultraProcessed
}

enum MatchType: String, Codable, Hashable {
    case exact
    case alias
    case unknown
    case compound
}

enum StudyQuality: String, Codable, Hashable {
    case high
    case moderate
    case lower
}

enum PopulationType: String, Codable, Hashable {
    case human
    case animal
    case cellStudy
}

enum IngredientCategory: String, Codable, Hashable {
    case sweeteners
    case preservatives
    case emulsifiers
    case colorAdditives
    case oilsFats
    case grainsStarches
    case vitaminsMinerals
    case flavorings
    case thickenersGums
    case acidityRegulators
    case antioxidants
    case dairy
    case enzymes
    case cultures
    case produce
    case proteins
    case spicesHerbs
    case other
}

enum EvidenceType: String, Codable, Hashable {
    case systematicReview
    case metaAnalysis
    case rct
    case observational
    case animalInVitro
    case mixed
    case regulatory
}
