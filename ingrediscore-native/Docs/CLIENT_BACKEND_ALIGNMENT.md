# Client / Backend Alignment Notes

## Client expectations now encoded in scaffold
- endpoint constants exist
- request/response DTOs exist
- DTO mapper exists
- live repository shape exists

## What remains before real integration
- real APIClient implementation
- app environment switching between mock/live repositories
- auth strategy if needed later
- cache freshness policy implementation
- backend availability and deployment details

## Principle
The native app should depend on repository interfaces and DTO/domain mapping, not on backend storage details directly.
