import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

export class GoogleOAuthService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(GOOGLE_CLIENT_ID);
    }

    /**
     * Verify a Google token — supports both:
     *  - ID tokens (JWT, starts with eyJ…) → verified via verifyIdToken
     *  - Access tokens (OAuth2, starts with ya29…) → verified via Google userinfo endpoint
     * @param token - Google ID token or access token from client
     * @returns User profile information (email, name, picture)
     */
    async verifyGoogleToken(token: string) {
        try {
            // Access tokens from useGoogleLogin implicit flow start with "ya29."
            if (token.startsWith('ya29.') || !token.startsWith('eyJ')) {
                return await this.verifyAccessToken(token);
            }
            return await this.verifyIdToken(token);
        } catch (error) {
            throw new Error('Invalid Google token: ' + (error as Error).message);
        }
    }

    /** Verify an OAuth2 access token via Google's userinfo endpoint */
    private async verifyAccessToken(accessToken: string) {
        const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            throw new Error(`Userinfo request failed: ${response.status}`);
        }

        const info = await response.json() as {
            email?: string;
            name?: string;
            picture?: string;
            email_verified?: boolean;
        };

        if (!info.email) {
            throw new Error('No email returned from Google userinfo');
        }

        return {
            email: info.email,
            name: info.name || '',
            picture: info.picture || '',
            emailVerified: info.email_verified || false,
        };
    }

    /** Verify a Google ID token (JWT) */
    private async verifyIdToken(idToken: string) {
        const ticket = await this.client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error('Invalid token payload');

        return {
            email: payload.email || '',
            name: payload.name || '',
            picture: payload.picture || '',
            emailVerified: payload.email_verified || false,
        };
    }
}

export default new GoogleOAuthService();

