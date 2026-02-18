import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

export class GoogleOAuthService {
    private client: OAuth2Client;

    constructor() {
        this.client = new OAuth2Client(GOOGLE_CLIENT_ID);
    }

    /**
     * Verify Google ID token and extract user information
     * @param idToken - Google ID token from client
     * @returns User profile information (email, name, picture)
     */
    async verifyGoogleToken(idToken: string) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();

            if (!payload) {
                throw new Error('Invalid token payload');
            }

            // Extract user information from Google profile
            return {
                email: payload.email || '',
                name: payload.name || '',
                picture: payload.picture || '',
                emailVerified: payload.email_verified || false
            };
        } catch (error) {
            throw new Error('Invalid Google token: ' + (error as Error).message);
        }
    }
}

export default new GoogleOAuthService();
