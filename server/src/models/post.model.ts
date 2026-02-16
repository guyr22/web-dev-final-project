import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types/dto';

const postSchema = new Schema<IPost>({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    owner: {
        type: String, // Storing User ID as string/ObjectId string
        required: true
    },
    imgUrl: {
        type: String,
        required: false
    },
    likes: {
        type: [String],
        default: []
    }
}, { timestamps: true });

export default mongoose.model<IPost>('Post', postSchema);
