/**
 * Pagination helpers for Strava API
 */

import type { PaginationOptions } from "../types/common.ts";

/**
 * Paginated iterator for auto-pagination
 */
export class PaginatedIterator<T> {
    private currentPage = 1;
    private currentItems: T[] = [];
    private hasMore = true;

    constructor(
        private fetchPage: (page: number, perPage: number) => Promise<T[]>,
        private perPage: number = 30,
    ) {}

    /**
     * Get next page
     */
    async next(): Promise<boolean> {
        if (!this.hasMore) {
            return false;
        }

        const items = await this.fetchPage(this.currentPage, this.perPage);
        this.currentItems = items;
        this.currentPage++;

        if (items.length < this.perPage) {
            this.hasMore = false;
        }

        return items.length > 0;
    }

    /**
     * Get current page items
     */
    get current(): T[] {
        return this.currentItems;
    }

    /**
     * Check if there are more pages
     */
    get hasMorePages(): boolean {
        return this.hasMore;
    }

    /**
     * Reset iterator
     */
    reset(): void {
        this.currentPage = 1;
        this.currentItems = [];
        this.hasMore = true;
    }
}

/**
 * Create async iterator for auto-pagination
 * @param fetchPage - Function to fetch a page of data
 * @param perPage - Number of items per page (default: 30)
 * @returns Async generator that yields all items across pages
 */
export async function* listAll<T>(
    fetchPage: (page: number, perPage: number) => Promise<T[]>,
    perPage: number = 30,
): AsyncGenerator<T, void, unknown> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const items = await fetchPage(page, perPage);

        for (const item of items) {
            yield item;
        }

        if (items.length < perPage) {
            hasMore = false;
        } else {
            page++;
        }
    }
}

/**
 * Build pagination query parameters
 * @param options - Pagination options
 * @returns Query parameters object
 */
export function buildPaginationQuery(options?: PaginationOptions): Record<string, number> {
    const query: Record<string, number> = {};

    if (options?.page !== undefined) {
        query.page = options.page;
    }

    if (options?.perPage !== undefined) {
        query.per_page = options.perPage;
    }

    return query;
}
