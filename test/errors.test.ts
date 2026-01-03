/**
 * Tests for error classes
 */

import { test } from "@cross/test";
import { assertEquals } from "@std/assert";
import { StravaAuthError, StravaError, StravaNotFoundError, StravaRateLimitError, StravaServerError, StravaValidationError } from "../src/errors.ts";

test("Error classes - should create StravaError with message", () => {
    const error = new StravaError("Test error");
    assertEquals(error.message, "Test error");
    assertEquals(error.name, "StravaError");
});

test("Error classes - should create StravaError with status code", () => {
    const error = new StravaError("Test error", 404);
    assertEquals(error.statusCode, 404);
});

test("Error classes - should create StravaAuthError", () => {
    const error = new StravaAuthError("Auth failed", 401);
    assertEquals(error.name, "StravaAuthError");
    assertEquals(error.statusCode, 401);
});

test("Error classes - should create StravaRateLimitError with retry info", () => {
    const error = new StravaRateLimitError("Rate limited", 429, undefined, 60, 600, 599);
    assertEquals(error.name, "StravaRateLimitError");
    assertEquals(error.retryAfter, 60);
    assertEquals(error.limit, 600);
    assertEquals(error.usage, 599);
});

test("Error classes - should create StravaNotFoundError", () => {
    const error = new StravaNotFoundError("Not found", 404);
    assertEquals(error.name, "StravaNotFoundError");
});

test("Error classes - should create StravaValidationError with errors", () => {
    const errors = [{ field: "name", message: "Required" }];
    const error = new StravaValidationError("Validation failed", 422, undefined, errors);
    assertEquals(error.name, "StravaValidationError");
    assertEquals(error.errors, errors);
});

test("Error classes - should create StravaServerError", () => {
    const error = new StravaServerError("Server error", 500);
    assertEquals(error.name, "StravaServerError");
});
