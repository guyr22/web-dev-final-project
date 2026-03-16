import { Request, Response } from 'express';
import { User } from '../models/user.model';

export class UserController {
    /**
     * GET /user/profile
     * Returns the authenticated user's profile details
     */
    async getProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user._id;

            const user = await User.findById(userId).select('-password -refreshTokens');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                imgUrl: user.imgUrl,
                bio: user.bio
            });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    /**
     * PUT /user/profile
     * Updates the authenticated user's avatar (imgUrl), bio, and/or username.
     * Accepts optional multipart file upload for avatar.
     */
    async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user._id;

            const updateData: { imgUrl?: string; bio?: string; username?: string } = {};

            // Handle username update
            if (req.body.username !== undefined) {
                const newUsername: string = req.body.username.trim();
                if (newUsername.length < 3) {
                    return res.status(400).json({ message: 'Username must be at least 3 characters long' });
                }
                // Check for duplicates (exclude current user)
                const existing = await User.findOne({ username: newUsername, _id: { $ne: userId } });
                if (existing) {
                    return res.status(409).json({ message: 'Username is already taken' });
                }
                updateData.username = newUsername;
            }

            // If a file was uploaded, set the imgUrl to the file path
            if ((req as any).file) {
                updateData.imgUrl = `/uploads/${(req as any).file.filename}`;
            } else if (req.body.imgUrl !== undefined) {
                updateData.imgUrl = req.body.imgUrl;
            }

            if (req.body.bio !== undefined) {
                updateData.bio = req.body.bio;
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password -refreshTokens');

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                imgUrl: updatedUser.imgUrl,
                bio: updatedUser.bio
            });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }
}

export default new UserController();
