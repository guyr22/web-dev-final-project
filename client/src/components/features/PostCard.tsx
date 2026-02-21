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
            <Card className="border-0 shadow rounded-4 overflow-hidden position-relative">
                <button 
                    type="button" 
                    className="btn-close position-absolute bg-light rounded-circle p-2 shadow-sm"
                    style={{ top: '10px', right: '10px', zIndex: 10 }}
                    onClick={handleShow}
                    title="Delete Post"
                    aria-label="Delete Post"
                ></button>
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
                    <p className="text-secondary small fw-semibold mb-2">
                        {typeof post.owner === 'object' && post.owner !== null ? post.owner.username : post.owner}
                    </p>
                    <Card.Text className="text-body-secondary">
                        {post.content}
                    </Card.Text>
                    
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-3">
                            {post.tags.map((tag, index) => (
                                <Badge 
                                    key={index} 
                                    bg="primary" 
                                    className="me-1 bg-opacity-10 text-primary fw-medium rounded-pill"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </Card.Body>
                <Card.Footer className="bg-white border-top d-flex justify-content-between align-items-center px-4 py-3">
                    <div className="d-flex gap-3 text-secondary small fw-medium">
                        <span>❤️ {post.likes?.length || 0}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                    </div>
                    <Button variant="outline-dark" size="sm" className="rounded-3 px-3" onClick={handleEditShow}>
                        Edit
                    </Button>
                </Card.Footer>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">Delete Post</Modal.Title>
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
                    <Modal.Title className="fw-bold">Edit Post</Modal.Title>
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
                                    className="img-thumbnail rounded-3"
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
                    <Button variant="dark" onClick={handleUpdate} disabled={isUpdating || !editTitle.trim()}>
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
