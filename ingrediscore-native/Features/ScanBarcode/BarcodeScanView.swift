import SwiftUI

struct BarcodeScanView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var barcodeInput = ""
    @State private var isLoading = false
    @State private var lookupError: String?
    @State private var showFallback = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                heroSection
                scannerPrototypeSection

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
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Scan Product")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(Color.primary)

            Text("This should open directly into barcode scanning. Until the native camera scanner lands, use the prototype lookup below.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack(spacing: 10) {
                statusPill(title: "Barcode First", tint: .green, systemImage: "barcode.viewfinder")
                statusPill(title: "Fallback Capture", tint: .orange, systemImage: "camera")
            }
        }
    }

    private var scannerPrototypeSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Barcode Lookup")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            VStack(alignment: .leading, spacing: 14) {
                Text("Enter a barcode to simulate the camera-based lookup flow.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

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

    private var fallbackSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Product Not Found")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .textCase(.uppercase)
                .tracking(2)
                .foregroundStyle(.secondary)
                .padding(.horizontal, 4)

            VStack(alignment: .leading, spacing: 14) {
                Text("If the product is missing from the database, the next step should be guided product capture — not a dead end.")
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
            router.path.append(AppRoute.productResult(product))
        } else {
            lookupError = "No existing product was found for this barcode. The next step is guided new-product capture."
            showFallback = true
        }
    }
}
