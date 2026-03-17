import { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import postService from '../services/post.service';
import { IPost } from '../types';

const getInitials = (username: string): string => {
    if (!username) return '*';
    return username
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
};

const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (/^(https?:\/\/|data:)/.test(url)) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const CommentsPage = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<IPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            try {
                const data = await postService.getPostById(postId);
                setPost(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load post');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId]);

    const handleAddComment = async () => {
        if (!post?._id || !newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            const updatedPost = await postService.addComment(post._id, newComment);
            setPost(updatedPost);
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error || !post) {
        return (
            <Container className="mt-5" style={{ maxWidth: '600px' }}>
                <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/feed')}>
                    &larr; Back to Feed
                </Button>
                <Alert variant="danger">
                    Error loading post: {error || 'Post not found'}
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5" style={{ maxWidth: '640px' }}>
            <Button 
                variant="link" 
                className="mb-4 text-primary fw-bold text-decoration-none d-flex align-items-center gap-2 p-0" 
                onClick={() => navigate('/feed')}
            >
                <span style={{ fontSize: '1.2rem' }}>&larr;</span>
                <span>Back to Moments</span>
            </Button>

            <article className="glass-card rounded-4 border-0 overflow-hidden mb-5">
                {post.imgUrl && (
                    <div className="position-relative overflow-hidden" style={{ maxHeight: '300px' }}>
                        <img
                            src={post.imgUrl}
                            alt={post.title}
                            className="w-100 object-fit-cover"
                        />
                         <div className="position-absolute bottom-0 start-0 w-100 p-4" style={{ background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent)' }}>
                             <h3 className="fw-bold fs-5 text-white mb-0">{post.title}</h3>
                        </div>
                    </div>
                )}
                <div className="p-4">
                    {!post.imgUrl && <h3 className="fw-bold fs-5 text-white mb-3 text-gradient">{post.title}</h3>}
                    <div className="d-flex align-items-center mb-3">
                        {typeof post.owner === 'object' && post.owner !== null && (
                            post.owner.imgUrl ? (
                                <img
                                    src={getImageUrl(post.owner.imgUrl)}
                                    alt={post.owner.username}
                                    className="rounded-circle me-3 object-fit-cover border border-2 border-white border-opacity-10"
                                    style={{ width: '32px', height: '32px' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle me-3 d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        fontSize: '10px',
                                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))'
                                    }}
                                >
                                    {getInitials(post.owner.username)}
                                </div>
                            )
                        )}
                        <p className="text-white fw-bold small mb-0 opacity-75">
                            {typeof post.owner === 'object' && post.owner !== null ? post.owner.username : post.owner}
                        </p>
                    </div>
                    <p className="text-muted mb-0 small" style={{ lineHeight: '1.6' }}>
                        {post.content}
                    </p>
                </div>
            </article>

            <section className="glass-card rounded-4 border-0 overflow-hidden">
                <div className="px-4 py-3 border-bottom border-white border-opacity-10">
                    <h5 className="mb-0 fw-bold text-white">Conversation</h5>
                </div>
                <div className="p-4" style={{ minHeight: '120px' }}>
                    {post.comments && post.comments.length > 0 ? (
                        <div className="d-flex flex-column gap-4">
                            {post.comments.map((comment, idx) => (
                                <div key={idx} className="d-flex gap-3">
                                    <div 
                                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shrink-0"
                                        style={{ 
                                            width: '32px', 
                                            height: '32px', 
                                            fontSize: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        {getInitials(typeof comment.userId === 'object' && comment.userId !== null ? (comment.userId as any).username : '')}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="fw-bold text-primary small">
                                                {typeof comment.userId === 'object' && comment.userId !== null
                                                    ? (comment.userId as any).username
                                                    : (comment.userId as string)}
                                            </span>
                                            {comment.createdAt && (
                                                <span className="text-muted fw-medium" style={{ fontSize: '0.65rem' }}>
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-muted small" style={{ lineHeight: '1.5' }}>{comment.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <span className="d-block fs-2 mb-2">💬</span>
                            <p className="text-muted small mb-0">No one has started the mystery yet. Speak up!</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-dark bg-opacity-25 border-top border-white border-opacity-10">
                    <div className="d-flex flex-column gap-2">
                        <div className="d-flex gap-3">
                            <Form.Control
                                type="text"
                                placeholder="Share your thoughts..."
                                maxLength={300}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddComment();
                                }}
                                disabled={isSubmittingComment}
                                className="bg-white bg-opacity-5 border-white border-opacity-10 text-white shadow-none py-2 px-3 focus-primary"
                            />
                            <Button
                                className="btn-premium px-4"
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || isSubmittingComment}
                            >
                                {isSubmittingComment ? (
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                ) : (
                                    'Send'
                                )}
                            </Button>
                        </div>
                        <div className="d-flex justify-content-end px-2">
                            <span className={`small ${newComment.length >= 280 ? 'text-accent' : 'text-muted opacity-50'}`} style={{ fontSize: '0.7rem' }}>
                                {newComment.length}/300
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </Container>
    );
};

export default CommentsPage;
