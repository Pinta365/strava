/**
 * Athletes resource
 */

import type { StravaClient } from "../client.ts";
import type { ActivityStats, DetailedAthlete, DetailedGear, SummaryActivity } from "../types/api.ts";
import { validatePositiveInteger } from "../utils/validators.ts";

/**
 * Resource for interacting with Strava athletes
 */
export class AthletesResource {
    constructor(private client: StravaClient) {}

    /**
     * Get authenticated athlete
     */
    async get(): Promise<DetailedAthlete> {
        return await this.client.request<DetailedAthlete>({
            method: "GET",
            path: "/athlete",
        });
    }

    /**
     * Get athlete stats
     */
    async getStats(id: number): Promise<ActivityStats> {
        validatePositiveInteger(id, "id");
        return await this.client.request<ActivityStats>({
            method: "GET",
            path: `/athletes/${id}/stats`,
        });
    }

    /**
     * Update authenticated athlete
     */
    async update(weight: number): Promise<DetailedAthlete> {
        return await this.client.request<DetailedAthlete>({
            method: "PUT",
            path: "/athlete",
            query: { weight },
        });
    }

    /**
     * Get athlete stats with recent activities and gear
     * Combines stats, recent activities, and gear information
     */
    async getStatsWithActivities(
        id: number,
        options?: {
            recentActivitiesLimit?: number;
            includeGear?: boolean;
        },
    ): Promise<
        DetailedAthlete & {
            stats: ActivityStats;
            recentActivities: SummaryActivity[];
            gear?: DetailedGear[];
        }
    > {
        validatePositiveInteger(id, "id");

        const [athlete, stats, recentActivities] = await Promise.all([
            this.get(),
            this.getStats(id),
            this.client.activities.list({
                perPage: options?.recentActivitiesLimit || 10,
            }),
        ]);

        const result: DetailedAthlete & {
            stats: ActivityStats;
            recentActivities: SummaryActivity[];
            gear?: DetailedGear[];
        } = {
            ...athlete,
            stats,
            recentActivities,
        };

        if (options?.includeGear !== false) {
            const gearIds: string[] = [];
            if (athlete.bikes) {
                gearIds.push(...athlete.bikes.map((bike) => bike.id).filter((id): id is string => id !== undefined));
            }
            if (athlete.shoes) {
                gearIds.push(...athlete.shoes.map((shoe) => shoe.id).filter((id): id is string => id !== undefined));
            }

            if (gearIds.length > 0) {
                try {
                    const gearPromises = gearIds.map((id) => this.client.gears.getById(id).catch(() => null));
                    const gearResults = await Promise.all(gearPromises);
                    result.gear = gearResults.filter((g): g is DetailedGear => g !== null);
                } catch {
                    // Gear may not be accessible
                }
            }
        }

        return result;
    }
}
