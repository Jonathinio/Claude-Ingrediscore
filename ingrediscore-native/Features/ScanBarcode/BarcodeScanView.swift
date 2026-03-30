import AVFoundation
import SwiftUI

struct BarcodeScanView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @StateObject private var scannerCoordinator = BarcodeScannerCoordinator()
    @State private var barcodeInput = ""
    @State private var isLoading = false
    @State private var lookupError: String?
    @State private var showFallback = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                heroSection
                liveScannerSection
                manualBarcodeSection

                if let lookupError {
                    errorCard(message: lookupError)
                }

                if showFallback {
                    fallbackSection
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Scan")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            scannerCoordinator.onCodeDetected = { code in
                barcodeInput = code
                Task { await lookupBarcode() }
            }
            await scannerCoordinator.configureIfNeeded()
            scannerCoordinator.start()
        }
        .onDisappear {
            scannerCoordinator.stop()
        }
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Scan Product")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(Color.primary)

            Text("Point the camera at a barcode. Known products should open immediately. Unknown products should fall into guided capture.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack(spacing: 10) {
                statusPill(title: "Live Camera", tint: .green, systemImage: "camera.viewfinder")
                statusPill(title: "Barcode First", tint: .green, systemImage: "barcode.viewfinder")
            }
        }
    }

    private var liveScannerSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Camera Scanner")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            ZStack(alignment: .bottom) {
                CameraPreviewView(session: scannerCoordinator.session)
                    .frame(height: 320)
                    .clipShape(RoundedRectangle(cornerRadius: 32, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 32, style: .continuous)
                            .stroke(Color.white.opacity(0.18), lineWidth: 1)
                    )
                    .overlay(scanFrameOverlay.padding(28))

                Text(scannerCoordinator.authorizationDenied ? "Camera access denied. Use manual barcode entry below." : "Align the barcode inside the frame")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.92))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(.black.opacity(0.45))
                    .clipShape(Capsule())
                    .padding(.bottom, 18)
            }
        }
    }

    private var manualBarcodeSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Manual Barcode Entry")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            VStack(alignment: .leading, spacing: 14) {
                TextField("UPC / EAN barcode", text: $barcodeInput)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                Button {
                    Task { await lookupBarcode() }
                } label: {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "barcode.viewfinder")
                        }
                        Text(isLoading ? "Looking up…" : "Lookup Product")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.black)
                .disabled(isLoading || barcodeInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(Color(.systemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
            )
        }
    }

    private var scanFrameOverlay: some View {
        GeometryReader { proxy in
            let width = proxy.size.width * 0.78
            let height: CGFloat = 120
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.green.opacity(0.95), style: StrokeStyle(lineWidth: 3, dash: [10, 8]))
                .frame(width: width, height: height)
                .position(x: proxy.size.width / 2, y: proxy.size.height / 2)
        }
    }

    private var fallbackSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Product Not Found")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            VStack(alignment: .leading, spacing: 14) {
                Text("If the product is missing from the database, the next step should be guided product capture.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 10) {
                    fallbackStep(number: 1, title: "Capture front of pack")
                    fallbackStep(number: 2, title: "Capture nutrition label")
                    fallbackStep(number: 3, title: "Capture ingredient list")
                }

                Button {
                    router.path.append(AppRoute.ingredientScan)
                } label: {
                    HStack {
                        Image(systemName: "camera.viewfinder")
                        Text("Continue to Capture / Analysis")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(Color(.systemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
            )
        }
    }

    private func errorCard(message: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Lookup Note")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(1.5)
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(Color.orange.opacity(0.08)))
        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Color.orange.opacity(0.12), lineWidth: 1))
    }

    private func fallbackStep(number: Int, title: String) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(.secondarySystemBackground))
                    .frame(width: 28, height: 28)
                Text("\(number)")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
            }
            Text(title)
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(Color.primary)
        }
    }

    private func statusPill(title: String, tint: Color, systemImage: String) -> some View {
        Label(title, systemImage: systemImage)
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(tint.opacity(0.12))
            .foregroundStyle(tint)
            .clipShape(Capsule())
    }

    private func lookupBarcode() async {
        isLoading = true
        lookupError = nil
        showFallback = false
        defer { isLoading = false }

        let trimmed = barcodeInput.trimmingCharacters(in: .whitespacesAndNewlines)

        if let product = try? await environment.productRepository.lookupProduct(barcode: trimmed) {
            scannerCoordinator.stop()
            router.path.append(AppRoute.productResult(product))
        } else {
            lookupError = "No existing product was found for this barcode. The next step is guided new-product capture."
            showFallback = true
        }
    }
}

struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.previewLayer.session = session
        view.previewLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {
        uiView.previewLayer.session = session
    }
}

final class PreviewView: UIView {
    override class var layerClass: AnyClass {
        AVCaptureVideoPreviewLayer.self
    }

    var previewLayer: AVCaptureVideoPreviewLayer {
        layer as! AVCaptureVideoPreviewLayer
    }
}
