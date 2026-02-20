import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { IPost } from '../types/dto';
import PostModel from '../models/post.model';
import AIService from '../services/ai.service';
import fs from 'fs';
import path from 'path';

class PostController extends BaseController<IPost> {
    constructor() {
        super(PostModel);
    }

    async getAll(req: Request, res: Response) {
        try {
            const filter = req.query;
            const items = await this.model.find(filter).populate('owner', 'username imgUrl');
            res.send(items);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user?._id;
            if (!userId) {
                res.status(400).json({ message: 'User ID is missing from request' });
                return;
            }

            const content = req.body.content;
            let tags: string[] = [];
            
            // Generate tags using AI Service
            if (content) {
                tags = await AIService.generateTags(content);
            }

            const postData: Partial<IPost> = {
                ...req.body,
                owner: userId,
                tags: tags
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

    async update(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const post = await this.model.findById(id);

            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const updateData: Partial<IPost> = { ...req.body };

            // Handle new image upload
            if (req.file) {
                // Delete old image if it exists
                if (post.imgUrl) {
                    try {
                        const filename = post.imgUrl.split('/').pop();
                        if (filename) {
                            const filePath = path.join(__dirname, '../../public/uploads', filename);
                            await fs.promises.unlink(filePath);
                        }
                    } catch (err) {
                        console.error('Failed to delete old image file:', err);
                    }
                }
                updateData.imgUrl = '/uploads/' + req.file.filename;
            }

            const updatedPost = await this.model.findByIdAndUpdate(id, updateData, { new: true });
            res.json(updatedPost);
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

    async likePost(req: Request, res: Response) {
        try {
            const postId = req.params.id;
            const userId = (req as any).user._id;

            const post = await this.model.findById(postId);
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            // Check if user already liked the post
            const isLiked = post.likes && post.likes.includes(userId);
            
            let updatedPost;
            if (isLiked) {
                // Unlike
                updatedPost = await this.model.findByIdAndUpdate(
                    postId,
                    { $pull: { likes: userId } },
                    { new: true }
                );
            } else {
                // Like
                updatedPost = await this.model.findByIdAndUpdate(
                    postId,
                    { $addToSet: { likes: userId } },
                    { new: true }
                );
            }

            res.json({ 
                likes: updatedPost?.likes?.length || 0,
                isLiked: !isLiked 
            });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async addComment(req: Request, res: Response) {
        try {
            const postId = req.params.id;
            const userId = (req as any).user._id;
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({ message: 'Comment content is required' });
            }

            const comment = {
                userId,
                content,
                createdAt: new Date()
            };

            const updatedPost = await this.model.findByIdAndUpdate(
                postId,
                { $push: { comments: comment } },
                { new: true }
            );

            if (!updatedPost) {
                return res.status(404).json({ message: 'Post not found' });
            }

            res.status(201).json(updatedPost);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }
}

export default new PostController();
