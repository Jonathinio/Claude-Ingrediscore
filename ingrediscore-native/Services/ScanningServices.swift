import Foundation

protocol BarcodeScanningService {
    func startScanning() async throws
    func stopScanning() async
}

protocol OCRServiceProtocol {
    func extractText(from imageData: Data) async throws -> String
}

protocol ImagePreprocessingServiceProtocol {
    func preprocess(_ imageData: Data) async throws -> Data
}

struct StubBarcodeScanningService: BarcodeScanningService {
    func startScanning() async throws {}
    func stopScanning() async {}
}

struct StubOCRService: OCRServiceProtocol {
    func extractText(from imageData: Data) async throws -> String {
        "Ingredients: oats, sugar, citric acid, natural flavors"
    }
}

struct StubImagePreprocessingService: ImagePreprocessingServiceProtocol {
    func preprocess(_ imageData: Data) async throws -> Data {
        imageData
    }
}
