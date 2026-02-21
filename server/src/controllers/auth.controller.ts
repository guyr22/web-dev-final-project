import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { IAuthResponse } from '../types/dto';
import googleOAuthService from '../services/google-oauth.service';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key';
const ACCESS_TOKEN_EXPIRY = '1d';
const REFRESH_TOKEN_EXPIRY = '7d';

export class AuthController {
    /**
     * Register a new user
     * POST /auth/register
     * Body: { username, email, password }
     */
    async register(req: Request, res: Response) {
        try {
            const { username, email, password } = req.body;

            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'Username, email, and password are required' });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // Create new user (password will be hashed by pre-save hook)
            const user = await User.create({
                username,
                email,
                password
            });

            // Generate tokens
            const accessToken = jwt.sign(
                { _id: user._id, email: user.email, username: user.username },
                JWT_ACCESS_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            const refreshToken = jwt.sign(
                { _id: user._id },
                JWT_REFRESH_SECRET,
                { expiresIn: REFRESH_TOKEN_EXPIRY }
            );

            // Store refresh token in database
            user.refreshTokens = user.refreshTokens || [];
            user.refreshTokens.push(refreshToken);
            await user.save();

            // Prepare response
            const authResponse: IAuthResponse = {
                accessToken,
                refreshToken,
                user: {
                    _id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    imgUrl: user.imgUrl
                }
            };

            res.status(201).json(authResponse);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    /**
     * Login user
     * POST /auth/login
     * Body: { email, password }
     */
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate tokens
            const accessToken = jwt.sign(
                { _id: user._id, email: user.email, username: user.username },
                JWT_ACCESS_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            const refreshToken = jwt.sign(
                { _id: user._id },
                JWT_REFRESH_SECRET,
                { expiresIn: REFRESH_TOKEN_EXPIRY }
            );

            // Store refresh token
            user.refreshTokens = user.refreshTokens || [];
            user.refreshTokens.push(refreshToken);
            await user.save();

            // Prepare response
            const authResponse: IAuthResponse = {
                accessToken,
                refreshToken,
                user: {
                    _id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    imgUrl: user.imgUrl
                }
            };

            res.status(200).json(authResponse);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    /**
     * Refresh access token
     * POST /auth/refresh
     * Body: { refreshToken }
     */
    async refresh(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ message: 'Refresh token is required' });
            }

            // Verify refresh token
            let decoded: any;
            try {
                decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            } catch (error) {
                return res.status(401).json({ message: 'Invalid or expired refresh token' });
            }

            // Find user and check if refresh token exists
            const user = await User.findById(decoded._id);
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            // Generate new access token
            const accessToken = jwt.sign(
                { _id: user._id, email: user.email, username: user.username },
                JWT_ACCESS_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            res.status(200).json({ accessToken });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    /**
     * Logout user
     * POST /auth/logout
     * Body: { refreshToken }
     */
    async logout(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ message: 'Refresh token is required' });
            }

            // Verify refresh token
            let decoded: any;
            try {
                decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            } catch (error) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            // Find user and remove refresh token
            const user = await User.findById(decoded._id);
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Remove the specific refresh token
            user.refreshTokens = (user.refreshTokens || []).filter(token => token !== refreshToken);
            await user.save();

            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    /**
     * Google OAuth login
     * POST /auth/google
     * Body: { idToken }
     */
    async googleLogin(req: Request, res: Response) {
        try {
            const { idToken } = req.body;

            // Validate input
            if (!idToken) {
                return res.status(400).json({ message: 'Google ID token is required' });
            }

            // Verify Google token and get user info
            const googleUser = await googleOAuthService.verifyGoogleToken(idToken);

            if (!googleUser.email) {
                return res.status(400).json({ message: 'Unable to retrieve email from Google' });
            }

            // Check if user already exists
            let user = await User.findOne({ email: googleUser.email });

            if (!user) {
                // Create new user if doesn't exist
                // Generate a random password for Google users (they won't use it)
                const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                user = await User.create({
                    username: googleUser.name || googleUser.email.split('@')[0],
                    email: googleUser.email,
                    password: randomPassword,
                    imgUrl: googleUser.picture
                });
            }

            // Generate tokens
            const accessToken = jwt.sign(
                { _id: user._id, email: user.email, username: user.username },
                JWT_ACCESS_SECRET,
                { expiresIn: ACCESS_TOKEN_EXPIRY }
            );

            const refreshToken = jwt.sign(
                { _id: user._id },
                JWT_REFRESH_SECRET,
                { expiresIn: REFRESH_TOKEN_EXPIRY }
            );

            // Store refresh token
            user.refreshTokens = user.refreshTokens || [];
            user.refreshTokens.push(refreshToken);
            await user.save();

            // Prepare response
            const authResponse: IAuthResponse = {
                accessToken,
                refreshToken,
                user: {
                    _id: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    imgUrl: user.imgUrl
                }
            };

            res.status(200).json(authResponse);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }
}

export default new AuthController();
