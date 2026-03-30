import Foundation

struct APIErrorEnvelopeDTO: Codable {
    let error: APIErrorDTO
}

struct APIErrorDTO: Codable {
    let code: String
    let message: String
    let retryable: Bool
    let details: [String: String]?
}
