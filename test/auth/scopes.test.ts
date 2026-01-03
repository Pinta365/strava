/**
 * Tests for OAuth scopes
 */

import { test } from "@cross/test";
import { assertEquals } from "@std/assert";
import { formatScopes, hasAllScopes, hasScope, parseScopes, StravaScope, validateScopes } from "../../src/auth/scopes.ts";

test("OAuth scopes - should parse scope string", () => {
    const scopes = parseScopes("read,activity:read_all");
    assertEquals(scopes.length, 2);
    assertEquals(scopes[0], StravaScope.Read);
    assertEquals(scopes[1], StravaScope.ActivityReadAll);
});

test("OAuth scopes - should format scopes array", () => {
    const scopes = [StravaScope.Read, StravaScope.ActivityReadAll];
    const formatted = formatScopes(scopes);
    assertEquals(formatted, "read,activity:read_all");
});

test("OAuth scopes - should check if scope is included", () => {
    const available = [StravaScope.Read, StravaScope.ActivityReadAll];
    assertEquals(hasScope(StravaScope.Read, available), true);
    assertEquals(hasScope(StravaScope.ProfileWrite, available), false);
});

test("OAuth scopes - should check if all scopes are available", () => {
    const available = [StravaScope.Read, StravaScope.ActivityReadAll, StravaScope.ProfileWrite];
    const required = [StravaScope.Read, StravaScope.ActivityReadAll];
    assertEquals(hasAllScopes(required, available), true);

    const required2 = [StravaScope.Read, StravaScope.ProfileWrite, StravaScope.ActivityWrite];
    assertEquals(hasAllScopes(required2, available), false);
});

test("OAuth scopes - should validate scopes", () => {
    const valid = [StravaScope.Read, StravaScope.ActivityReadAll];
    assertEquals(validateScopes(valid), true);

    const invalid = [StravaScope.Read, "invalid" as StravaScope];
    assertEquals(validateScopes(invalid), false);
});
