/**
 * Core HTTP request handler
 */

import { StravaAuthError, StravaError, StravaNotFoundError, StravaRateLimitError, StravaServerError, StravaValidationError } from "../errors.ts";
import type { RateLimiter } from "./rate-limiter.ts";
import type { RequestDeduplicator } from "./deduplication.ts";
import { withRetry } from "./retry.ts";
import { applyTransformations } from "../utils/transformers.ts";
import type { RateLimitInfo, RequestConfig, RetryConfig } from "../types/common.ts";

const DEFAULT_BASE_URL = "https://www.strava.com/api/v3";
const DEFAULT_TIMEOUT = 30000;

interface RequestOptions {
    baseUrl?: string;
    timeout?: number;
    accessToken?: string;
    rateLimiter?: RateLimiter;
    deduplicator?: RequestDeduplicator;
    retryConfig?: RetryConfig;
    normalizeKeys?: boolean;
    transformDates?: boolean;
    flattenResponses?: boolean;
    addComputedFields?: boolean;
}

/**
 * Extract rate limit info from response headers
 */
function extractRateLimitInfo(headers: Headers): RateLimitInfo {
    const shortTermLimit = headers.get("X-RateLimit-Limit");
    const shortTermUsage = headers.get("X-RateLimit-Usage");
    const dailyLimit = headers.get("X-RateLimit-Limit-Daily");
    const dailyUsage = headers.get("X-RateLimit-Usage-Daily");

    const info: RateLimitInfo = {};

    if (shortTermLimit) {
        info.shortTermLimit = parseInt(shortTermLimit, 10);
    }
    if (shortTermUsage) {
        const parts = shortTermUsage.split(",");
        if (parts.length >= 1) {
            info.shortTermUsage = parseInt(parts[0], 10);
        }
    }

    if (dailyLimit) {
        info.dailyLimit = parseInt(dailyLimit, 10);
    }
    if (dailyUsage) {
        const parts = dailyUsage.split(",");
        if (parts.length >= 1) {
            info.dailyUsage = parseInt(parts[0], 10);
        }
    }

    return info;
}

/**
 * Build query string from query parameters
 */
function buildQueryString(query?: Record<string, string | number | boolean | undefined>): string {
    if (!query) return "";

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
}

/**
 * Create error from response
 */
async function createErrorFromResponse(response: Response): Promise<StravaError> {
    const statusCode = response.status;
    let errorData: unknown;

    try {
        errorData = await response.json();
    } catch {
        errorData = await response.text().catch(() => undefined);
    }

    const message = typeof errorData === "object" && errorData !== null && "message" in errorData
        ? String(errorData.message)
        : `HTTP ${statusCode}: ${response.statusText}`;

    const rateLimitInfo = extractRateLimitInfo(response.headers);
    const retryAfter = response.headers.get("Retry-After");

    switch (statusCode) {
        case 401:
        case 403:
            return new StravaAuthError(message, statusCode, errorData);
        case 404:
            return new StravaNotFoundError(message, statusCode, errorData);
        case 422: {
            const errors = typeof errorData === "object" && errorData !== null && "errors" in errorData
                ? errorData.errors as Array<{ field: string; message: string }>
                : undefined;
            return new StravaValidationError(message, statusCode, errorData, errors);
        }
        case 429:
            return new StravaRateLimitError(
                message,
                statusCode,
                errorData,
                retryAfter ? parseInt(retryAfter, 10) : undefined,
                rateLimitInfo.shortTermLimit,
                rateLimitInfo.shortTermUsage,
            );
        case 500:
        case 502:
        case 503:
        case 504:
            return new StravaServerError(message, statusCode, errorData);
        default:
            return new StravaError(message, statusCode, errorData);
    }
}

/**
 * Make HTTP request with retry, rate limiting, and error handling
 */
export function request<T>(config: RequestConfig, options: RequestOptions = {}): Promise<T> {
    const {
        baseUrl = DEFAULT_BASE_URL,
        timeout = DEFAULT_TIMEOUT,
        accessToken,
        rateLimiter,
        deduplicator,
        retryConfig,
        normalizeKeys = true,
        transformDates = false,
        flattenResponses = false,
        addComputedFields = false,
    } = options;

    const queryString = buildQueryString(config.query);
    const url = `${baseUrl}${config.path}${queryString}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...config.headers,
    };

    if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const makeRequest = async (): Promise<T> => {
        if (rateLimiter) {
            await rateLimiter.waitForAvailability();
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                method: config.method,
                headers,
                body: config.body ? JSON.stringify(config.body) : undefined,
                signal: controller.signal,
            });

            if (rateLimiter) {
                rateLimiter.updateFromHeaders(response.headers);
                rateLimiter.processQueue();
            }

            if (!response.ok) {
                throw await createErrorFromResponse(response);
            }

            const rawData = await response.json();

            const transformedData = applyTransformations(
                rawData,
                normalizeKeys,
                transformDates,
                flattenResponses,
                addComputedFields,
            );

            return transformedData as T;
        } catch (error) {
            if (error instanceof StravaError) {
                throw error;
            }

            if (error instanceof Error && error.name === "AbortError") {
                throw new StravaError(`Request timeout after ${timeout}ms`, undefined, error);
            }

            throw new StravaError(
                error instanceof Error ? error.message : "Unknown error",
                undefined,
                error,
            );
        } finally {
            clearTimeout(timeoutId);
        }
    };

    if (deduplicator) {
        return deduplicator.getOrCreate(
            config.method,
            config.path,
            config.query,
            config.body,
            () =>
                withRetry(makeRequest, retryConfig, (error) => {
                    if (error instanceof StravaRateLimitError && error.retryAfter) {
                        return error.retryAfter;
                    }
                    return undefined;
                }),
        );
    }

    return withRetry(makeRequest, retryConfig, (error) => {
        if (error instanceof StravaRateLimitError && error.retryAfter) {
            return error.retryAfter;
        }
        return undefined;
    });
}
