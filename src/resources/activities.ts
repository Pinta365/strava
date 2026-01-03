/**
 * Activities resource
 */

import type { StravaClient } from "../client.ts";
import type {
    ActivityZone,
    Comment,
    DetailedActivity,
    DetailedSegmentEffort,
    Lap,
    StreamSet,
    SummaryActivity,
    SummaryAthlete,
} from "../types/api.ts";
import { buildPaginationQuery } from "../utils/pagination.ts";
import { validatePositiveInteger } from "../utils/validators.ts";
import { listAll } from "../utils/pagination.ts";
import type { StreamType } from "../resources/streams.ts";

/**
 * Options for listing activities
 */
export interface ListActivitiesOptions {
    /** Unix timestamp for activities before this time */
    before?: number;
    /** Unix timestamp for activities after this time */
    after?: number;
    /** Page number (default: 1) */
    page?: number;
    /** Number of items per page (default: 30, max: 200) */
    perPage?: number;
}

/**
 * Data for creating a new activity
 */
export interface CreateActivityData {
    /** Activity name */
    name: string;
    /** Activity type (e.g., "Run", "Ride") */
    type: string;
    /** Start date in ISO 8601 format */
    startDateLocal: string;
    /** Elapsed time in seconds */
    elapsedTime: number;
    /** Activity description */
    description?: string;
    /** Distance in meters */
    distance?: number;
    /** Whether activity was done on trainer */
    trainer?: boolean;
    /** Whether activity is a commute */
    commute?: boolean;
}

/**
 * Data for updating an existing activity
 */
export interface UpdateActivityData {
    /** Activity name */
    name?: string;
    /** Activity type (e.g., "Run", "Ride") */
    type?: string;
    /** Sport type */
    sportType?: string;
    /** Start date in ISO 8601 format */
    startDateLocal?: string;
    /** Elapsed time in seconds */
    elapsedTime?: number;
    /** Activity description */
    description?: string;
    /** Distance in meters */
    distance?: number;
    /** Whether activity was done on trainer */
    trainer?: boolean;
    /** Whether activity is a commute */
    commute?: boolean;
    /** Gear ID */
    gearId?: string;
}

/**
 * Resource for interacting with Strava activities
 */
export class ActivitiesResource {
    constructor(private client: StravaClient) {}

    /**
     * Get activity by ID
     */
    async getById(id: number): Promise<DetailedActivity> {
        validatePositiveInteger(id, "id");
        return await this.client.request<DetailedActivity>({
            method: "GET",
            path: `/activities/${id}`,
        });
    }

    /**
     * List athlete activities
     */
    async list(options?: ListActivitiesOptions): Promise<SummaryActivity[]> {
        const query: Record<string, string | number> = {
            ...buildPaginationQuery(options),
        };

        if (options?.before) {
            query.before = options.before;
        }
        if (options?.after) {
            query.after = options.after;
        }

        return await this.client.request<SummaryActivity[]>({
            method: "GET",
            path: "/athlete/activities",
            query,
        });
    }

    /**
     * List all activities (auto-pagination)
     */
    async *listAll(options?: Omit<ListActivitiesOptions, "page">): AsyncGenerator<SummaryActivity, void, unknown> {
        yield* listAll(
            (page, perPage) => {
                return this.list({ ...options, page, perPage });
            },
            options?.perPage || 30,
        );
    }

    /**
     * Create activity
     */
    async create(data: CreateActivityData): Promise<DetailedActivity> {
        return await this.client.request<DetailedActivity>({
            method: "POST",
            path: "/activities",
            body: data,
        });
    }

    /**
     * Update activity
     */
    async update(id: number, data: UpdateActivityData): Promise<DetailedActivity> {
        validatePositiveInteger(id, "id");
        return await this.client.request<DetailedActivity>({
            method: "PUT",
            path: `/activities/${id}`,
            body: data,
        });
    }

    /**
     * Delete activity
     */
    async delete(id: number): Promise<void> {
        validatePositiveInteger(id, "id");
        await this.client.request({
            method: "DELETE",
            path: `/activities/${id}`,
        });
    }

    /**
     * Get activity with details (combines activity + laps + zones + comments + kudoers)
     */
    async getWithDetails(id: number): Promise<
        DetailedActivity & {
            laps: Lap[];
            zones: ActivityZone[];
            comments: Comment[];
            kudoers: SummaryAthlete[];
        }
    > {
        validatePositiveInteger(id, "id");

        const [activity, laps, zones, comments, kudoers] = await Promise.all([
            this.getById(id),
            this.getLaps(id),
            this.getZones(id),
            this.getComments(id),
            this.getKudoers(id),
        ]);

        return {
            ...activity,
            laps,
            zones,
            comments,
            kudoers,
        };
    }

    /**
     * Get activity laps
     */
    async getLaps(id: number): Promise<Lap[]> {
        validatePositiveInteger(id, "id");
        return await this.client.request<Lap[]>({
            method: "GET",
            path: `/activities/${id}/laps`,
        });
    }

    /**
     * Get activity zones
     */
    async getZones(id: number): Promise<ActivityZone[]> {
        validatePositiveInteger(id, "id");
        return await this.client.request<ActivityZone[]>({
            method: "GET",
            path: `/activities/${id}/zones`,
        });
    }

    /**
     * Get activity comments
     */
    async getComments(id: number, options?: { page?: number; perPage?: number }): Promise<Comment[]> {
        validatePositiveInteger(id, "id");
        return await this.client.request<Comment[]>({
            method: "GET",
            path: `/activities/${id}/comments`,
            query: buildPaginationQuery(options),
        });
    }

    /**
     * Get activity kudoers
     */
    async getKudoers(id: number, options?: { page?: number; perPage?: number }): Promise<SummaryAthlete[]> {
        validatePositiveInteger(id, "id");
        return await this.client.request<SummaryAthlete[]>({
            method: "GET",
            path: `/activities/${id}/kudoers`,
            query: buildPaginationQuery(options),
        });
    }

    /**
     * Analyze activity with comprehensive data
     * Combines activity, zones, laps, best efforts (segments), and optionally streams
     */
    async analyze(
        id: number,
        options?: {
            includeStreams?: boolean;
            streamTypes?: StreamType[];
        },
    ): Promise<
        DetailedActivity & {
            zones: ActivityZone[];
            laps: Lap[];
            bestEfforts: DetailedSegmentEffort[];
            streams?: StreamSet;
            analysis: {
                hasPowerData: boolean;
                hasHeartRateData: boolean;
                totalLaps: number;
                bestEffortCount: number;
                averageLapTime?: number;
                averageLapDistance?: number;
            };
        }
    > {
        validatePositiveInteger(id, "id");

        const [activity, zones, laps] = await Promise.all([
            this.getById(id),
            this.getZones(id).catch(() => [] as ActivityZone[]),
            this.getLaps(id).catch(() => [] as Lap[]),
        ]);

        const bestEfforts = activity.bestEfforts || [];

        const analysis = {
            hasPowerData: zones.some((z) => z.type === "power"),
            hasHeartRateData: zones.some((z) => z.type === "heartrate"),
            totalLaps: laps.length,
            bestEffortCount: bestEfforts.length,
            averageLapTime: laps.length > 0 ? laps.reduce((sum, lap) => sum + (lap.movingTime || 0), 0) / laps.length : undefined,
            averageLapDistance: laps.length > 0 ? laps.reduce((sum, lap) => sum + (lap.distance || 0), 0) / laps.length : undefined,
        };

        const result: DetailedActivity & {
            zones: ActivityZone[];
            laps: Lap[];
            bestEfforts: DetailedSegmentEffort[];
            streams?: StreamSet;
            analysis: typeof analysis;
        } = {
            ...activity,
            zones,
            laps,
            bestEfforts,
            analysis,
        };

        if (options?.includeStreams) {
            try {
                const streams = await this.client.streams.getForActivity(id, {
                    types: options.streamTypes,
                });
                result.streams = streams;
            } catch {
                // Streams may not be available for all activities
            }
        }

        return result;
    }
}
