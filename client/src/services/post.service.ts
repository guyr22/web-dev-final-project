import api from './api';
import { IPost } from '../types';

export interface PaginatedPostsResult {
    posts: IPost[];
    totalCount: number;
}

export const getAllPosts = async (page: number = 1, limit: number = 10): Promise<PaginatedPostsResult> => {
    try {
        const response = await api.get<IPost[]>('/posts', {
            params: { page, limit },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        const totalCount = parseInt(response.headers['x-total-count'] || '0');
        // Transform image URLs to be absolute if they are relative
        const posts = response.data.map(post => ({
            ...post,
            imgUrl: post.imgUrl && !post.imgUrl.startsWith('http') 
                ? `${import.meta.env.VITE_API_URL}${post.imgUrl}` 
                : post.imgUrl
        }));
        return { posts, totalCount };
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};

export const createPost = async (formData: FormData): Promise<IPost> => {
    try {
        const response = await api.post<IPost>('/posts', formData, {
            headers: {
                // Axios will automatically set the correct Content-Type with the boundary
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
}

export const deletePost = async (postId: string): Promise<void> => {
    try {
        await api.delete(`/posts/${postId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}

export const updatePost = async (postId: string, formData: FormData): Promise<IPost> => {
    try {
        const response = await api.put<IPost>(`/posts/${postId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
}

export const searchPosts = async (query: string): Promise<IPost[]> => {
    try {
        const response = await api.get<IPost[]>(`/posts/search?q=${encodeURIComponent(query)}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
        });
        const posts = response.data.map(post => ({
            ...post,
            imgUrl: post.imgUrl && !post.imgUrl.startsWith('http') 
                ? `${import.meta.env.VITE_API_URL}${post.imgUrl}` 
                : post.imgUrl
        })).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        return posts;
    } catch (error) {
        console.error("Error searching posts:", error);
        throw error;
    }
};

const postService = {
    getAllPosts,
    createPost,
    deletePost,
    updatePost,
    searchPosts,
};

export default postService;
