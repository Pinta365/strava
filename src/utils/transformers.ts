/**
 * Response transformers for opinionated data transformations
 */

/**
 * Convert snake_case keys to camelCase
 * @param data - Data to normalize
 * @returns Data with camelCase keys
 */
export function normalizeKeys<T>(data: T): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Date) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(normalizeKeys) as T;
    }

    if (typeof data === "object") {
        const normalized = {} as Record<string, unknown>;

        for (const [key, value] of Object.entries(data)) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            normalized[camelKey] = normalizeKeys(value);
        }

        return normalized as T;
    }

    return data;
}

/**
 * Transform ISO date strings to Date objects
 * @param data - Data to transform
 * @returns Data with Date objects instead of ISO strings
 */
export function transformDates<T>(data: T): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Date) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(transformDates) as T;
    }

    if (typeof data === "object") {
        const transformed = {} as Record<string, unknown>;

        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            const isDateField = /_(at|date|time)$/i.test(key) ||
                /[dD]ate/.test(key) ||
                /[tT]ime/.test(key) ||
                lowerKey.includes("date") ||
                lowerKey.includes("time");

            if (isDateField && typeof value === "string") {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    transformed[key] = date;
                    continue;
                }
            }

            transformed[key] = transformDates(value);
        }

        return transformed as T;
    }

    return data;
}

/**
 * Flatten nested response structures
 * @param data - Data to flatten
 * @returns Flattened data structure
 */
export function flattenResponses<T>(data: T): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Date) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(flattenResponses) as T;
    }

    if (typeof data === "object") {
        const flattened = {} as Record<string, unknown>;

        for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                if ("id" in value || "firstname" in value || "name" in value) {
                    for (const [nestedKey, nestedValue] of Object.entries(value)) {
                        const flattenedKey = `${key}${nestedKey.charAt(0).toUpperCase() + nestedKey.slice(1)}`;
                        flattened[flattenedKey] = nestedValue;
                    }
                    flattened[key] = value;
                } else {
                    flattened[key] = flattenResponses(value);
                }
            } else {
                flattened[key] = flattenResponses(value);
            }
        }

        return flattened as T;
    }

    return data;
}

/**
 * Add computed fields
 */
export function addComputedFields<T>(data: T): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Date) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(addComputedFields) as T;
    }

    if (typeof data === "object") {
        const enhanced = { ...data } as Record<string, unknown>;
        const dataRecord = data as Record<string, unknown>;
        if ("distance" in dataRecord && ("movingTime" in dataRecord || "elapsedTime" in dataRecord)) {
            const distance = dataRecord.distance as number;
            const movingTime = (dataRecord.movingTime as number) || (dataRecord.elapsedTime as number);

            if (movingTime > 0) {
                enhanced.averageSpeed = distance / movingTime;
                enhanced.averageSpeedKmh = (distance / 1000) / (movingTime / 3600);

                const type = dataRecord.type as string | undefined;
                const sportType = dataRecord.sportType as string | undefined;
                if (type === "Run" || sportType === "Run") {
                    enhanced.pace = formatPace(movingTime / (distance / 1000));
                }
            }
        }

        if ("movingTime" in dataRecord || "elapsedTime" in dataRecord) {
            const time = (dataRecord.movingTime as number) || (dataRecord.elapsedTime as number);
            enhanced.duration = {
                seconds: time,
                minutes: Math.floor(time / 60),
                hours: Math.floor(time / 3600),
                formatted: formatDuration(time),
            };
        }

        for (const [key, value] of Object.entries(enhanced)) {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                enhanced[key] = addComputedFields(value);
            }
        }

        return enhanced as T;
    }

    return data;
}

/**
 * Format pace (seconds per km to min:sec/km)
 */
function formatPace(secondsPerKm: number): string {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

/**
 * Format duration (seconds to human-readable)
 */
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Apply all transformations in order
 */
export function applyTransformations<T>(
    data: T,
    shouldNormalizeKeys: boolean,
    shouldTransformDates: boolean,
    shouldFlattenResponses: boolean,
    shouldAddComputedFields: boolean,
): T {
    let result = data;

    if (shouldNormalizeKeys) {
        result = normalizeKeys(result);
    }

    if (shouldTransformDates) {
        result = transformDates(result);
    }

    if (shouldFlattenResponses) {
        result = flattenResponses(result);
    }

    if (shouldAddComputedFields) {
        result = addComputedFields(result);
    }

    return result;
}
