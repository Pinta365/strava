/**
 * Tests for pagination utilities
 */

import { test } from "@cross/test";
import { assertEquals } from "@std/assert";
import { buildPaginationQuery, listAll, PaginatedIterator } from "../../src/utils/pagination.ts";

test("Pagination utilities - should build pagination query", () => {
    const query = buildPaginationQuery({ page: 2, perPage: 50 });
    assertEquals(query.page, 2);
    assertEquals(query.per_page, 50);
});

test("Pagination utilities - should build pagination query with partial options", () => {
    const query = buildPaginationQuery({ page: 1 });
    assertEquals(query.page, 1);
    assertEquals("per_page" in query, false);
});

test("Pagination utilities - should iterate through pages", async () => {
    const fetchPage = (p: number, _perPage: number) => {
        if (p === 1) return Promise.resolve([1, 2, 3]);
        if (p === 2) return Promise.resolve([4, 5]);
        return Promise.resolve([]);
    };

    const iterator = new PaginatedIterator(fetchPage, 3);

    assertEquals(await iterator.next(), true);
    assertEquals(iterator.current, [1, 2, 3]);

    assertEquals(await iterator.next(), true);
    assertEquals(iterator.current, [4, 5]);

    assertEquals(await iterator.next(), false);
});

test("Pagination utilities - should auto-paginate with listAll", async () => {
    const items: number[] = [];
    const fetchPage = (page: number) => {
        if (page === 1) return Promise.resolve([1, 2, 3]);
        if (page === 2) return Promise.resolve([4, 5]);
        return Promise.resolve([]);
    };

    for await (const item of listAll(fetchPage, 3)) {
        items.push(item);
    }

    assertEquals(items, [1, 2, 3, 4, 5]);
});
