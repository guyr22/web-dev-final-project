import { useState } from 'react';
import { Card, Badge, Button, Modal, Spinner, Form } from 'react-bootstrap';
import { IPost } from '../../types';
import postService from '../../services/post.service';

interface PostCardProps {
    post: IPost;
    onPostDeleted?: () => void;
    onPostUpdated?: () => void;
}

const PostCard = ({ post, onPostDeleted, onPostUpdated }: PostCardProps) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title);
    const [editContent, setEditContent] = useState(post.content);
    const [editFile, setEditFile] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(post.imgUrl || null);

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
            <Card className="h-100 shadow-sm position-relative">
                <button 
                    type="button" 
                    className="btn-close position-absolute bg-white border shadow-sm"
                    style={{ top: '10px', right: '10px', zIndex: 10, padding: '0.5rem' }}
                    onClick={handleShow}
                    title="Delete Post"
                    aria-label="Delete Post"
                ></button>
                {post.imgUrl && (
                    <Card.Img 
                        variant="top" 
                        src={post.imgUrl} 
                        alt={post.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                    />
                )}
                <Card.Body>
                    <Card.Title>{post.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                        By: {typeof post.owner === 'object' && post.owner !== null ? post.owner.username : post.owner}
                    </Card.Subtitle>
                    <Card.Text>
                        {post.content}
                    </Card.Text>
                    
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-3">
                            {post.tags.map((tag, index) => (
                                <Badge 
                                    key={index} 
                                    bg="secondary" 
                                    className="me-1"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between align-items-center text-muted">
                    <div>
                        <small>{post.likes?.length || 0} Likes</small>
                        <span className="mx-2">•</span>
                        <small>{post.comments?.length || 0} Comments</small>
                    </div>
                    <Button variant="outline-secondary" size="sm" onClick={handleEditShow}>
                        Edit
                    </Button>
                </Card.Footer>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete the post "{post.title}"? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Post Modal */}
            <Modal show={showEditModal} onHide={handleEditClose} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Post title"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Post content"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Image</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleEditFileChange}
                            />
                        </Form.Group>
                        {editPreviewUrl && (
                            <div className="mb-3">
                                <span className="d-block mb-1 text-muted small">Image Preview:</span>
                                <img
                                    src={editPreviewUrl}
                                    alt="Preview"
                                    className="img-thumbnail rounded"
                                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                                />
                            </div>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleEditClose} disabled={isUpdating}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleUpdate} disabled={isUpdating || !editTitle.trim()}>
                        {isUpdating ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default PostCard;
