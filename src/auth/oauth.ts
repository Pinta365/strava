/**
 * OAuth 2.0 authentication flow for Strava API
 */

import type { TokenData, TokenStore } from "./token-store.ts";
import { StravaAuthError } from "../errors.ts";
import { formatScopes, parseScopes, type StravaScope } from "./scopes.ts";

const OAUTH_BASE_URL = "https://www.strava.com/api/v3/oauth";

interface TokenResponse {
    token_type: string;
    expires_at: number;
    expires_in: number;
    refresh_token: string;
    access_token: string;
    athlete?: {
        id: number;
        [key: string]: unknown;
    };
}

interface AuthorizationUrlOptions {
    clientId: string;
    redirectUri: string;
    scope: StravaScope[];
    state?: string;
    approvalPrompt?: "force" | "auto";
}

/**
 * Generate authorization URL
 */
export function getAuthorizationUrl(options: AuthorizationUrlOptions): string {
    const { clientId, redirectUri, scope, state, approvalPrompt = "auto" } = options;

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: formatScopes(scope),
        approval_prompt: approvalPrompt,
    });

    if (state) {
        params.append("state", state);
    }

    return `${OAUTH_BASE_URL}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 * @param code - Authorization code from OAuth callback
 * @param clientId - Strava client ID
 * @param clientSecret - Strava client secret
 * @param redirectUri - Redirect URI used in authorization (optional)
 * @returns Token data
 */
export async function exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri?: string,
): Promise<TokenData> {
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
    });

    if (redirectUri) {
        params.append("redirect_uri", redirectUri);
    }

    const response = await fetch(`${OAUTH_BASE_URL}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new StravaAuthError(
            `Failed to exchange code: ${error.message || response.statusText}`,
            response.status,
            error,
        );
    }

    const data = await response.json() as TokenResponse;

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        tokenType: data.token_type,
        athleteId: data.athlete?.id,
    };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
): Promise<TokenData> {
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
    });

    const response = await fetch(`${OAUTH_BASE_URL}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new StravaAuthError(
            `Failed to refresh token: ${error.message || response.statusText}`,
            response.status,
            error,
        );
    }

    const data = await response.json() as TokenResponse;

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        tokenType: data.token_type,
        athleteId: data.athlete?.id,
    };
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpired(token: TokenData, bufferSeconds: number = 300): boolean {
    const now = Math.floor(Date.now() / 1000);
    return token.expiresAt <= (now + bufferSeconds);
}

/**
 * OAuth manager for handling authentication and token refresh
 */
export class OAuthManager {
    private tokenStore: TokenStore;
    private clientId: string;
    private clientSecret: string;

    /**
     * Create a new OAuth manager
     * @param clientId - Strava client ID
     * @param clientSecret - Strava client secret
     * @param tokenStore - Token storage implementation
     */
    constructor(clientId: string, clientSecret: string, tokenStore: TokenStore) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tokenStore = tokenStore;
    }

    /**
     * Get authorization URL
     * @param options - Authorization URL options
     * @returns Authorization URL to redirect user to
     */
    getAuthorizationUrl(options: Omit<AuthorizationUrlOptions, "clientId">): string {
        return getAuthorizationUrl({
            ...options,
            clientId: this.clientId,
        });
    }

    /**
     * Exchange code and store tokens
     * @param code - Authorization code from OAuth callback
     * @param redirectUri - Redirect URI used in authorization (optional)
     * @returns Token data
     */
    async authenticate(code: string, redirectUri?: string): Promise<TokenData> {
        const token = await exchangeCode(code, this.clientId, this.clientSecret, redirectUri);
        await this.tokenStore.set(token);
        return token;
    }

    /**
     * Get current token, refreshing if needed
     * @returns Token data or null if not authenticated
     */
    async getToken(): Promise<TokenData | null> {
        const token = await this.tokenStore.get();
        if (!token) {
            return null;
        }

        // Refresh if expired or about to expire
        if (isTokenExpired(token)) {
            try {
                const newToken = await refreshAccessToken(
                    token.refreshToken,
                    this.clientId,
                    this.clientSecret,
                );
                const refreshedToken: TokenData = {
                    ...newToken,
                    scope: token.scope,
                    athleteId: token.athleteId || newToken.athleteId,
                };
                await this.tokenStore.set(refreshedToken);
                return refreshedToken;
            } catch (error) {
                await this.tokenStore.clear();
                throw error;
            }
        }

        return token;
    }

    /**
     * Manually refresh token
     * @returns New token data
     */
    async refreshToken(): Promise<TokenData> {
        const token = await this.tokenStore.get();
        if (!token) {
            throw new StravaAuthError("No token available to refresh");
        }

        const newToken = await refreshAccessToken(
            token.refreshToken,
            this.clientId,
            this.clientSecret,
        );

        const refreshedToken: TokenData = {
            ...newToken,
            scope: token.scope,
            athleteId: token.athleteId || newToken.athleteId,
        };

        await this.tokenStore.set(refreshedToken);
        return refreshedToken;
    }

    /**
     * Get current scopes
     * @returns Array of current OAuth scopes
     */
    async getScopes(): Promise<StravaScope[]> {
        const token = await this.tokenStore.get();
        if (!token || !token.scope) {
            return [];
        }
        return parseScopes(token.scope);
    }

    /**
     * Clear stored tokens
     */
    async clearTokens(): Promise<void> {
        await this.tokenStore.clear();
    }
}
