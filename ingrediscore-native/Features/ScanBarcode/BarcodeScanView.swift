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
        ZStack {
            CameraPreviewView(session: scannerCoordinator.session)
                .ignoresSafeArea()

            Color.black.opacity(0.28)
                .ignoresSafeArea()

            scannerOverlay

            if isLoading {
                loadingOverlay
            }

            if showFallback {
                fallbackBottomSheet
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .navigationBarHidden(true)
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
        .animation(.easeInOut(duration: 0.25), value: showFallback)
    }

    private var scannerOverlay: some View {
        VStack {
            HStack {
                Button {
                    scannerCoordinator.stop()
                    router.openTab(.home)
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(.black.opacity(0.4))
                        .clipShape(Circle())
                }

                Spacer()

                Button {
                    Task { await lookupBarcode() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(.black.opacity(0.4))
                        .clipShape(Circle())
                }
                .disabled(isLoading || barcodeInput.isEmpty)
            }
            .padding(.horizontal, 20)
            .padding(.top, 18)

            Spacer()

            ZStack {
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .stroke(Color.white.opacity(0.95), lineWidth: 2)
                    .frame(width: 280, height: 160)

                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .stroke(Color.green.opacity(0.95), style: StrokeStyle(lineWidth: 3, dash: [10, 8]))
                    .frame(width: 280, height: 160)
            }

            Text(scannerCoordinator.authorizationDenied ? "Camera access denied. Use product capture after a failed lookup path is available." : "Align barcode within the frame")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.white.opacity(0.95))
                .padding(.top, 18)

            Spacer()

            VStack(spacing: 10) {
                if !barcodeInput.isEmpty {
                    Text(barcodeInput)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.92))
                }

                Text("Known product → result page • Unknown product → capture flow")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.82))
            }
            .padding(.bottom, showFallback ? 280 : 36)
        }
    }

    private var loadingOverlay: some View {
        Color.black.opacity(0.45)
            .ignoresSafeArea()
            .overlay {
                VStack(spacing: 14) {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(1.3)
                    Text("Looking up product…")
                        .font(.headline)
                        .foregroundStyle(.white)
                }
                .padding(24)
                .background(.black.opacity(0.55))
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            }
    }

    private var fallbackBottomSheet: some View {
        VStack(alignment: .leading, spacing: 16) {
            Capsule()
                .fill(Color.secondary.opacity(0.35))
                .frame(width: 42, height: 5)
                .frame(maxWidth: .infinity)
                .padding(.top, 10)

            Text("Product Not Found")
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(Color.primary)

            Text(lookupError ?? "This barcode is not in the database yet. Continue into guided capture for a new product.")
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
                    Text("Continue to Capture")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.black)

            Button("Try another barcode") {
                showFallback = false
                lookupError = nil
            }
            .buttonStyle(.bordered)
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(Color(.systemBackground))
                .ignoresSafeArea(edges: .bottom)
        )
        .frame(maxHeight: .infinity, alignment: .bottom)
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

    private func lookupBarcode() async {
        let trimmed = barcodeInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        isLoading = true
        lookupError = nil
        showFallback = false
        defer { isLoading = false }

        if let product = try? await environment.productRepository.lookupProduct(barcode: trimmed) {
            scannerCoordinator.stop()
            router.path.append(AppRoute.productResult(product))
        } else {
            lookupError = "No existing product was found for this barcode."
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
