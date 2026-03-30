# Environment Switching Plan

## Goal
Allow the app to run in:
- mock mode during scaffold/testing
- live mode when backend is available

## Suggested approach
AppEnvironment.bootstrap() should later decide between:
- mock repositories
- live repositories

based on configuration such as:
- build configuration
- debug flag
- environment file

## Why
This makes early UI work possible before backend availability, while keeping live integration straightforward later.
