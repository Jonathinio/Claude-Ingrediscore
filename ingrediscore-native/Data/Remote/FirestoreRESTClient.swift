import Foundation

struct FirestoreRESTClient: Sendable {
    struct Configuration: Sendable {
        let projectID: String
        let databaseID: String
        let apiKey: String

        var baseURL: URL {
            URL(string: "https://firestore.googleapis.com/v1/projects/\(projectID)/databases/\(databaseID)/documents")!
        }
    }

    let configuration: Configuration
    let session: URLSession

    init(configuration: Configuration, session: URLSession = .shared) {
        self.configuration = configuration
        self.session = session
    }

    func getDocument(path: String) async throws -> FirestoreDocumentDTO {
        let trimmed = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard var components = URLComponents(url: configuration.baseURL.appendingPathComponent(trimmed), resolvingAgainstBaseURL: false) else {
            throw AppError.networkFailure
        }
        components.queryItems = [URLQueryItem(name: "key", value: configuration.apiKey)]

        guard let url = components.url else {
            throw AppError.networkFailure
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AppError.networkFailure
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw AppError.networkFailure
        }

        do {
            return try JSONDecoder().decode(FirestoreDocumentDTO.self, from: data)
        } catch {
            throw AppError.unknown("Failed to decode Firestore response.")
        }
    }
}
