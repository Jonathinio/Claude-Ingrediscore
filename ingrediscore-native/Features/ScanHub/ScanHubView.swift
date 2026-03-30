import SwiftUI

struct ScanHubView: View {
    @EnvironmentObject private var router: AppRouter
    @State private var productName = ""
    @State private var brandName = ""
    @State private var ingredientsText = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                heroSection
                captureModesSection
                manualEntrySection
                flowExplanationSection
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 32)
        }
        .background(Color(.systemGroupedBackground))
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Scan")
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(Color.primary)

            Text("Choose the fastest path to a trustworthy product analysis.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack(spacing: 10) {
                statusPill(title: "Barcode Lookup", tint: .green, systemImage: "barcode.viewfinder")
                statusPill(title: "AI Analysis", tint: .orange, systemImage: "sparkles")
            }
        }
    }

    private var captureModesSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionTitle("Capture Modes")

            VStack(spacing: 12) {
                scanModeCard(
                    title: "Scan Barcode",
                    subtitle: "Best for products already in the database. Fastest route to an existing analysis.",
                    systemImage: "barcode.viewfinder",
                    tint: .green,
                    footer: "Flow: barcode → Firestore lookup → product result"
                ) {
                    router.path.append(AppRoute.barcodeScan)
                }

                scanModeCard(
                    title: "Capture Ingredient Label",
                    subtitle: "Use this when the barcode does not exist or when you need a fresh ingredient-based analysis.",
                    systemImage: "camera.viewfinder",
                    tint: .orange,
                    footer: "Flow: image/text capture → AI analysis → product result"
                ) {
                    router.path.append(AppRoute.ingredientScan)
                }
            }
        }
    }

    private var manualEntrySection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionTitle("Manual Entry")

            VStack(alignment: .leading, spacing: 14) {
                Group {
                    TextField("Product name", text: $productName)
                    TextField("Brand", text: $brandName)
                }
                .textFieldStyle(.roundedBorder)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Ingredient list")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(1.5)
                        .foregroundStyle(.secondary)

                    TextEditor(text: $ingredientsText)
                        .frame(minHeight: 140)
                        .padding(8)
                        .background(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(Color(.systemBackground))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(Color.black.opacity(0.06), lineWidth: 1)
                        )
                }

                Button {
                    router.path.append(AppRoute.ingredientScan)
                } label: {
                    HStack {
                        Image(systemName: "sparkles")
                        Text("Analyze Manual Entry")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.black)
                .disabled(ingredientsText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                Text("Current behavior: this routes into the ingredient-analysis path. The dedicated native OCR/manual re-analysis flow still needs deeper rebuild work.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
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

    private var flowExplanationSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionTitle("How It Works")

            VStack(alignment: .leading, spacing: 12) {
                flowStep(number: 1, title: "Try barcode first", body: "If the product already exists in the shared database, this is the fastest route to a full result page.")
                flowStep(number: 2, title: "Fall back to ingredient analysis", body: "If barcode lookup fails, the app should support label capture or manual ingredient entry for AI-backed scoring.")
                flowStep(number: 3, title: "Review the analysis", body: "A product page combines weighted ingredient scoring, processing interpretation, and AI-generated explanation.")
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

    private func sectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .textCase(.uppercase)
            .tracking(2)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 4)
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

    private func scanModeCard(title: String, subtitle: String, systemImage: String, tint: Color, footer: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 14) {
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(tint.opacity(0.14))
                        .frame(width: 56, height: 56)
                        .overlay(
                            Image(systemName: systemImage)
                                .font(.system(size: 22, weight: .semibold))
                                .foregroundStyle(tint)
                        )

                    VStack(alignment: .leading, spacing: 6) {
                        Text(title)
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.primary)
                        Text(subtitle)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                    }

                    Spacer(minLength: 12)

                    Image(systemName: "chevron.right")
                        .foregroundStyle(.tertiary)
                }

                Text(footer)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(Color(.systemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(Color.black.opacity(0.05), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func flowStep(number: Int, title: String, body: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color(.secondarySystemBackground))
                    .frame(width: 32, height: 32)
                Text("\(number)")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.primary)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.primary)
                Text(body)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}
