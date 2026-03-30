import SwiftUI

struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                Text("About IngrediScore")
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.primary)

                aboutSection(
                    title: "Our Mission",
                    body: "IngrediScore is a community-powered platform for clear, evidence-based food ingredient information. The goal is to make health transparency easier to understand without hiding behind jargon."
                )

                aboutSection(
                    title: "The Shared Brain",
                    body: "Every scan and ingredient review helps grow a shared knowledge base. Once something is researched, that knowledge can benefit everyone instead of staying trapped in one person’s notes."
                )

                aboutSection(
                    title: "Study Relevance & Scope",
                    body: "Not every study uses the ingredient name in the title. Sometimes evidence comes from the active chemical component, the biological pathway, or a directly relevant chemical class. The app tries to surface the best practical explanation instead of pretending evidence is simpler than it is."
                )

                VStack(alignment: .leading, spacing: 12) {
                    Text("Founder Note")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .textCase(.uppercase)
                        .tracking(2)
                        .foregroundStyle(.secondary)

                    Text("\"Our commitment is simple: provide high-quality health data without making clarity feel like a luxury.\"")
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundStyle(Color.primary)
                        .italic()
                        .padding(20)
                        .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Color(.secondarySystemBackground)))
                }
            }
            .padding(20)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func aboutSection(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(Color.primary)

            Text(body)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
