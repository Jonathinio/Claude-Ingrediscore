import Foundation

struct EvidenceStudy: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let authors: String?
    let journal: String?
    let year: Int?
    let type: String
    let quality: StudyQuality
    let populationType: PopulationType
    let sampleSize: String?
    let duration: String?
    let keyFindings: String
    let limitations: String
    let url: URL?
    let pmid: String?
}
