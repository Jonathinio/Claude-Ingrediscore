import Foundation

struct APIClient {
    let baseURL: URL
    let session: URLSession
    let timeoutInterval: TimeInterval

    init(
        baseURL: URL,
        session: URLSession = .shared,
        timeoutInterval: TimeInterval = 30
    ) {
        self.baseURL = baseURL
        self.session = session
        self.timeoutInterval = timeoutInterval
    }

    func post<T: Decodable, U: Encodable>(path: String, body: U, as type: T.Type) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))))
        request.httpMethod = "POST"
        request.timeoutInterval = timeoutInterval
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)

        return try await execute(request, as: type)
    }

    func get<T: Decodable>(path: String, as type: T.Type) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))))
        request.httpMethod = "GET"
        request.timeoutInterval = timeoutInterval
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        return try await execute(request, as: type)
    }

    private func execute<T: Decodable>(_ request: URLRequest, as type: T.Type) async throws -> T {
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AppError.unknown("Invalid server response.")
        }

        let decoder = JSONDecoder()

        guard (200...299).contains(httpResponse.statusCode) else {
            if let apiError = try? decoder.decode(APIErrorEnvelopeDTO.self, from: data) {
                throw mapAPIError(apiError.error)
            }
            throw AppError.networkFailure
        }

        do {
            return try decoder.decode(type, from: data)
        } catch {
            throw AppError.unknown("Failed to decode server response.")
        }
    }

    private func mapAPIError(_ error: APIErrorDTO) -> AppError {
        switch error.code {
        case "BARCODE_NOT_FOUND":
            return .barcodeNotFound
        case "OCR_TEXT_EMPTY":
            return .ocrFailed
        case "UPSTREAM_TIMEOUT", "RATE_LIMITED":
            return .networkFailure
        default:
            return .unknown(error.message)
        }
    }
}
