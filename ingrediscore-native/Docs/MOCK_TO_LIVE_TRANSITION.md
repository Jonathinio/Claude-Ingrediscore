# Mock to Live Transition

## Current scaffold behavior
The app boots in `mock` mode by default through `AppConfiguration.current()`.

## Live transition path
To move toward live mode later:
1. set `AppConfiguration` to `.live`
2. provide a real API base URL
3. ensure backend endpoints match the defined contracts
4. verify `LiveProductRepository` and `LiveAnalysisRepository` against deployed APIs
5. add persistent cache implementation

## Safety fallback
If live mode is selected without a valid base URL, the scaffold should gracefully fall back to mock mode rather than fail at launch.
