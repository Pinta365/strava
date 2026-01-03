/**
 * OAuth 2.0 scope definitions for Strava API
 */

/**
 * Available OAuth scopes
 */
export enum StravaScope {
    Read = "read",
    ReadAll = "read_all",
    ProfileReadAll = "profile:read_all",
    ProfileWrite = "profile:write",
    ActivityRead = "activity:read",
    ActivityReadAll = "activity:read_all",
    ActivityWrite = "activity:write",
}

/**
 * Scope descriptions
 */
export const SCOPE_DESCRIPTIONS: Record<StravaScope, string> = {
    [StravaScope.Read]: "Read public segments, public routes, public profile data, public posts, public events, club feeds, and leaderboards",
    [StravaScope.ReadAll]: "Read private routes, private segments, and private events for the user",
    [StravaScope.ProfileReadAll]: "Read all profile information even if the user has set their profile visibility to Followers or Only You",
    [StravaScope.ProfileWrite]:
        "Update the user's weight and Functional Threshold Power (FTP), and access to star or unstar segments on their behalf",
    [StravaScope.ActivityRead]:
        "Read the user's activity data for activities that are visible to Everyone and Followers, excluding privacy zone data",
    [StravaScope.ActivityReadAll]:
        "The same access as activity:read, plus privacy zone data and access to read the user's activities with visibility set to Only You",
    [StravaScope.ActivityWrite]:
        "Access to create manual activities and uploads, and access to edit any activities that are visible to the app, based on activity read access level",
};

/**
 * Parse scope string into array
 * @param scopeString - Comma-separated scope string
 * @returns Array of scope enums
 */
export function parseScopes(scopeString: string): StravaScope[] {
    return scopeString.split(",").map((s) => s.trim() as StravaScope).filter(Boolean);
}

/**
 * Format scopes array into string
 * @param scopes - Array of scope enums
 * @returns Comma-separated scope string
 */
export function formatScopes(scopes: StravaScope[]): string {
    return scopes.join(",");
}

/**
 * Check if a scope is included in the provided scopes
 * @param required - Required scope
 * @param available - Available scopes
 * @returns True if the required scope is available
 */
export function hasScope(required: StravaScope, available: StravaScope[]): boolean {
    return available.includes(required);
}

/**
 * Check if all required scopes are available
 * @param required - Required scopes
 * @param available - Available scopes
 * @returns True if all required scopes are available
 */
export function hasAllScopes(required: StravaScope[], available: StravaScope[]): boolean {
    return required.every((scope) => available.includes(scope));
}

/**
 * Validate scopes
 * @param scopes - Scopes to validate
 * @returns True if all scopes are valid
 */
export function validateScopes(scopes: StravaScope[]): boolean {
    const validScopes = Object.values(StravaScope);
    return scopes.every((scope) => validScopes.includes(scope));
}
