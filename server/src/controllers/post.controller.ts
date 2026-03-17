import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { IPost } from '../types/dto';
import PostModel from '../models/post.model';
import AIService from '../services/ai.service';
import fs from 'fs';
import path from 'path';
import { cosineSimilarity } from '../utils/math';

class PostController extends BaseController<IPost> {
    constructor() {
        super(PostModel);
    }

    async getAll(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const totalCount = await this.model.countDocuments();
            const items = await this.model
                .find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('owner', 'username imgUrl')
                .populate('comments.userId', 'username imgUrl');

            res.set('X-Total-Count', totalCount.toString());
            res.send(items);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async searchPosts(req: Request, res: Response) {
        try {
            const freeText = req.query.q as string;
            if (!freeText) {
                return res.status(400).json({ message: 'Search query "q" is required' });
            }

            const queryEmbedding = await AIService.generateEmbedding(freeText);
            
            if (!queryEmbedding || queryEmbedding.length === 0) {
                 return res.status(500).json({ message: 'Failed to generate search embedding' });
            }

            const allPosts = await this.model.find({ embedding: { $exists: true, $ne: [] } })
                .populate('owner', 'username imgUrl')
                .populate('comments.userId', 'username imgUrl');

            const postsWithScores = allPosts.map(post => {
                const score = cosineSimilarity(queryEmbedding, post.embedding || []);
                return { post, score };
            });

            postsWithScores.sort((a, b) => b.score - a.score);
            const topResults = postsWithScores.slice(0, 5).map(item => item.post);

            res.status(200).json(topResults);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async getByUser(req: Request, res: Response) {
        try {
            const userId = req.params.userId;
            const items = await this.model
                .find({ owner: userId })
                .sort({ createdAt: -1 })
                .populate('owner', 'username imgUrl')
                .populate('comments.userId', 'username imgUrl');

            res.status(200).json(items);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const item = await this.model.findById(id)
                .populate('owner', 'username imgUrl')
                .populate('comments.userId', 'username imgUrl');

            if (!item) {
                return res.status(404).json({ message: 'Post not found' });
            }

            res.status(200).json(item);
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
            const title = req.body.title;
            let tags: string[] = [];
            let embedding: number[] = [];

            // Generate tags and embedding using AI Service
            const textToAnalyze = `${title || ''} ${content || ''}`.trim();
            if (textToAnalyze) {
                tags = await AIService.generateTags(textToAnalyze);
                embedding = await AIService.generateEmbedding(textToAnalyze);
            }

            const postData: Partial<IPost> = {
                ...req.body,
                owner: userId,
                tags: tags,
                embedding: embedding
            };

            // Handle image upload if present
            if (req.file) {
                // Store the relative path/URL
                postData.imgUrl = '/uploads/' + req.file.filename;
            }

            const item = await this.model.create(postData);
            await item.populate('owner', 'username imgUrl');
            if (item.comments && item.comments.length > 0) {
                await item.populate('comments.userId', 'username imgUrl');
            }
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

            const userId = (req as any).user?._id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const postOwnerId = post.owner.toString();
            if (postOwnerId !== userId.toString()) {
                return res.status(403).json({ message: 'You are not authorized to update this post' });
            }

            const updateData: Partial<IPost> = { ...req.body };

            if (req.body.content || req.body.title) {
                const textToAnalyze = `${req.body.title || post.title || ''} ${req.body.content || post.content || ''}`.trim();
                updateData.tags = await AIService.generateTags(textToAnalyze);
                updateData.embedding = await AIService.generateEmbedding(textToAnalyze);
            }

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

            const updatedPost = await this.model.findByIdAndUpdate(id, updateData, { new: true })
                .populate('owner', 'username imgUrl')
                .populate('comments.userId', 'username imgUrl');
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

            const userId = (req as any).user?._id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const postOwnerId = post.owner.toString();
            if (postOwnerId !== userId.toString()) {
                return res.status(403).json({ message: 'You are not authorized to delete this post' });
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
            )
                .populate('owner', 'username imgUrl')
                .populate('comments.userId', 'username imgUrl');

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
