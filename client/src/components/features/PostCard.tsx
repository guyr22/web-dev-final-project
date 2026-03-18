import { useState } from 'react';
import { Button, Modal, Spinner, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { IPost } from '../../types';
import postService from '../../services/post.service';
import { useAuth } from '../../context/AuthContext';

interface PostCardProps {
    post: IPost;
    onPostDeleted?: () => void;
    onPostUpdated?: () => void;
}

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

const PostCard = ({ post, onPostDeleted, onPostUpdated }: PostCardProps) => {
    const { user } = useAuth();

    const currentUserId = user?._id || '';
    const initialLiked = post.likes ? post.likes.includes(currentUserId) : false;
    const initialLikesCount = post.likes?.length || 0;

    const isOwner = currentUserId && (
        typeof post.owner === 'object' && post.owner !== null
            ? post.owner._id === currentUserId
            : post.owner === currentUserId
    );

    const [isLiked, setIsLiked] = useState<boolean>(initialLiked);
    const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title);
    const [editContent, setEditContent] = useState(post.content);
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(post.imgUrl || null);

    const handleLikeClick = async () => {
        if (!post._id) return;

        setIsLiked(prev => !prev);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            await postService.likePost(post._id);
        } catch (error) {
            console.error('Failed to toggle like', error);
            setIsLiked(initialLiked);
            setLikesCount(initialLikesCount);
        }
    };

    const handleClose = () => setShowDeleteModal(false);
    const handleShow = () => setShowDeleteModal(true);

    const handleEditClose = () => {
        setShowEditModal(false);
        setEditFile(null);
        setEditPreviewUrl(post.imgUrl || null);
    };
    const handleEditShow = () => {
        setEditTitle(post.title);
        setEditContent(post.content);
        setEditFile(null);
        setEditPreviewUrl(post.imgUrl || null);
        setShowEditModal(true);
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setEditFile(file);
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setEditPreviewUrl(url);
        }
    };

    const handleDelete = async () => {
        if (!post._id) return;

        setIsDeleting(true);
        try {
            await postService.deletePost(post._id);
            handleClose();
            if (onPostDeleted) {
                onPostDeleted();
            }
        } catch (error) {
            console.error('Failed to delete post', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdate = async () => {
        if (!post._id) return;

        setIsUpdating(true);
        try {
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('content', editContent);
            if (editFile) {
                formData.append('image', editFile);
            }

            await postService.updatePost(post._id, formData);
            handleEditClose();
            if (onPostUpdated) {
                onPostUpdated();
            }
        } catch (error) {
            console.error('Failed to update post', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <>
            <article className="glass-card rounded-4 border-0 overflow-hidden position-relative transition-all hover-translate-y">
                {isOwner && (
                    <div className="position-absolute d-flex gap-2" style={{ top: '16px', right: '16px', zIndex: 10 }}>
                        <button
                            type="button"
                            className="btn btn-sm glass-card border-white border-opacity-10 rounded-circle p-2 shadow-sm transition-all hover-scale"
                            style={{ width: '36px', height: '36px', backdropFilter: 'blur(8px)' }}
                            onClick={handleEditShow}
                            title="Edit Moment"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm glass-card border-white border-opacity-10 text-danger rounded-circle p-2 shadow-sm transition-all hover-scale"
                            style={{ width: '36px', height: '36px', backdropFilter: 'blur(8px)' }}
                            onClick={handleShow}
                            title="Delete Moment"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                    </div>
                )}
                
                {post.imgUrl && (
                    <div className="position-relative overflow-hidden" style={{ maxHeight: '420px' }}>
                        <img
                            src={post.imgUrl}
                            alt={post.title}
                            className="w-100 object-fit-cover"
                            style={{ minHeight: '300px' }}
                        />
                        <div className="position-absolute bottom-0 start-0 w-100 p-4" style={{ background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8), transparent)' }}>
                             <h3 className="fw-bold fs-4 text-white mb-0 text-gradient">{post.title}</h3>
                        </div>
                    </div>
                )}

                <div className="p-4">
                    {!post.imgUrl && <h3 className="fw-bold fs-4 text-white mb-3 text-gradient">{post.title}</h3>}
                    
                    <div className="d-flex align-items-center mb-3">
                        {typeof post.owner === 'object' && post.owner !== null && (
                            post.owner.imgUrl ? (
                                <img
                                    src={getImageUrl(post.owner.imgUrl)}
                                    alt={post.owner.username}
                                    className="rounded-circle me-3 object-fit-cover shadow-sm border border-2 border-white border-opacity-10"
                                    style={{ width: '40px', height: '40px' }}
                                />
                            ) : (
                                <div
                                    className="rounded-circle me-3 d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        fontSize: '14px',
                                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))'
                                    }}
                                >
                                    {getInitials(post.owner.username)}
                                </div>
                            )
                        )}
                        <div>
                            <p className="text-white fw-bold mb-0" style={{ fontSize: '0.95rem' }}>
                                {typeof post.owner === 'object' && post.owner !== null ? post.owner.username : post.owner}
                            </p>
                        </div>
                    </div>

                    <p className="text-muted mb-4 lead" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                        {post.content}
                    </p>

                    {post.tags && post.tags.length > 0 && (
                        <div className="d-flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="badge rounded-pill px-3 py-2"
                                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center pt-4 border-top border-white border-opacity-10">
                        <div className="d-flex gap-4">
                            <button
                                onClick={handleLikeClick}
                                className="btn p-0 d-flex align-items-center gap-2 text-decoration-none transition-all"
                                style={{ color: isLiked ? 'var(--accent)' : 'var(--text-muted)' }}
                            >
                                <span style={{ fontSize: '1.4rem' }}>{isLiked ? '❤️' : '🤍'}</span>
                                <span className="fw-bold small">{likesCount}</span>
                            </button>
                            <Link
                                to={`/posts/${post._id}/comments`}
                                className="btn p-0 d-flex align-items-center gap-2 text-decoration-none"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <span style={{ fontSize: '1.4rem' }}>💬</span>
                                <span className="fw-bold small">{post.comments?.length || 0}</span>
                            </Link>
                        </div>
                        
                        <span className="text-muted small fw-medium">
                            {post.comments?.length || 0} Comments
                        </span>
                    </div>
                </div>
            </article>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={handleClose} centered contentClassName="glass-card border-0">
                <Modal.Header closeButton closeVariant="white" className="border-0 pb-0 pt-4 px-4">
                    <Modal.Title className="fw-bold text-white fs-4">Delete Moment</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-3">
                    <p className="text-white opacity-75 mb-0">
                        Are you sure you want to delete <span className="text-white fw-bold">"{post.title}"</span>? This action is permanent and cannot be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4 gap-2">
                    <Button 
                        variant="link" 
                        onClick={handleClose} 
                        disabled={isDeleting}
                        className="text-muted text-decoration-none fw-bold small"
                    >
                        Keep Moment
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleDelete} 
                        disabled={isDeleting}
                        className="rounded-3 fw-bold px-4"
                    >
                        {isDeleting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Removing...
                            </>
                        ) : (
                            'Delete Forever'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Post Modal */}
            <Modal show={showEditModal} onHide={handleEditClose} size="lg" centered contentClassName="glass-card border-0 overflow-hidden">
                <Modal.Body className="p-0">
                    <div className="position-relative">
                        {/* Hero Image Section */}
                        <div 
                            className="position-relative w-100 bg-dark" 
                            style={{ height: '320px', cursor: 'pointer' }}
                            onClick={() => document.getElementById(`edit-image-${post._id}`)?.click()}
                        >
                            {editPreviewUrl ? (
                                <>
                                    <img
                                        src={editPreviewUrl}
                                        alt="Current"
                                        className="w-100 h-100 object-fit-cover"
                                    />
                                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-30 d-flex flex-column align-items-center justify-content-center opacity-0 hover-opacity-100 transition-all">
                                        <div className="bg-white bg-opacity-20 rounded-circle p-3 mb-2" style={{ backdropFilter: 'blur(8px)' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                        </div>
                                        <span className="text-white fw-bold">Update Cover Image</span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-5">
                                    <div className="text-primary mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                    </div>
                                    <span className="text-white opacity-50 fw-bold">Select a Moment Cover</span>
                                </div>
                            )}
                            
                            <div className="position-absolute top-0 start-0 w-100 p-4 d-flex justify-content-between align-items-start" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
                                <h4 className="text-white fw-bold mb-0">Refine Moment</h4>
                                <button 
                                    className="btn-close btn-close-white opacity-50 hover-opacity-100 transition-all shadow-none" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClose();
                                    }}
                                ></button>
                            </div>
                        </div>

                        <div className="p-4 p-md-5">
                            <Form>
                                <Form.Group className="mb-4">
                                    <Form.Control
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Give your moment a title..."
                                        className="bg-transparent border-0 border-bottom border-white border-opacity-10 text-white rounded-0 px-0 py-2 fs-3 fw-bold shadow-none focus-primary"
                                        style={{ borderBottomWidth: '2px !important' }}
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-5">
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        placeholder="Share the story behind this moment..."
                                        className="bg-transparent border-0 text-white rounded-0 px-0 fs-5 shadow-none focus-primary"
                                        style={{ resize: 'none' }}
                                    />
                                </Form.Group>

                                <div className="d-flex align-items-center justify-content-end w-100">
                                    <div className="d-flex gap-3">
                                        <Button 
                                            variant="link" 
                                            onClick={handleEditClose} 
                                            disabled={isUpdating}
                                            className="text-muted text-decoration-none fw-bold small transition-all hover-white"
                                        >
                                            Discard Changes
                                        </Button>
                                        <Button 
                                            onClick={handleUpdate} 
                                            disabled={isUpdating || !editTitle.trim()}
                                            className="btn-premium rounded-pill px-5 py-2 shadow-lg hover-scale"
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                                    Syncing...
                                                </>
                                            ) : (
                                                'Update Moment'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Form>
                        </div>
                    </div>
                </Modal.Body>
                <input
                    id={`edit-image-${post._id}`}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleEditFileChange}
                />
            </Modal>
        </>
    );
};

export default PostCard;
