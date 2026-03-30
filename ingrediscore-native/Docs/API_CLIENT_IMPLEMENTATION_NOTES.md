# API Client Implementation Notes

## Current state
The scaffold now includes a realer APIClient shape with:
- base URL
- GET/POST methods
- JSON encode/decode
- error envelope decoding
- timeout handling

## What remains later
- auth header injection if needed
- request ID / observability hooks
- retry policy for retryable failures
- environment-specific URL selection
- unit tests for error mapping and decoding
