/**
 * Retry logic with exponential backoff
 */

import type { RetryConfig } from "../types/common.ts";

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableStatusCodes: [429, 500, 502, 503, 504],
};

/**
 * Calculate delay for retry attempt
 */
function calculateDelay(attempt: number, config: Required<RetryConfig>, retryAfter?: number): number {
    if (retryAfter !== undefined) {
        return Math.min(retryAfter * 1000, config.maxDelay);
    }

    const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error/status code is retryable
 */
function isRetryable(statusCode: number | undefined, config: Required<RetryConfig>): boolean {
    if (statusCode === undefined) {
        return true;
    }
    return config.retryableStatusCodes.includes(statusCode);
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config?: RetryConfig,
    getRetryAfter?: (error: unknown) => number | undefined,
): Promise<T> {
    const retryConfig: Required<RetryConfig> = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: unknown;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt >= retryConfig.maxAttempts) {
                break;
            }

            const statusCode = error && typeof error === "object" && "statusCode" in error ? error.statusCode as number : undefined;

            if (!isRetryable(statusCode, retryConfig)) {
                throw error;
            }

            const retryAfter = getRetryAfter ? getRetryAfter(error) : undefined;
            const delay = calculateDelay(attempt, retryConfig, retryAfter);
            await sleep(delay);
        }
    }

    throw lastError;
}
