import { useState, useEffect, useCallback } from 'react';
import { IPost } from '../types';
import postService from '../services/post.service';

interface UsePostsResult {
    posts: IPost[];
    loading: boolean;
    error: string | null;
    refreshPosts: () => Promise<void>;
}

const usePosts = (): UsePostsResult => {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await postService.getAllPosts();
            setPosts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    return { posts, loading, error, refreshPosts: fetchPosts };
};

export default usePosts;
