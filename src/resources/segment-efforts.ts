/**
 * Segment efforts resource
 */

import type { StravaClient } from "../client.ts";
import type { DetailedSegmentEffort, SummarySegmentEffort } from "../types/api.ts";
import { validatePositiveInteger } from "../utils/validators.ts";
import { buildPaginationQuery } from "../utils/pagination.ts";

/**
 * Options for listing segment efforts
 */
export interface ListSegmentEffortsOptions {
    /** Filter by segment ID */
    segmentId?: number;
    /** Filter by athlete ID */
    athleteId?: number;
    /** Start date in ISO 8601 format */
    startDateLocal?: string;
    /** End date in ISO 8601 format */
    endDateLocal?: string;
    /** Page number (default: 1) */
    page?: number;
    /** Number of items per page (default: 30, max: 200) */
    perPage?: number;
}

/**
 * Resource for interacting with Strava segment efforts
 */
export class SegmentEffortsResource {
    constructor(private client: StravaClient) {}

    /**
     * Get segment effort by ID
     */
    async getById(id: number): Promise<DetailedSegmentEffort> {
        validatePositiveInteger(id, "id");
        return await this.client.request<DetailedSegmentEffort>({
            method: "GET",
            path: `/segment_efforts/${id}`,
        });
    }

    /**
     * List segment efforts
     */
    async list(options?: ListSegmentEffortsOptions): Promise<SummarySegmentEffort[]> {
        const query: Record<string, string | number> = {
            ...buildPaginationQuery(options),
        };

        if (options?.segmentId) {
            query.segment_id = options.segmentId;
        }
        if (options?.athleteId) {
            query.athlete_id = options.athleteId;
        }
        if (options?.startDateLocal) {
            query.start_date_local = options.startDateLocal;
        }
        if (options?.endDateLocal) {
            query.end_date_local = options.endDateLocal;
        }

        return await this.client.request<SummarySegmentEffort[]>({
            method: "GET",
            path: "/segment_efforts",
            query,
        });
    }
}
