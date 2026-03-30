import SwiftUI

struct BarcodeScanView: View {
    @EnvironmentObject private var router: AppRouter
    @Environment(\.appEnvironment) private var environment
    @State private var barcodeInput = "012345678905"
    @State private var isLoading = false

    var body: some View {
        Form {
            Section("Barcode Scan Prototype") {
                Text("Native AVFoundation scanner will replace this text-field prototype in the buildable Xcode project.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

                TextField("Barcode", text: $barcodeInput)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                Button(isLoading ? "Looking up..." : "Lookup Product") {
                    Task {
                        isLoading = true
                        defer { isLoading = false }

                        if let product = try? await environment.productRepository.lookupProduct(barcode: barcodeInput) {
                            router.path.append(AppRoute.productResult(product))
                        }
                    }
                }
                .disabled(isLoading || barcodeInput.isEmpty)
            }
        }
        .navigationTitle("Scan Barcode")
    }
}
