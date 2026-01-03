/**
 * Gears resource
 */

import type { StravaClient } from "../client.ts";
import type { DetailedGear } from "../types/api.ts";
import { validateNonEmptyString } from "../utils/validators.ts";

/**
 * Resource for interacting with Strava gear
 */
export class GearsResource {
    constructor(private client: StravaClient) {}

    /**
     * Get gear by ID
     */
    async getById(id: string): Promise<DetailedGear> {
        validateNonEmptyString(id, "id");
        return await this.client.request<DetailedGear>({
            method: "GET",
            path: `/gear/${id}`,
        });
    }
}
