# Live Repository Plan

## ProductRepository live responsibilities
- check cache first for recent barcode hits
- call `/v1/products/lookup-barcode`
- map DTO to domain
- save successful results locally

## AnalysisRepository live responsibilities
- call `/v1/analysis/ingredients-text`
- map analysis DTOs to domain
- fetch ingredient detail from `/v1/ingredients/{id}`

## Error mapping
Remote failures should map into user-meaningful app errors:
- timeout -> networkFailure
- empty OCR analysis -> ocrFailed
- missing product -> barcodeNotFound

## Cache strategy
- write-through on successful remote response
- stale cached values can be shown immediately and refreshed in background later
