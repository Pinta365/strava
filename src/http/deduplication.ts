/**
 * Request deduplication to prevent duplicate requests within a time window
 */

interface CacheEntry<T> {
    promise: Promise<T>;
    timestamp: number;
}

/**
 * Request deduplication cache
 */
export class RequestDeduplicator {
    private cache = new Map<string, CacheEntry<unknown>>();
    private cleanupInterval: number | null = null;
    private readonly windowMs: number;

    constructor(windowMs: number = 5000) {
        this.windowMs = windowMs;
        this.startCleanup();
    }

    /**
     * Generate cache key from request details
     */
    private generateKey(method: string, path: string, query?: Record<string, unknown>, body?: unknown): string {
        const parts = [method, path];

        if (query) {
            const sortedQuery = Object.keys(query)
                .sort()
                .map((key) => `${key}=${String(query[key])}`)
                .join("&");
            parts.push(sortedQuery);
        }

        if (body) {
            try {
                const bodyHash = JSON.stringify(body);
                parts.push(bodyHash);
            } catch {
                parts.push(String(body));
            }
        }

        return parts.join("|");
    }

    /**
     * Get or create a request promise
     */
    getOrCreate<T>(
        method: string,
        path: string,
        query: Record<string, unknown> | undefined,
        body: unknown,
        factory: () => Promise<T>,
    ): Promise<T> {
        const key = this.generateKey(method, path, query, body);
        const now = Date.now();

        const cached = this.cache.get(key);
        if (cached && (now - cached.timestamp) < this.windowMs) {
            return cached.promise as Promise<T>;
        }

        const promise = factory();
        this.cache.set(key, { promise, timestamp: now });

        return promise;
    }

    /**
     * Clear expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp >= this.windowMs) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Start periodic cleanup
     */
    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.windowMs) as unknown as number;
    }

    /**
     * Stop cleanup and clear cache
     */
    destroy(): void {
        if (this.cleanupInterval !== null) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}
