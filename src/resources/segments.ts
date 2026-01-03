/**
 * Segments resource
 */

import type { StravaClient } from "../client.ts";
import type { DetailedSegment, ExplorerResponse } from "../types/api.ts";
import { validatePositiveInteger } from "../utils/validators.ts";

/**
 * Options for exploring segments
 */
export interface ExploreSegmentsOptions {
    /** Bounding box as [south, west, north, east] */
    bounds: [number, number, number, number];
    /** Activity type filter */
    activityType?: "running" | "riding";
    /** Minimum category */
    minCat?: number;
    /** Maximum category */
    maxCat?: number;
}

/**
 * Resource for interacting with Strava segments
 */
export class SegmentsResource {
    constructor(private client: StravaClient) {}

    /**
     * Get segment by ID
     */
    async getById(id: number): Promise<DetailedSegment> {
        validatePositiveInteger(id, "id");
        return await this.client.request<DetailedSegment>({
            method: "GET",
            path: `/segments/${id}`,
        });
    }

    /**
     * Explore segments
     */
    async explore(options: ExploreSegmentsOptions): Promise<ExplorerResponse> {
        const [south, west, north, east] = options.bounds;
        const query: Record<string, string | number> = {
            bounds: `${south},${west},${north},${east}`,
        };

        if (options.activityType) {
            query.activity_type = options.activityType;
        }
        if (options.minCat !== undefined) {
            query.min_cat = options.minCat;
        }
        if (options.maxCat !== undefined) {
            query.max_cat = options.maxCat;
        }

        return await this.client.request<ExplorerResponse>({
            method: "GET",
            path: "/segments/explore",
            query,
        });
    }

    /**
     * Star segment
     */
    async star(id: number, starred: boolean = true): Promise<DetailedSegment> {
        validatePositiveInteger(id, "id");
        return await this.client.request<DetailedSegment>({
            method: "PUT",
            path: `/segments/${id}/starred`,
            query: { starred: starred ? "true" : "false" },
        });
    }

    /**
     * Unstar segment
     */
    async unstar(id: number): Promise<DetailedSegment> {
        return await this.star(id, false);
    }
}
