import { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Card, Button, Form } from 'react-bootstrap';
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
        <Container className="py-4" style={{ maxWidth: '600px' }}>
            <Button variant="outline-secondary" className="mb-4 fw-semibold rounded-3 shadow-sm" onClick={() => navigate('/feed')}>
                &larr; Back to Feed
            </Button>

            <Card className="border-0 shadow rounded-4 overflow-hidden mb-4">
                {post.imgUrl && (
                    <Card.Img
                        variant="top"
                        src={post.imgUrl}
                        alt={post.title}
                        style={{ height: '260px', objectFit: 'cover' }}
                    />
                )}
                <Card.Body className="px-4 py-3">
                    <Card.Title className="fw-bold fs-5">{post.title}</Card.Title>
                    <div className="d-flex align-items-center mb-2">
                        {typeof post.owner === 'object' && post.owner !== null && (
                            post.owner.imgUrl ? (
                                <img
                                    src={getImageUrl(post.owner.imgUrl)}
                                    alt={post.owner.username}
                                    className="rounded-circle me-2 object-fit-cover shadow-sm bg-white"
                                    style={{ width: '28px', height: '28px' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle me-2 d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        fontSize: '12px',
                                        background: 'linear-gradient(135deg, #6366f1, #ec4899)'
                                    }}
                                >
                                    {getInitials(post.owner.username)}
                                </div>
                            )
                        )}
                        <p className="text-secondary small fw-semibold mb-0">
                            {typeof post.owner === 'object' && post.owner !== null ? post.owner.username : post.owner}
                        </p>
                    </div>
                    <Card.Text className="text-body-secondary mb-0">
                        {post.content}
                    </Card.Text>
                </Card.Body>
            </Card>

            <Card className="border-0 shadow rounded-4 overflow-hidden">
                <Card.Header className="bg-white border-bottom px-4 py-3">
                    <h5 className="mb-0 fw-bold">Comments</h5>
                </Card.Header>
                <Card.Body className="px-4 py-3 bg-light">
                    {post.comments && post.comments.length > 0 ? (
                        <ul className="list-unstyled mb-0">
                            {post.comments.map((comment, idx) => (
                                <li key={idx} className="mb-3 pb-3 border-bottom border-light-subtle">
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <div className="fw-semibold small text-primary">
                                            {typeof comment.userId === 'object' && comment.userId !== null
                                                ? (comment.userId as any).username
                                                : (comment.userId as string)}
                                        </div>
                                        {comment.createdAt && (
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </small>
                                        )}
                                    </div>
                                    <div className="text-secondary small">{comment.content}</div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted small mb-0 text-center py-3">No comments yet. Be the first to start the conversation!</p>
                    )}
                </Card.Body>
                <Card.Footer className="bg-white border-top px-4 py-3">
                    <div className="d-flex gap-2">
                        <Form.Control
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment();
                            }}
                            disabled={isSubmittingComment}
                            className="shadow-sm border-light-subtle"
                        />
                        <Button
                            variant="primary"
                            className="px-4 shadow-sm fw-semibold"
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || isSubmittingComment}
                        >
                            {isSubmittingComment ? (
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            ) : (
                                'Post'
                            )}
                        </Button>
                    </div>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default CommentsPage;
