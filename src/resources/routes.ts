/**
 * Routes resource
 */

import type { StravaClient } from "../client.ts";
import type { Route } from "../types/api.ts";
import { validatePositiveInteger } from "../utils/validators.ts";
import { buildPaginationQuery } from "../utils/pagination.ts";

/**
 * Resource for interacting with Strava routes
 */
export class RoutesResource {
    constructor(private client: StravaClient) {}

    /**
     * Get route by ID
     */
    async getById(id: number): Promise<Route> {
        validatePositiveInteger(id, "id");
        return await this.client.request<Route>({
            method: "GET",
            path: `/routes/${id}`,
        });
    }

    /**
     * List athlete routes
     */
    async list(options?: { page?: number; perPage?: number }): Promise<Route[]> {
        return await this.client.request<Route[]>({
            method: "GET",
            path: "/athlete/routes",
            query: buildPaginationQuery(options),
        });
    }

    /**
     * Download route as GPX
     */
    async downloadAsGPX(id: number): Promise<string> {
        validatePositiveInteger(id, "id");
        const response = await fetch(`https://www.strava.com/api/v3/routes/${id}/export_gpx`, {
            headers: {
                "Authorization": `Bearer ${await this.getAccessToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to download GPX: ${response.statusText}`);
        }

        return response.text();
    }

    /**
     * Download route as TCX
     */
    async downloadAsTCX(id: number): Promise<string> {
        validatePositiveInteger(id, "id");
        const response = await fetch(`https://www.strava.com/api/v3/routes/${id}/export_tcx`, {
            headers: {
                "Authorization": `Bearer ${await this.getAccessToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to download TCX: ${response.statusText}`);
        }

        return response.text();
    }

    private async getAccessToken(): Promise<string> {
        return await this.client.getAccessToken();
    }
}
