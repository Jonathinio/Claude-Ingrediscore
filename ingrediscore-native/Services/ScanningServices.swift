import AVFoundation
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

final class BarcodeMetadataDelegate: NSObject, AVCaptureMetadataOutputObjectsDelegate {
    var onCodeDetected: ((String) -> Void)?
    private var didDetectCode = false

    func reset() {
        didDetectCode = false
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !didDetectCode,
              let first = metadataObjects.compactMap({ $0 as? AVMetadataMachineReadableCodeObject }).first,
              let value = first.stringValue else { return }
        didDetectCode = true
        onCodeDetected?(value)
    }
}

@MainActor
final class BarcodeScannerCoordinator: NSObject, ObservableObject {
    @Published var authorizationDenied = false
    @Published var session = AVCaptureSession()
    var onCodeDetected: ((String) -> Void)? {
        didSet { metadataDelegate.onCodeDetected = onCodeDetected }
    }

    private let metadataOutput = AVCaptureMetadataOutput()
    private let metadataDelegate = BarcodeMetadataDelegate()

    func configureIfNeeded() async {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            await configureSession()
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            if granted {
                await configureSession()
            } else {
                authorizationDenied = true
            }
        default:
            authorizationDenied = true
        }
    }

    func start() {
        if !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async {
                self.session.startRunning()
            }
        }
    }

    func stop() {
        if session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async {
                self.session.stopRunning()
            }
        }
    }

    private func configureSession() async {
        guard session.inputs.isEmpty else { return }
        metadataDelegate.reset()

        session.beginConfiguration()
        session.sessionPreset = .high

        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input) else {
            session.commitConfiguration()
            authorizationDenied = true
            return
        }
        session.addInput(input)

        guard session.canAddOutput(metadataOutput) else {
            session.commitConfiguration()
            return
        }
        session.addOutput(metadataOutput)
        metadataOutput.setMetadataObjectsDelegate(metadataDelegate, queue: DispatchQueue.main)
        metadataOutput.metadataObjectTypes = [.ean8, .ean13, .upce, .code128, .code39, .qr]

        session.commitConfiguration()
    }
}
