/**
 * Rate limit tracking and queue management
 */

import type { RateLimitInfo, RateLimitStrategy } from "../types/common.ts";

interface QueuedRequest {
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (error: unknown) => void;
    timestamp: number;
}

/**
 * Rate limiter for Strava API
 */
export class RateLimiter {
    private shortTermLimit = 600;
    private shortTermWindow = 15 * 60 * 1000;
    private dailyLimit = 30000;
    private dailyWindow = 24 * 60 * 60 * 1000;

    private shortTermRequests: number[] = [];
    private dailyRequests: number[] = [];

    private queue: QueuedRequest[] = [];
    private strategy: RateLimitStrategy;

    constructor(strategy: RateLimitStrategy = "queue") {
        this.strategy = strategy;
    }

    /**
     * Update rate limit info from response headers
     */
    updateFromHeaders(headers: Headers): void {
        const shortTermLimit = headers.get("X-RateLimit-Limit");
        const shortTermUsage = headers.get("X-RateLimit-Usage");
        const dailyLimit = headers.get("X-RateLimit-Limit-Daily");
        const dailyUsage = headers.get("X-RateLimit-Usage-Daily");

        if (shortTermLimit) {
            this.shortTermLimit = parseInt(shortTermLimit, 10);
        }
        if (shortTermUsage) {
            const parts = shortTermUsage.split(",");
            if (parts.length >= 1) {
                const current = parseInt(parts[0], 10);
                this.recordRequest("shortTerm", current);
            }
        }

        if (dailyLimit) {
            this.dailyLimit = parseInt(dailyLimit, 10);
        }
        if (dailyUsage) {
            const parts = dailyUsage.split(",");
            if (parts.length >= 1) {
                const current = parseInt(parts[0], 10);
                this.recordRequest("daily", current);
            }
        }
    }

    /**
     * Record a request timestamp
     */
    private recordRequest(type: "shortTerm" | "daily", _currentUsage: number): void {
        const now = Date.now();
        const window = type === "shortTerm" ? this.shortTermWindow : this.dailyWindow;
        const requests = type === "shortTerm" ? this.shortTermRequests : this.dailyRequests;

        const cutoff = now - window;
        while (requests.length > 0 && requests[0] < cutoff) {
            requests.shift();
        }

        requests.push(now);
    }

    /**
     * Get current rate limit info
     */
    getRateLimitInfo(): RateLimitInfo {
        const now = Date.now();

        const shortTermCutoff = now - this.shortTermWindow;
        this.shortTermRequests = this.shortTermRequests.filter((t) => t >= shortTermCutoff);

        const dailyCutoff = now - this.dailyWindow;
        this.dailyRequests = this.dailyRequests.filter((t) => t >= dailyCutoff);

        return {
            shortTermLimit: this.shortTermLimit,
            shortTermUsage: this.shortTermRequests.length,
            dailyLimit: this.dailyLimit,
            dailyUsage: this.dailyRequests.length,
        };
    }

    /**
     * Check if we can make a request
     */
    canMakeRequest(): boolean {
        const info = this.getRateLimitInfo();
        return (info.shortTermUsage ?? 0) < (info.shortTermLimit ?? 600) &&
            (info.dailyUsage ?? 0) < (info.dailyLimit ?? 30000);
    }

    /**
     * Wait until we can make a request
     */
    async waitForAvailability(): Promise<void> {
        if (this.canMakeRequest()) {
            return;
        }

        if (this.strategy === "throw") {
            const info = this.getRateLimitInfo();
            throw new Error(
                `Rate limit exceeded. Short-term: ${info.shortTermUsage}/${info.shortTermLimit}, ` +
                    `Daily: ${info.dailyUsage}/${info.dailyLimit}`,
            );
        }

        if (this.strategy === "wait") {
            while (!this.canMakeRequest()) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            return;
        }

        return new Promise((resolve, reject) => {
            this.queue.push({
                resolve,
                reject,
                timestamp: Date.now(),
            });
        });
    }

    /**
     * Process queued requests
     */
    processQueue(): void {
        while (this.queue.length > 0 && this.canMakeRequest()) {
            const request = this.queue.shift();
            if (request) {
                request.resolve(undefined);
            }
        }
    }

    /**
     * Set rate limit strategy
     */
    setStrategy(strategy: RateLimitStrategy): void {
        this.strategy = strategy;
    }
}
