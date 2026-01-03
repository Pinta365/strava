/**
 * Input validation helpers
 */

/**
 * Validate that a value is a positive integer
 * @param value - Value to validate
 * @param name - Name of the parameter for error messages
 * @returns Validated positive integer
 * @throws Error if value is not a positive integer
 */
export function validatePositiveInteger(value: unknown, name: string): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer, got: ${value}`);
    }
    return value;
}

/**
 * Validate that a value is a non-negative integer
 * @param value - Value to validate
 * @param name - Name of the parameter for error messages
 * @returns Validated non-negative integer
 * @throws Error if value is not a non-negative integer
 */
export function validateNonNegativeInteger(value: unknown, name: string): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw new Error(`${name} must be a non-negative integer, got: ${value}`);
    }
    return value;
}

/**
 * Validate that a value is within a range
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param name - Name of the parameter for error messages
 * @returns Validated value
 * @throws Error if value is outside the range
 */
export function validateRange(value: number, min: number, max: number, name: string): number {
    if (value < min || value > max) {
        throw new Error(`${name} must be between ${min} and ${max}, got: ${value}`);
    }
    return value;
}

/**
 * Validate that a value is a valid date
 * @param value - Value to validate
 * @param name - Name of the parameter for error messages
 * @returns Validated Date object
 * @throws Error if value is not a valid Date
 */
export function validateDate(value: unknown, name: string): Date {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
        throw new Error(`${name} must be a valid Date object`);
    }
    return value;
}

/**
 * Validate that a value is a non-empty string
 * @param value - Value to validate
 * @param name - Name of the parameter for error messages
 * @returns Validated non-empty string
 * @throws Error if value is not a non-empty string
 */
export function validateNonEmptyString(value: unknown, name: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${name} must be a non-empty string`);
    }
    return value;
}

/**
 * Validate pagination options
 * @param page - Page number (optional)
 * @param perPage - Items per page (optional, must be 1-200)
 * @throws Error if pagination options are invalid
 */
export function validatePagination(page?: number, perPage?: number): void {
    if (page !== undefined) {
        validatePositiveInteger(page, "page");
    }
    if (perPage !== undefined) {
        validateRange(perPage, 1, 200, "perPage");
    }
}
