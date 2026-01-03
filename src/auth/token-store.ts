/**
 * Token storage interface and implementations
 */

import { CurrentRuntime, Runtime } from "@cross/runtime";

/**
 * Token data structure
 */
export interface TokenData {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    tokenType: string;
    scope?: string;
    athleteId?: number;
}

/**
 * Token storage interface
 */
export interface TokenStore {
    get(): Promise<TokenData | null>;
    set(token: TokenData): Promise<void>;
    clear(): Promise<void>;
}

/**
 * In-memory token store (default)
 */
export class MemoryTokenStore implements TokenStore {
    private token: TokenData | null = null;

    get(): Promise<TokenData | null> {
        return Promise.resolve(this.token);
    }

    set(token: TokenData): Promise<void> {
        this.token = token;
        return Promise.resolve();
    }

    clear(): Promise<void> {
        this.token = null;
        return Promise.resolve();
    }
}

/**
 * Browser localStorage token store
 */
export class LocalStorageTokenStore implements TokenStore {
    private readonly key: string;

    constructor(key: string = "strava_tokens") {
        this.key = key;
    }

    get(): Promise<TokenData | null> {
        if (CurrentRuntime !== Runtime.Browser) {
            throw new Error("LocalStorageTokenStore can only be used in browser environment");
        }

        try {
            const stored = localStorage.getItem(this.key);
            if (!stored) return Promise.resolve(null);

            return Promise.resolve(JSON.parse(stored) as TokenData);
        } catch {
            return Promise.resolve(null);
        }
    }

    set(token: TokenData): Promise<void> {
        if (CurrentRuntime !== Runtime.Browser) {
            throw new Error("LocalStorageTokenStore can only be used in browser environment");
        }

        localStorage.setItem(this.key, JSON.stringify(token));
        return Promise.resolve();
    }

    clear(): Promise<void> {
        if (CurrentRuntime !== Runtime.Browser) {
            throw new Error("LocalStorageTokenStore can only be used in browser environment");
        }

        localStorage.removeItem(this.key);
        return Promise.resolve();
    }
}

/**
 * File system token store (Node.js/Deno)
 */
export class FileSystemTokenStore implements TokenStore {
    private readonly path: string;

    constructor(path: string = "./.strava-tokens.json") {
        this.path = path;
    }

    async get(): Promise<TokenData | null> {
        try {
            let content: string;
            if (CurrentRuntime === Runtime.Node || CurrentRuntime === Runtime.Bun) {
                const { readFile } = await import("node:fs/promises");
                content = await readFile(this.path, "utf-8");
            } else {
                // Deno
                content = await Deno.readTextFile(this.path);
            }
            return JSON.parse(content) as TokenData;
        } catch {
            return null;
        }
    }

    async set(token: TokenData): Promise<void> {
        const content = JSON.stringify(token, null, 2);
        if (CurrentRuntime === Runtime.Node || CurrentRuntime === Runtime.Bun) {
            const { writeFile } = await import("node:fs/promises");
            await writeFile(this.path, content, "utf-8");
        } else {
            // Deno
            await Deno.writeTextFile(this.path, content);
        }
    }

    async clear(): Promise<void> {
        try {
            if (CurrentRuntime === Runtime.Node || CurrentRuntime === Runtime.Bun) {
                const { unlink } = await import("node:fs/promises");
                await unlink(this.path);
            } else {
                // Deno
                await Deno.remove(this.path);
            }
        } catch {
            // File doesn't exist, ignore
        }
    }
}

/**
 * Get default token store based on runtime environment
 * @returns TokenStore appropriate for the current runtime (browser, Node.js, Deno, Bun)
 */
export function getDefaultTokenStore(): TokenStore {
    if (CurrentRuntime === Runtime.Browser) {
        return new LocalStorageTokenStore();
    } else if (CurrentRuntime === Runtime.Node || CurrentRuntime === Runtime.Deno || CurrentRuntime === Runtime.Bun) {
        return new FileSystemTokenStore();
    } else {
        return new MemoryTokenStore();
    }
}
