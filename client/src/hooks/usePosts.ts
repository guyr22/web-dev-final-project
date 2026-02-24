import { useState, useEffect, useCallback } from 'react';
import { IPost } from '../types';
import postService from '../services/post.service';

const POSTS_PER_PAGE = 5;

interface UsePostsResult {
    posts: IPost[];
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    isSearching: boolean;
    searchQuery: string;
    refreshPosts: () => Promise<void>;
    loadMore: () => Promise<void>;
    performSearch: (query: string) => Promise<void>;
    clearSearch: () => void;
}

const usePosts = (): UsePostsResult => {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        setIsSearching(false);
        setSearchQuery('');
        setPage(1);
        try {
            const { posts: data, totalCount } = await postService.getAllPosts(1, POSTS_PER_PAGE);
            setPosts(data);
            setHasMore(data.length < totalCount);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch posts');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || isSearching) return;

        const nextPage = page + 1;
        setLoadingMore(true);
        setError(null);
        try {
            const { posts: data } = await postService.getAllPosts(nextPage, POSTS_PER_PAGE);
            setPosts(prev => [...prev, ...data]);
            setPage(nextPage);
            if (data.length < POSTS_PER_PAGE) {
                setHasMore(false);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load more posts');
        } finally {
            setLoadingMore(false);
        }
    }, [page, loadingMore, hasMore, isSearching]);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            fetchPosts();
            return;
        }

        setLoading(true);
        setError(null);
        setIsSearching(true);
        setSearchQuery(query);
        setHasMore(false);
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
        fetchPosts();
    }, [fetchPosts]);

    return { 
        posts, 
        loading,
        loadingMore,
        error, 
        hasMore,
        isSearching, 
        searchQuery, 
        refreshPosts: fetchPosts,
        loadMore,
        performSearch,
        clearSearch
    };
};

export default usePosts;
