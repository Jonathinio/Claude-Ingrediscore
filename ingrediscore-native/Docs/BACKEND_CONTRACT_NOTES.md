# Backend Contract Notes

## App expectation
The native client should eventually talk to a backend service layer, not directly own full scientific logic.

## Required contracts
- barcode lookup
- ingredient text analysis
- ingredient detail fetch
- future product re-analysis

## Contract principles
- deterministic JSON responses
- versioned scoring payloads
- confidence surfaced explicitly
- ingredient trees supported for compound ingredients
- room for partial results if backend later supports staged loading
