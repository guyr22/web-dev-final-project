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
            { userId: 'user2', content: 'Looks incredible!', createdAt: new Date().toISOString() }
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
             { userId: 'user1', content: 'Save me a slice!', createdAt: new Date().toISOString() }
        ]
    }
];

export const getAllPosts = async (): Promise<IPost[]> => {
    // return mock data
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(MOCK_POSTS);
        }, 500);
    });

    /* 
    // Real API call
    try {
        const response = await api.get<IPost[]>('/posts');
        // Transform image URLs to be absolute if they are relative
        const posts = response.data.map(post => ({
            ...post,
            imgUrl: post.imgUrl && !post.imgUrl.startsWith('http') 
                ? `${import.meta.env.VITE_API_URL}${post.imgUrl}` 
                : post.imgUrl
        }));
        return posts;
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
    */
};

const postService = {
    getAllPosts,
};

export default postService;
