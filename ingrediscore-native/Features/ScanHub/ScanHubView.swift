import SwiftUI

struct ScanHubView: View {
    @EnvironmentObject private var router: AppRouter

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Scan")
                    .font(.system(size: 30, weight: .bold, design: .rounded))

                Text("Choose how you want to start an analysis.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                VStack(spacing: 12) {
                    scanCard(
                        title: "Scan Barcode",
                        subtitle: "Use a product barcode to retrieve a saved analysis when available.",
                        systemImage: "barcode.viewfinder"
                    ) {
                        router.path.append(AppRoute.barcodeScan)
                    }

                    scanCard(
                        title: "Scan Ingredient Label",
                        subtitle: "Analyze ingredient text when barcode lookup is not the right path.",
                        systemImage: "camera.viewfinder"
                    ) {
                        router.path.append(AppRoute.ingredientScan)
                    }
                }
            }
            .padding(20)
        }
        .background(Color(.systemGroupedBackground))
    }

    private func scanCard(title: String, subtitle: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 16) {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color(.secondarySystemBackground))
                    .frame(width: 56, height: 56)
                    .overlay(Image(systemName: systemImage).font(.system(size: 22, weight: .semibold)))

                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.primary)
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(.tertiary)
            }
            .padding(20)
            .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Color(.systemBackground)))
            .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous).stroke(Color.black.opacity(0.05), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}
