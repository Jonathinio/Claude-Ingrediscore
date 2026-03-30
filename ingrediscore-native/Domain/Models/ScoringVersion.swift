import Foundation

struct ScoringVersion: Codable, Hashable, Sendable {
    let id: String
    let parserVersion: String
    let ingredientModelVersion: String
    let scoringRulesVersion: String
    let rationaleVersion: String
}
