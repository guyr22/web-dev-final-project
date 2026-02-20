import api from './api';
import { IPost } from '../types';

const MOCK_POSTS: IPost[] = [
    {
        _id: '1',
        title: 'Exploring the Mountains',
        content: 'Just got back from an amazing hike in the Alps. The views were breathtaking!',
        owner: 'user123',
        imgUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        likes: ['user2', 'user3'],
        tags: ['nature', 'hiking', 'travel'],
        comments: [
            { userId: 'user2', content: 'Looks incredible!', createdAt: new Date() }
        ]
    },
    {
        _id: '2',
        title: 'New Project Launch',
        content: 'Excited to share that our new app is finally live. Check it out!',
        owner: 'dev_guru',
        likes: ['user1', 'user4', 'user5'],
        tags: ['coding', 'launch', 'startup'],
        comments: []
    },
    {
        _id: '3',
        title: 'Delicious Homemade Pizza',
        content: 'Tried a new recipe for pizza dough. It turned out perfect!',
        owner: 'chef_mario',
        imgUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        likes: ['user1'],
        tags: ['food', 'pizza', 'cooking'],
        comments: [
             { userId: 'user1', content: 'Save me a slice!', createdAt: new Date() }
        ]
    }
];

export const getAllPosts = async (): Promise<IPost[]> => {
    // return mock data
    // return new Promise((resolve) => {
    //     setTimeout(() => {
    //         resolve(MOCK_POSTS);
    //     }, 500);
    // });

    // Real API call
    try {
        const response = await api.get<IPost[]>('/posts', {
            headers: {
                Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTkzNTljMTU0ZGM5NzE5MTA1MTEwOTAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJpYXQiOjE3NzE2MjQwNjAsImV4cCI6MTc3MTcxMDQ2MH0.4y1WGaTq5I4GXtU89VEWz01q-UyFd7-J-lhxleWjtvc"
            }
        });
        // Transform image URLs to be absolute if they are relative
        const posts = response.data.map(post => ({
            ...post,
            imgUrl: post.imgUrl && !post.imgUrl.startsWith('http') 
                ? `${import.meta.env.VITE_API_URL}${post.imgUrl}` 
                : post.imgUrl
        })).sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // descending order (newer first)
        });
        return posts;
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
                Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTkzNTljMTU0ZGM5NzE5MTA1MTEwOTAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJpYXQiOjE3NzE2MjQwNjAsImV4cCI6MTc3MTcxMDQ2MH0.4y1WGaTq5I4GXtU89VEWz01q-UyFd7-J-lhxleWjtvc"
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
                Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTkzNTljMTU0ZGM5NzE5MTA1MTEwOTAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJpYXQiOjE3NzE2MjAwMjksImV4cCI6MTc3MTYyMzYyOX0.kA5sTL7yFTttlX3yghEdeeuhmoieaAa4yZNdbwfn2us"
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
                Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OTkzNTljMTU0ZGM5NzE5MTA1MTEwOTAiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImpvaG5kb2UiLCJpYXQiOjE3NzE2MjAwMjksImV4cCI6MTc3MTYyMzYyOX0.kA5sTL7yFTttlX3yghEdeeuhmoieaAa4yZNdbwfn2us"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
}

const postService = {
    getAllPosts,
    createPost,
    deletePost,
    updatePost,
};

export default postService;
