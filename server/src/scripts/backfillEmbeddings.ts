import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PostModel from '../models/post.model';
import AIService from '../services/ai.service';
import path from 'path';

// Load environment variables from the server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const backfillEmbeddings = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to MongoDB.');

        // Find posts where embedding is missing or empty array
        const postsToProcess = await PostModel.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: { $size: 0 } }
            ]
        });

        console.log(`Found ${postsToProcess.length} posts to backfill.`);

        for (const post of postsToProcess) {
            console.log(`Generating embedding for post ID: ${post._id}`);
            if (post.content) {
                const embedding = await AIService.generateEmbedding(post.content);
                if (embedding && embedding.length > 0) {
                    post.embedding = embedding;
                    await post.save();
                    console.log(`  -> Successfully updated embedding for post ${post._id}`);
                } else {
                    console.log(`  -> Failed to generate embedding (returned empty).`);
                }
            } else {
                console.log(`  -> Skipped (no content).`);
            }
        }

        console.log('Backfill process completed successfully.');
    } catch (error) {
        console.error('Error during backfill process:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
};

backfillEmbeddings();
