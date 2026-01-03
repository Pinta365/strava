/**
 * Streams resource
 */

import type { StravaClient } from "../client.ts";
import type { StreamSet } from "../types/api.ts";
import { validatePositiveInteger } from "../utils/validators.ts";

/**
 * Available stream types
 */
export type StreamType =
    | "time"
    | "distance"
    | "latlng"
    | "altitude"
    | "velocity_smooth"
    | "heartrate"
    | "cadence"
    | "watts"
    | "temp"
    | "moving"
    | "grade_smooth";

/**
 * Options for getting streams
 */
export interface GetStreamsOptions {
    /** Stream types to retrieve */
    types?: StreamType[];
    /** Whether to key streams by type */
    keyByType?: boolean;
}

/**
 * Resource for interacting with Strava streams
 */
export class StreamsResource {
    constructor(private client: StravaClient) {}

    /**
     * Get activity streams
     */
    async getForActivity(id: number, options?: GetStreamsOptions): Promise<StreamSet> {
        validatePositiveInteger(id, "id");

        const types = options?.types || ["time", "distance", "latlng", "altitude", "heartrate"];
        const query: Record<string, string | boolean> = {
            keys: types.join(","),
            key_by_type: options?.keyByType ?? true,
        };

        return await this.client.request<StreamSet>({
            method: "GET",
            path: `/activities/${id}/streams`,
            query,
        });
    }

    /**
     * Get segment effort streams
     */
    async getForSegmentEffort(id: number, options?: GetStreamsOptions): Promise<StreamSet> {
        validatePositiveInteger(id, "id");

        const types = options?.types || ["time", "distance", "latlng", "altitude", "heartrate"];
        const query: Record<string, string | boolean> = {
            keys: types.join(","),
            key_by_type: options?.keyByType ?? true,
        };

        return await this.client.request<StreamSet>({
            method: "GET",
            path: `/segment_efforts/${id}/streams`,
            query,
        });
    }

    /**
     * Get segment streams
     */
    async getForSegment(
        id: number,
        options?: Omit<GetStreamsOptions, "types"> & { types?: Array<"distance" | "latlng" | "altitude"> },
    ): Promise<StreamSet> {
        validatePositiveInteger(id, "id");

        const types = options?.types || ["distance", "latlng", "altitude"];
        const query: Record<string, string | boolean> = {
            keys: types.join(","),
            key_by_type: options?.keyByType ?? true,
        };

        return await this.client.request<StreamSet>({
            method: "GET",
            path: `/segments/${id}/streams`,
            query,
        });
    }

    /**
     * Get route streams
     */
    async getForRoute(id: number): Promise<StreamSet> {
        validatePositiveInteger(id, "id");
        return await this.client.request<StreamSet>({
            method: "GET",
            path: `/routes/${id}/streams`,
        });
    }
}
