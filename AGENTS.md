# Agents quick checklist

This document provides guidelines for AI agents and contributors working on @pinta365/strava.

## Project Structure

- **`mod.ts`**: Main entry point, re-exports all public APIs
- **`src/`**: Source code directory (to be organized as the library develops)
- **`test/`**: Test files using `@cross/test` for cross-runtime testing
- **`local_test/`**: Local testing scripts (gitignored, for development)
- **`swagger.json`**: Strava API v3 OpenAPI/Swagger specification
- **`scripts/build_npm.ts`**: Build script for npm package generation

## Development

### Running Locally

```bash
deno task dev
```

### Pre-push Validation

Run: `deno task prepush`

This runs:

- `deno fmt --check` - Format check
- `deno lint` - Linter
- `deno check mod.ts` - Type checking
- `deno test -A` - Run all tests

**Note**: `deno check` may show type resolution errors for transitive npm dependencies. This is a known Deno limitation and doesn't affect runtime
functionality.

### Testing

```bash
deno test -A
```

Tests use `@cross/test` for cross-runtime compatibility (Deno, Bun, Node.js, browsers).

### Local Testing

For manual testing and experimentation, use files in `local_test/`:

- Create test scripts as needed for API interaction testing

These files are gitignored and can be modified freely for development.

## Guidelines

### Code Style

- **TypeScript strict mode** - ensure proper typing
- **4-space indentation**, 150 character line width (see `deno.json`)
- **Runtime-agnostic** - code must work on Deno, Node.js (18+), Bun, and browsers

### Key Conventions

- **API Client**: Build a type-safe client for the Strava API v3 based on `swagger.json`
- **OAuth 2.0**: Implement OAuth 2.0 authentication flow for Strava API access
- **Testing**: Use `@cross/test` for all tests to ensure cross-runtime compatibility
- **Error Handling**: Provide clear, actionable error messages with context
- **Type Safety**: Generate or maintain TypeScript types from the Swagger specification

### Important Notes

- **API Version**: This library targets Strava API v3
- **Authentication**: OAuth 2.0 is required for all API requests. Support both authorization code flow and refresh token flow
- **Rate Limiting**: Strava API has rate limits. Implement proper rate limit handling and respect rate limit headers
- **Scopes**: Different API endpoints require different OAuth scopes. Document required scopes for each endpoint
- **Swagger Spec**: The `swagger.json` file contains the complete API specification - use it as the source of truth for endpoints, parameters, and
  response types

### File Organization

- **Source code**: `src/` directory
- **Tests**: `test/` directory (use `@cross/test`)
- **Local testing**: `local_test/` (gitignored, for development)
- **API Specification**: `swagger.json` contains the Strava API v3 OpenAPI/Swagger spec
- **Documentation**: `README.md` for user-facing documentation
- **Changelog**: `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format

### Dependencies

- **@cross/test**: Cross-runtime testing framework (via JSR)
- **@std/assert**: Assertion library (via JSR)

### Testing Guidelines

- All tests should use `@cross/test` for cross-runtime compatibility
- Tests should be in `test/` directory with `.test.ts` suffix
- Test files should be named to match their source files (e.g., `test/client.test.ts` for `src/client.ts`)
- Use descriptive test names that explain what is being tested
- For local experimentation, use `local_test/` directory (gitignored)
- Mock API responses when possible to avoid requiring real API credentials for unit tests

### API Design

- **Client Class**: Provide a main client class for interacting with the Strava API (e.g., `StravaClient`)
- **Type Safety**: Generate TypeScript types from the Swagger specification where possible
- **Options Objects**: Use optional options objects for configuration (e.g., `ClientOptions`, `RequestOptions`)
- **Authentication**: Handle OAuth 2.0 token management, refresh, and storage
- **Error Handling**: Map HTTP errors to meaningful TypeScript error types
- **Pagination**: Provide helpers for paginated endpoints

### Changelog Maintenance

- **CHANGELOG.md**: Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format
- Update the `[Unreleased]` section with changes as they are made
- When releasing a new version:
  1. Move `[Unreleased]` changes to a new version section with date
  2. Add version comparison links at the bottom
  3. Update the `[Unreleased]` link to compare from the new version
- Use standard categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`

### Future Work

- **Type Generation**: Consider generating TypeScript types from `swagger.json` automatically
- **Request/Response Interceptors**: Support for request/response interceptors for logging, retries, etc.
- **Webhook Support**: Support for Strava webhook subscriptions
- Keep this file updated as the project evolves
- Maintain backward compatibility for user-facing features
