import Foundation

enum AppError: LocalizedError {
    case cameraPermissionDenied
    case barcodeNotFound
    case ocrFailed
    case networkFailure
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .cameraPermissionDenied:
            return "Camera permission is required to scan labels and barcodes."
        case .barcodeNotFound:
            return "No product was found for that barcode."
        case .ocrFailed:
            return "The label could not be read clearly."
        case .networkFailure:
            return "A network error occurred while loading analysis."
        case .unknown(let message):
            return message
        }
    }
}
