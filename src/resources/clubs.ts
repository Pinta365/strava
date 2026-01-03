/**
 * Clubs resource
 */

import type { StravaClient } from "../client.ts";
import type { ClubActivity, DetailedClub, SummaryAthlete, SummaryClub } from "../types/api.ts";
import { validatePositiveInteger } from "../utils/validators.ts";
import { buildPaginationQuery } from "../utils/pagination.ts";

/**
 * Resource for interacting with Strava clubs
 */
export class ClubsResource {
    constructor(private client: StravaClient) {}

    /**
     * Get club by ID
     */
    async getById(id: number): Promise<DetailedClub> {
        validatePositiveInteger(id, "id");
        return await this.client.request<DetailedClub>({
            method: "GET",
            path: `/clubs/${id}`,
        });
    }

    /**
     * List athlete clubs
     */
    async list(options?: { page?: number; perPage?: number }): Promise<SummaryClub[]> {
        return await this.client.request<SummaryClub[]>({
            method: "GET",
            path: "/athlete/clubs",
            query: buildPaginationQuery(options),
        });
    }

    /**
     * Get club members
     */
    async getMembers(id: number, options?: { page?: number; perPage?: number }): Promise<SummaryAthlete[]> {
        validatePositiveInteger(id, "id");
        return await this.client.request<SummaryAthlete[]>({
            method: "GET",
            path: `/clubs/${id}/members`,
            query: buildPaginationQuery(options),
        });
    }

    /**
     * Get club activities
     */
    async getActivities(id: number, options?: { page?: number; perPage?: number }): Promise<ClubActivity[]> {
        validatePositiveInteger(id, "id");
        return await this.client.request<ClubActivity[]>({
            method: "GET",
            path: `/clubs/${id}/activities`,
            query: buildPaginationQuery(options),
        });
    }

    /**
     * Get club admins
     */
    async getAdmins(id: number, options?: { page?: number; perPage?: number }): Promise<SummaryAthlete[]> {
        validatePositiveInteger(id, "id");
        return await this.client.request<SummaryAthlete[]>({
            method: "GET",
            path: `/clubs/${id}/admins`,
            query: buildPaginationQuery(options),
        });
    }
}
