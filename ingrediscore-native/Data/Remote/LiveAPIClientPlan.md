# Live API Client Plan

## Responsibilities
- encode request DTOs
- issue HTTP requests
- decode response DTOs
- decode structured API error payloads
- surface domain-friendly app errors

## Required capabilities
- POST with JSON body
- GET with JSON decode
- error envelope parsing
- timeout handling
- request configuration via environment

## Future additions
- auth headers if accounts are added later
- request ID logging
- retry policy for retryable failures
