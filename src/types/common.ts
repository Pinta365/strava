/**
 * Common types and interfaces for the Strava client
 */

/**
 * Retry configuration for failed requests
 */
export interface RetryConfig {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Initial delay in milliseconds (default: 1000) */
    initialDelay?: number;
    /** Maximum delay in milliseconds (default: 10000) */
    maxDelay?: number;
    /** Exponential backoff factor (default: 2) */
    backoffFactor?: number;
    /** HTTP status codes that should trigger retry (default: [429, 500, 502, 503, 504]) */
    retryableStatusCodes?: number[];
}

/**
 * Rate limit strategy for handling rate limit errors
 * - "queue": Queue requests and process when rate limit resets
 * - "throw": Immediately throw error when rate limit is hit
 * - "wait": Wait until rate limit resets before making request
 */
export type RateLimitStrategy = "queue" | "throw" | "wait";

/**
 * HTTP request configuration
 */
export interface RequestConfig {
    /** HTTP method */
    method: string;
    /** API path (without base URL) */
    path: string;
    /** Query parameters */
    query?: Record<string, string | number | boolean | undefined>;
    /** Request headers */
    headers?: Record<string, string>;
    /** Request body */
    body?: unknown;
    /** Request timeout in milliseconds */
    timeout?: number;
}

/**
 * Pagination options for list endpoints
 */
export interface PaginationOptions {
    /** Page number (default: 1) */
    page?: number;
    /** Number of items per page (default: 30, max: 200) */
    perPage?: number;
}

/**
 * Rate limit information from response headers
 */
export interface RateLimitInfo {
    /** Short-term rate limit (15-minute window) */
    shortTermLimit?: number;
    /** Short-term usage count */
    shortTermUsage?: number;
    /** Daily rate limit */
    dailyLimit?: number;
    /** Daily usage count */
    dailyUsage?: number;
}
