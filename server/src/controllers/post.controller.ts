import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { IPost } from '../types/dto';
import PostModel from '../models/post.model';
import fs from 'fs';
import path from 'path';

class PostController extends BaseController<IPost> {
    constructor() {
        super(PostModel);
    }

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) {
                res.status(400).json({ message: 'User ID is missing from request' });
                return;
            }

            const postData: Partial<IPost> = {
                ...req.body,
                owner: userId
            };

            // Handle image upload if present
            if (req.file) {
                // Store the relative path/URL
                postData.imgUrl = '/uploads/' + req.file.filename;
            }

            const item = await this.model.create(postData);
            res.status(201).send(item);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const post = await this.model.findById(id);
            
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            // Delete associated image file if exists
            if (post.imgUrl) {
                try {
                     // Get filename from URL
                    const filename = post.imgUrl.split('/').pop();
                    if (filename) {
                        const filePath = path.join(__dirname, '../../public/uploads', filename);
                        await fs.promises.unlink(filePath);
                    }
                } catch (err) {
                    console.error('Failed to delete image file:', err);
                }
            }

            await this.model.findByIdAndDelete(id);
            res.json({ message: 'Post deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }
}

export default new PostController();
