/**
 * Main Strava API client
 */

import { request } from "./http/request.ts";
import { RateLimiter } from "./http/rate-limiter.ts";
import { RequestDeduplicator } from "./http/deduplication.ts";
import { OAuthManager } from "./auth/oauth.ts";
import { getDefaultTokenStore, type TokenStore } from "./auth/token-store.ts";
import type { StravaScope } from "./auth/scopes.ts";
import type { RateLimitStrategy, RequestConfig, RetryConfig } from "./types/common.ts";

/**
 * Client configuration options
 */
export interface ClientOptions {
    clientId: string;
    clientSecret: string;
    redirectUri?: string;
    tokenStore?: TokenStore;
    baseUrl?: string;
    timeout?: number;
    retries?: RetryConfig;
    rateLimitStrategy?: RateLimitStrategy;
    deduplicationWindow?: number;
    normalizeKeys?: boolean;
    transformDates?: boolean;
    flattenResponses?: boolean;
    addComputedFields?: boolean;
}

/**
 * Authentication credentials
 */
export interface AuthCredentials {
    code: string;
    redirectUri?: string;
}

/**
 * Main Strava API client class
 */
export class StravaClient {
    private readonly options: Required<Omit<ClientOptions, "tokenStore" | "redirectUri">> & {
        tokenStore: TokenStore;
        redirectUri?: string;
    };
    private readonly oauthManager: OAuthManager;
    private readonly rateLimiter: RateLimiter;
    private readonly deduplicator: RequestDeduplicator;

    private _athletes?: AthletesResource;
    private _activities?: ActivitiesResource;
    private _segments?: SegmentsResource;
    private _segmentEfforts?: SegmentEffortsResource;
    private _clubs?: ClubsResource;
    private _gears?: GearsResource;
    private _routes?: RoutesResource;
    private _uploads?: UploadsResource;
    private _streams?: StreamsResource;

    constructor(options: ClientOptions) {
        this.options = {
            baseUrl: options.baseUrl || "https://www.strava.com/api/v3",
            timeout: options.timeout || 30000,
            retries: options.retries || {},
            rateLimitStrategy: options.rateLimitStrategy || "queue",
            deduplicationWindow: options.deduplicationWindow || 5000,
            normalizeKeys: options.normalizeKeys ?? true,
            transformDates: options.transformDates ?? true,
            flattenResponses: options.flattenResponses ?? true,
            addComputedFields: options.addComputedFields ?? true,
            tokenStore: options.tokenStore || getDefaultTokenStore(),
            redirectUri: options.redirectUri,
            clientId: options.clientId,
            clientSecret: options.clientSecret,
        };

        this.oauthManager = new OAuthManager(
            this.options.clientId,
            this.options.clientSecret,
            this.options.tokenStore,
        );

        this.rateLimiter = new RateLimiter(this.options.rateLimitStrategy);
        this.deduplicator = new RequestDeduplicator(this.options.deduplicationWindow);
    }

    /**
     * Authenticate with authorization code
     */
    async authenticate(credentials: AuthCredentials): Promise<void> {
        await this.oauthManager.authenticate(
            credentials.code,
            credentials.redirectUri || this.options.redirectUri,
        );
    }

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<void> {
        await this.oauthManager.refreshToken();
    }

    /**
     * Get authorization URL
     */
    getAuthorizationUrl(options: {
        redirectUri?: string;
        scope: string[];
        state?: string;
        approvalPrompt?: "force" | "auto";
    }): string {
        return this.oauthManager.getAuthorizationUrl({
            redirectUri: options.redirectUri || this.options.redirectUri || "",
            scope: options.scope as unknown as StravaScope[],
            state: options.state,
            approvalPrompt: options.approvalPrompt,
        });
    }

    /**
     * Get current access token (for direct fetch calls)
     */
    async getAccessToken(): Promise<string> {
        const token = await this.oauthManager.getToken();
        if (!token) {
            throw new Error("Not authenticated. Call authenticate() first.");
        }
        return token.accessToken;
    }

    /**
     * Low-level request method
     */
    async request<T>(config: RequestConfig): Promise<T> {
        const token = await this.oauthManager.getToken();
        if (!token) {
            throw new Error("Not authenticated. Call authenticate() first.");
        }

        return request<T>(config, {
            baseUrl: this.options.baseUrl,
            timeout: this.options.timeout,
            accessToken: token.accessToken,
            rateLimiter: this.rateLimiter,
            deduplicator: this.deduplicator,
            retryConfig: this.options.retries,
            normalizeKeys: this.options.normalizeKeys,
            transformDates: this.options.transformDates,
            flattenResponses: this.options.flattenResponses,
            addComputedFields: this.options.addComputedFields,
        });
    }

    get athletes(): AthletesResource {
        if (!this._athletes) {
            this._athletes = new AthletesResource(this);
        }
        return this._athletes;
    }

    get activities(): ActivitiesResource {
        if (!this._activities) {
            this._activities = new ActivitiesResource(this);
        }
        return this._activities;
    }

    get segments(): SegmentsResource {
        if (!this._segments) {
            this._segments = new SegmentsResource(this);
        }
        return this._segments;
    }

    get segmentEfforts(): SegmentEffortsResource {
        if (!this._segmentEfforts) {
            this._segmentEfforts = new SegmentEffortsResource(this);
        }
        return this._segmentEfforts;
    }

    get clubs(): ClubsResource {
        if (!this._clubs) {
            this._clubs = new ClubsResource(this);
        }
        return this._clubs;
    }

    get gears(): GearsResource {
        if (!this._gears) {
            this._gears = new GearsResource(this);
        }
        return this._gears;
    }

    get routes(): RoutesResource {
        if (!this._routes) {
            this._routes = new RoutesResource(this);
        }
        return this._routes;
    }

    get uploads(): UploadsResource {
        if (!this._uploads) {
            this._uploads = new UploadsResource(this);
        }
        return this._uploads;
    }

    get streams(): StreamsResource {
        if (!this._streams) {
            this._streams = new StreamsResource(this);
        }
        return this._streams;
    }

    /**
     * Clean up resources (stop timers, clear caches)
     * Call this when you're done with the client to allow the process to exit
     */
    destroy(): void {
        this.deduplicator.destroy();
    }
}

import { AthletesResource } from "./resources/athletes.ts";
import { ActivitiesResource } from "./resources/activities.ts";
import { SegmentsResource } from "./resources/segments.ts";
import { SegmentEffortsResource } from "./resources/segment-efforts.ts";
import { ClubsResource } from "./resources/clubs.ts";
import { GearsResource } from "./resources/gears.ts";
import { RoutesResource } from "./resources/routes.ts";
import { UploadsResource } from "./resources/uploads.ts";
import { StreamsResource } from "./resources/streams.ts";
