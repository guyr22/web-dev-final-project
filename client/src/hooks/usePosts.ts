import { useState, useEffect, useCallback } from 'react';
import { IPost } from '../types';
import postService from '../services/post.service';

interface UsePostsResult {
    posts: IPost[];
    loading: boolean;
    error: string | null;
    isSearching: boolean;
    searchQuery: string;
    refreshPosts: () => Promise<void>;
    performSearch: (query: string) => Promise<void>;
    clearSearch: () => void;
}

const usePosts = (): UsePostsResult => {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        setIsSearching(false);
        setSearchQuery('');
        try {
            const data = await postService.getAllPosts();
            setPosts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    }, []);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            fetchPosts();
            return;
        }

        setLoading(true);
        setError(null);
        setIsSearching(true);
        setSearchQuery(query);
        try {
            const data = await postService.searchPosts(query);
            setPosts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to search posts');
        } finally {
            setLoading(false);
        }
    }, [fetchPosts]);

    const clearSearch = useCallback(() => {
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        // Initial load
        fetchPosts();
    }, [fetchPosts]);

    return { 
        posts, 
        loading, 
        error, 
        isSearching, 
        searchQuery, 
        refreshPosts: fetchPosts,
        performSearch,
        clearSearch
    };
};

export default usePosts;
