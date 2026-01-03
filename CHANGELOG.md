# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Additional JSDoc/TSDoc documentation for TokenStore interface and implementations
- Parameter and return type documentation for OAuthManager methods
- Property descriptions for ClientOptions and AuthCredentials interfaces
- Documentation for StravaClient resource getters and methods
- Constructor and method documentation for PaginatedIterator class
- Installation instructions for multiple package managers (Deno via JSR, Node.js via npm/JSR/pnpm, Bun via JSR/npm)

## [0.0.2] - 2026-01-03

### Added

- Comprehensive JSDoc/TSDoc documentation for all exported symbols
- Parameter and return type documentation for utility functions
- Property descriptions for interfaces and types
- Enhanced documentation coverage to meet JSR publishing requirements

## [0.0.1] - 2026-01-03

### Added

- Initial implementation of Strava API v3 client
- OAuth 2.0 authentication flow with automatic token refresh
- Resource classes for all Strava API endpoints:
  - Athletes (get, getStats, update, getStatsWithActivities)
  - Activities (getById, list, create, update, delete, getWithDetails, analyze)
  - Segments (getById, explore, star/unstar)
  - Segment Efforts (getById, list)
  - Clubs (getById, list, getMembers, getActivities, getAdmins)
  - Gears (getById)
  - Routes (getById, list, downloadAsGPX, downloadAsTCX)
  - Uploads (create, getById)
  - Streams (getForActivity, getForSegmentEffort, getForSegment, getForRoute)
- HTTP layer with:
  - Rate limit tracking and queue management
  - Request retry logic with exponential backoff
  - Request deduplication
  - Automatic error mapping
- Token storage implementations:
  - MemoryTokenStore (default)
  - LocalStorageTokenStore (browser)
  - FileSystemTokenStore (Node.js/Deno)
- Opinionated response transformations:
  - Date string to Date object conversion
  - Response flattening
  - Computed fields (pace, duration, average speed)
- Pagination helpers with auto-pagination iterators
- Build-time type generation from Strava Swagger specification
- Cross-runtime support (Deno, Node.js 18+, Bun, browsers)
- Comprehensive error classes
- Unit tests for core functionality
- Build-time type generation from `https://developers.strava.com/swagger/swagger.json` with automatic external `$ref` resolution
- Opinionated helper methods:
  - `activities.analyze()` - Comprehensive activity analysis with zones, laps, best efforts, and computed insights
  - `athletes.getStatsWithActivities()` - Athlete profile with stats, recent activities, and gear

[Unreleased]: https://github.com/Pinta365/strava/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/Pinta365/strava/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Pinta365/strava/releases/tag/v0.0.1
