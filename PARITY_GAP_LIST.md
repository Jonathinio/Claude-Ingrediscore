# PARITY GAP LIST

## Source of truth for parity
- Reference UX/UI source: `reference/web-prototype/`
- Primary reference implementation: `reference/web-prototype/src/App.tsx`

## Current native parity assessment
The native iOS app now exists, builds, and launches, but it is still far behind the web prototype in visual polish and UX flow completeness.

## Major gaps

### 1. Home/dashboard experience
**Web prototype has:**
- branded mobile-first dashboard
- polished hero/header
- scan entry points with strong visual emphasis
- stats cards
- rotating food insight card
- “shared brain” explainer card
- system status area

**Native app currently has:**
- plain list-based menu with basic buttons
- no branded dashboard hierarchy
- no insight card
- no stats cards
- no visual scan call-to-action treatment

**Priority:** High

---

### 2. Search/library browsing experience
**Web prototype has:**
- searchable/filterable ingredient browser
- category chips
- sort controls
- richer ingredient cards

**Native app currently has:**
- no equivalent first-class search/browse screen on par with web
- much more utilitarian navigation

**Priority:** High

---

### 3. Product result page parity
**Web prototype has:**
- strong hero verdict area
- score + confidence presentation
- rich positive/concern sections
- ingredient breakdown cards with clear affordances
- much more layered information hierarchy

**Native app currently has:**
- basic section cards
- minimal hierarchy and styling
- functional, but visually much flatter

**Priority:** High

---

### 4. Ingredient detail page parity
**Web prototype has:**
- premium detail presentation
- stronger score visualization
- richer evidence framing
- more polished sectioning and spacing

**Native app currently has:**
- functional detail view
- much simpler presentation

**Priority:** Medium-High

---

### 5. Scan flow parity
**Web prototype has:**
- richer guided scan flow
- branded scanning states
- multi-step new-product capture UX
- more complete product-analysis flow after scan

**Native app currently has:**
- barcode text-field prototype
- ingredient scan flow scaffolded
- lacks camera-first polished scan UX parity

**Priority:** High

---

### 6. History / verified foods / leaderboard / settings parity
**Web prototype has:**
- multiple polished secondary surfaces and utility pages
- richer cards and interaction patterns

**Native app currently has:**
- basic scaffolds for history/settings
- missing or simplified secondary experiences

**Priority:** Medium

---

### 7. Visual system parity
**Web prototype has:**
- strong typography hierarchy
- soft card surfaces
- rounded premium UI language
- tighter spacing rhythm
- stronger score/status badge treatment

**Native app currently has:**
- minimal design system
- default SwiftUI visual feel in several places
- limited custom component polish

**Priority:** High

## Recommended restoration order
1. Home/dashboard parity
2. Product result page parity
3. Ingredient detail parity
4. Search/library parity
5. Scan flow parity improvements
6. Secondary pages polish (history/settings/etc.)

## Current active work block
- Restore home/dashboard structure and styling first so the app immediately feels closer to the original prototype.
