/**
 * @pinta365/strava - TypeScript client for Strava API v3
 *
 * A cross-runtime (Deno, Node.js, Bun, Browser) library for interacting with the Strava API.
 */

// Main client
export { StravaClient } from "./src/client.ts";
export type { AuthCredentials, ClientOptions } from "./src/client.ts";

// Error classes
export { StravaAuthError, StravaError, StravaNotFoundError, StravaRateLimitError, StravaServerError, StravaValidationError } from "./src/errors.ts";

// Auth
export { exchangeCode, getAuthorizationUrl, OAuthManager, refreshAccessToken } from "./src/auth/oauth.ts";
export { formatScopes, hasAllScopes, hasScope, parseScopes, StravaScope, validateScopes } from "./src/auth/scopes.ts";
export type { TokenData, TokenStore } from "./src/auth/token-store.ts";
export { FileSystemTokenStore, getDefaultTokenStore, LocalStorageTokenStore, MemoryTokenStore } from "./src/auth/token-store.ts";

// Types
export type { PaginationOptions, RateLimitInfo, RateLimitStrategy, RequestConfig, RetryConfig } from "./src/types/common.ts";

// API Types (generated from Swagger)
export type {
    // Activities
    Activity,
    ActivityStats,
    // Common
    ActivityTotal,
    ActivityType,
    ActivityZone,
    // Athletes
    Athlete,
    // Clubs
    Club,
    Comment,
    DetailedActivity,
    DetailedAthlete,
    DetailedClub,
    DetailedGear,
    DetailedSegment,
    DetailedSegmentEffort,
    ExplorerResponse,
    ExplorerSegment,
    // Gears
    Gear,
    Lap,
    LatLng,
    PhotosSummary,
    PolylineMap,
    // Routes
    Route,
    // Segments
    Segment,
    // Segment Efforts
    SegmentEffort,
    Split,
    SportType,
    // Streams
    StreamSet,
    SummaryActivity,
    SummaryAthlete,
    SummaryClub,
    SummaryGear,
    SummaryPRSegmentEffort,
    SummarySegment,
    SummarySegmentEffort,
    UpdatableActivity,
    // Uploads
    Upload,
    Waypoint,
    Zones,
} from "./src/types/api.ts";

// Resources (for advanced usage)
export { AthletesResource } from "./src/resources/athletes.ts";
export { ActivitiesResource } from "./src/resources/activities.ts";
export { SegmentsResource } from "./src/resources/segments.ts";
export { SegmentEffortsResource } from "./src/resources/segment-efforts.ts";
export { ClubsResource } from "./src/resources/clubs.ts";
export { GearsResource } from "./src/resources/gears.ts";
export { RoutesResource } from "./src/resources/routes.ts";
export { UploadsResource } from "./src/resources/uploads.ts";
export { StreamsResource } from "./src/resources/streams.ts";

// Utilities
export { buildPaginationQuery, listAll, PaginatedIterator } from "./src/utils/pagination.ts";
export { addComputedFields, applyTransformations, flattenResponses, transformDates } from "./src/utils/transformers.ts";
export {
    validateDate,
    validateNonEmptyString,
    validateNonNegativeInteger,
    validatePagination,
    validatePositiveInteger,
    validateRange,
} from "./src/utils/validators.ts";
