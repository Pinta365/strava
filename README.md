# @pinta365/strava

A cross-runtime TypeScript client for the Strava API v3. Works on Deno, Node.js (18+), Bun, and browsers.

## Features

- ✅ **Type-safe**: Full TypeScript support with generated types from Swagger specification
- ✅ **Cross-runtime**: Works on Deno, Node.js, Bun, and browsers
- ✅ **OAuth 2.0**: Complete authentication flow with automatic token refresh
- ✅ **Rate limiting**: Built-in rate limit handling and queue management
- ✅ **Request optimization**: Automatic request deduplication and retry logic
- ✅ **Opinionated helpers**: Key normalization (snake_case → camelCase), date transformations, response flattening, computed fields
- ✅ **Pagination**: Auto-pagination iterators for easy data fetching

## Installation

### Deno

```typescript
import { StravaClient } from "https://deno.land/x/strava/mod.ts";
```

### Node.js / Bun

```bash
npm install @pinta365/strava
```

```typescript
import { StravaClient } from "@pinta365/strava";
```

## Quick Start

### 1. Generate Types (First Time)

Before using the library, generate TypeScript types from the Strava API specification:

```bash
deno task generate:types
```

### 2. Create Client

```typescript
import { StravaClient } from "@pinta365/strava";

const client = new StravaClient({
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    redirectUri: "https://yourapp.com/callback",
});
```

### 3. Authenticate

```typescript
// Get authorization URL
const authUrl = client.getAuthorizationUrl({
    scope: ["activity:read_all", "profile:read_all"],
    state: "optional-csrf-token",
});

// Redirect user to authUrl
// After user authorizes, Strava redirects to your redirectUri with a code

// Exchange code for tokens
await client.authenticate({
    code: "authorization-code-from-redirect",
});
```

### 4. Use the API

```typescript
// Get authenticated athlete
const athlete = await client.athletes.get();

// Get activity by ID
const activity = await client.activities.getById(123456);

// Analyze activity with comprehensive data (zones, laps, best efforts, analysis)
const analysis = await client.activities.analyze(123456, {
    includeStreams: false, // Optional: include stream data
});

// Get athlete stats with recent activities and gear
const profile = await client.athletes.getStatsWithActivities(athleteId, {
    recentActivitiesLimit: 10,
    includeGear: true,
});

// List activities with auto-pagination
for await (const activity of client.activities.listAll()) {
    console.log(activity.name);
}

// Get activity with all details
const details = await client.activities.getWithDetails(123456);
// Returns: activity + laps + zones + comments + kudoers

// Get activity streams
const streams = await client.streams.getForActivity(123456, {
    types: ["time", "distance", "latlng", "altitude", "heartrate"],
});

// Clean up resources when done (important for long-running processes)
client.destroy();
```

## Configuration

### Client Options

```typescript
const client = new StravaClient({
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    redirectUri: "https://yourapp.com/callback",

    // Token storage (auto-detected by default)
    tokenStore: new FileSystemTokenStore("./tokens.json"),

    // HTTP options
    baseUrl: "https://www.strava.com/api/v3",
    timeout: 30000,

    // Retry configuration
    retries: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2,
    },

    // Rate limit strategy
    rateLimitStrategy: "queue", // 'queue' | 'throw' | 'wait'

    // Request deduplication
    deduplicationWindow: 5000, // milliseconds

    // Response transformations
    normalizeKeys: true, // Convert snake_case to camelCase (default: true)
    transformDates: true, // Convert ISO strings to Date objects (default: true)
    flattenResponses: true, // Flatten nested structures (default: true)
    addComputedFields: true, // Add computed properties (see below) (default: true)
});
```

### Token Storage

The library automatically selects an appropriate token store based on the runtime:

- **Browser**: `LocalStorageTokenStore`
- **Node.js/Deno**: `FileSystemTokenStore`
- **Other**: `MemoryTokenStore`

You can also provide a custom token store:

```typescript
import { TokenData, TokenStore } from "@pinta365/strava";

class CustomTokenStore implements TokenStore {
    async get(): Promise<TokenData | null> {
        // Load from your storage
    }

    async set(token: TokenData): Promise<void> {
        // Save to your storage
    }

    async clear(): Promise<void> {
        // Clear from your storage
    }
}

const client = new StravaClient({
    clientId: "...",
    clientSecret: "...",
    tokenStore: new CustomTokenStore(),
});
```

## Response Transformations

The library applies opinionated transformations to API responses by default. These can be controlled via client options:

### Key Normalization (`normalizeKeys`)

Converts snake_case keys from the API to camelCase for JavaScript/TypeScript conventions:

```typescript
// API returns: { start_date_local: "...", athlete_id: 123 }
// Library returns: { startDateLocal: "...", athleteId: 123 }
```

### Date Transformation (`transformDates`)

Converts ISO date strings to JavaScript `Date` objects:

```typescript
// API returns: { startDateLocal: "2024-01-15T10:30:00Z" }
// Library returns: { startDateLocal: Date("2024-01-15T10:30:00Z") }
```

### Response Flattening (`flattenResponses`)

Flattens nested objects to the top level for easier access:

```typescript
// API returns: { athlete: { id: 123, firstname: "John" } }
// Library returns: { athlete: { id: 123, firstname: "John" }, athleteId: 123, athleteFirstname: "John" }
```

### Computed Fields (`addComputedFields`)

Adds computed properties to activity objects for convenience:

#### For All Activities:

- **`averageSpeed`** (number, m/s): `distance / movingTime`
- **`averageSpeedKmh`** (number, km/h): `(distance / 1000) / (movingTime / 3600)`
- **`duration`** (object):
  - `seconds`: Raw time in seconds
  - `minutes`: `Math.floor(time / 60)`
  - `hours`: `Math.floor(time / 3600)`
  - `formatted`: Human-readable string (e.g., "1:23:45" or "23:45")

#### For Run Activities Only:

- **`pace`** (string): Formatted as "min:sec/km" (e.g., "5:30/km")

Example:

```typescript
const activity = await client.activities.getById(123456);

// Computed fields available:
console.log(activity.averageSpeed); // 3.5 (m/s)
console.log(activity.averageSpeedKmh); // 12.6 (km/h)
console.log(activity.pace); // "5:30/km" (if it's a Run)
console.log(activity.duration.formatted); // "1:23:45"
console.log(activity.duration.hours); // 1
```

## Cleanup

When you're done with the client (especially in long-running processes or scripts), call `destroy()` to clean up resources and allow the process to
exit:

```typescript
// After all API calls are complete
client.destroy();
```

This clears internal timers and caches, which is important for scripts that should exit automatically.

## Resources

The client provides resource namespaces for different API endpoints:

- `client.athletes` - Athlete information and stats
- `client.activities` - Activity CRUD and operations
- `client.segments` - Segment information and exploration
- `client.segmentEfforts` - Segment effort data
- `client.clubs` - Club information and members
- `client.gears` - Gear information
- `client.routes` - Route information and downloads
- `client.uploads` - Activity file uploads
- `client.streams` - Activity, segment, and route streams

### Opinionated Helpers

The library provides opinionated helper methods that combine multiple API calls for convenience:

#### Activity Analysis

Analyze an activity with comprehensive data including zones, laps, best efforts, and computed insights:

```typescript
const analysis = await client.activities.analyze(activityId, {
    includeStreams: false, // Optional: include stream data (may require premium)
    streamTypes: ["heartrate", "watts", "cadence"], // Optional: specific stream types
});

// Analysis includes:
// - Full activity details
// - Zones (power/heart rate)
// - Laps
// - Best efforts (segment efforts)
// - Optional streams
// - Computed analysis:
//   - hasPowerData: boolean
//   - hasHeartRateData: boolean
//   - totalLaps: number
//   - bestEffortCount: number
//   - averageLapTime: number (seconds)
//   - averageLapDistance: number (meters)
```

#### Activity Details

Get activity with all related data (laps, zones, comments, kudoers):

```typescript
const details = await client.activities.getWithDetails(activityId);
// Returns: activity + laps + zones + comments + kudoers
```

#### Athlete Profile with Stats

Get comprehensive athlete profile including stats, recent activities, and gear:

```typescript
const profile = await client.athletes.getStatsWithActivities(athleteId, {
    recentActivitiesLimit: 10, // Number of recent activities to fetch
    includeGear: true, // Include detailed gear information (bikes + shoes)
});

// Profile includes:
// - Full athlete details
// - Activity stats (totals, PRs, etc.)
// - Recent activities array
// - Gear details (optional)
```

## Error Handling

The library provides custom error classes:

```typescript
import { StravaAuthError, StravaError, StravaNotFoundError, StravaRateLimitError, StravaServerError, StravaValidationError } from "@pinta365/strava";

try {
    const activity = await client.activities.getById(123);
} catch (error) {
    if (error instanceof StravaNotFoundError) {
        console.log("Activity not found");
    } else if (error instanceof StravaRateLimitError) {
        console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    } else if (error instanceof StravaAuthError) {
        console.log("Authentication failed");
    }
}
```

## OAuth Scopes

Available scopes:

- `read` - Read public segments, public routes, public profile data, public posts, public events, club feeds, and leaderboards
- `read_all` - Read private routes, private segments, and private events for the user
- `profile:read_all` - Read all profile information even if the user has set their profile visibility to Followers or Only You
- `profile:write` - Update the user's weight and Functional Threshold Power (FTP), and access to star or unstar segments on their behalf
- `activity:read` - Read the user's activity data for activities that are visible to Everyone and Followers, excluding privacy zone data
- `activity:read_all` - The same access as `activity:read`, plus privacy zone data and access to read the user's activities with visibility set to
  Only You
- `activity:write` - Access to create manual activities and uploads, and access to edit any activities that are visible to the app, based on activity
  read access level

## Development

### Generate Types

```bash
deno task generate:types
```

### Run Tests

```bash
deno test -A
```

### Format and Lint

```bash
deno fmt
deno lint
```

### Pre-push Validation

```bash
deno task prepush
```

## License

MIT
