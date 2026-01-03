/**
 * Custom error classes for Strava API interactions
 */

/**
 * Base error class for all Strava API errors
 */
export class StravaError extends Error {
    statusCode?: number;
    response?: unknown;

    constructor(message: string, statusCode?: number, response?: unknown) {
        super(message);
        this.name = "StravaError";
        this.statusCode = statusCode;
        this.response = response;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StravaError);
        }
    }
}

/**
 * Authentication-related errors (401, invalid credentials, token expired)
 */
export class StravaAuthError extends StravaError {
    constructor(message: string, statusCode?: number, response?: unknown) {
        super(message, statusCode, response);
        this.name = "StravaAuthError";
    }
}

/**
 * Rate limit errors (429)
 */
export class StravaRateLimitError extends StravaError {
    retryAfter?: number;
    limit?: number;
    usage?: number;

    constructor(
        message: string,
        statusCode?: number,
        response?: unknown,
        retryAfter?: number,
        limit?: number,
        usage?: number,
    ) {
        super(message, statusCode, response);
        this.name = "StravaRateLimitError";
        this.retryAfter = retryAfter;
        this.limit = limit;
        this.usage = usage;
    }
}

/**
 * Resource not found errors (404)
 */
export class StravaNotFoundError extends StravaError {
    constructor(message: string, statusCode?: number, response?: unknown) {
        super(message, statusCode, response);
        this.name = "StravaNotFoundError";
    }
}

/**
 * Validation errors (422)
 */
export class StravaValidationError extends StravaError {
    errors?: Array<{ field: string; message: string }>;

    constructor(
        message: string,
        statusCode?: number,
        response?: unknown,
        errors?: Array<{ field: string; message: string }>,
    ) {
        super(message, statusCode, response);
        this.name = "StravaValidationError";
        this.errors = errors;
    }
}

/**
 * Server errors (5xx)
 */
export class StravaServerError extends StravaError {
    constructor(message: string, statusCode?: number, response?: unknown) {
        super(message, statusCode, response);
        this.name = "StravaServerError";
    }
}
