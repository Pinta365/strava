/**
 * Uploads resource
 */

import type { StravaClient } from "../client.ts";
import type { Upload } from "../types/api.ts";
import { validatePositiveInteger } from "../utils/validators.ts";

/**
 * Options for creating an upload
 */
export interface CreateUploadOptions {
    /** Activity file (FIT, TCX, or GPX format) */
    file: File | Blob | Uint8Array;
    /** Activity name */
    name?: string;
    /** Activity description */
    description?: string;
    /** Whether activity was done on trainer */
    trainer?: boolean;
    /** Whether activity is a commute */
    commute?: boolean;
    /** File data type */
    dataType?: "fit" | "fit.gz" | "tcx" | "tcx.gz" | "gpx" | "gpx.gz";
    /** External ID for the activity */
    externalId?: string;
}

/**
 * Resource for uploading activities to Strava
 */
export class UploadsResource {
    constructor(private client: StravaClient) {}

    /**
     * Create upload
     */
    async create(options: CreateUploadOptions): Promise<Upload> {
        const formData = new FormData();

        if (options.file instanceof File) {
            formData.append("file", options.file);
        } else if (options.file instanceof Blob) {
            formData.append("file", options.file, "activity.fit");
        } else {
            // Uint8Array
            const blob = new Blob([options.file as BlobPart], { type: "application/octet-stream" });
            formData.append("file", blob, "activity.fit");
        }

        if (options.name) {
            formData.append("name", options.name);
        }
        if (options.description) {
            formData.append("description", options.description);
        }
        if (options.trainer !== undefined) {
            formData.append("trainer", options.trainer ? "1" : "0");
        }
        if (options.commute !== undefined) {
            formData.append("commute", options.commute ? "1" : "0");
        }
        if (options.dataType) {
            formData.append("data_type", options.dataType);
        }
        if (options.externalId) {
            formData.append("external_id", options.externalId);
        }

        // Use direct fetch for multipart/form-data
        const token = await this.getAccessToken();
        const response = await fetch("https://www.strava.com/api/v3/uploads", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Upload failed: ${error.message || response.statusText}`);
        }

        return await response.json() as Upload;
    }

    /**
     * Get upload by ID
     */
    async getById(id: number): Promise<Upload> {
        validatePositiveInteger(id, "id");
        return await this.client.request<Upload>({
            method: "GET",
            path: `/uploads/${id}`,
        });
    }

    private async getAccessToken(): Promise<string> {
        return await this.client.getAccessToken();
    }
}
