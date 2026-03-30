# Component Usage Notes

## Use reusable components where possible
- `ScoreBadgeView` for product/ingredient score display
- `ConfidenceBadgeView` for confidence labels
- `SectionCard` for grouped content
- `IngredientRowView` for ingredient lists
- `EvidenceStudyCardView` for evidence display
- `LoadingStateView` and `ErrorStateView` for async states
- `EmptyStateView` for blank states

## Why
This keeps feature views smaller and helps the eventual Xcode implementation stay maintainable.
