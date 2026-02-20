import { useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Button, Modal } from 'react-bootstrap';
import PostCard from '../components/features/PostCard';
import CreatePost from '../components/features/CreatePost';
import usePosts from '../hooks/usePosts';

const FeedPage = () => {
    const { posts, loading, error, refreshPosts } = usePosts();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleClose = () => setShowCreateModal(false);
    const handleShow = () => setShowCreateModal(true);

    const onPostCreated = () => {
        refreshPosts();
        handleClose();
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    Error loading posts: {error}
                    <div className="mt-2">
                        <button className="btn btn-outline-danger btn-sm" onClick={refreshPosts}>Try Again</button>
                    </div>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Feed</h2>
                <Button variant="primary" onClick={handleShow} className="fw-bold fw-shadow">
                    <i className="bi bi-plus-lg me-2"></i>Create Post
                </Button>
            </div>

            <Modal show={showCreateModal} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                </Modal.Header>
                <Modal.Body className="pt-0">
                     <CreatePost onPostCreated={onPostCreated} />
                </Modal.Body>
            </Modal>

            <Row>
                {posts.length === 0 ? (
                    <Col>
                        <p className="text-muted">No posts found.</p>
                    </Col>
                ) : (
                    posts.map((post) => (
                        <Col key={post._id} md={6} lg={4} className="mb-4">
                            <PostCard post={post} onPostDeleted={refreshPosts} onPostUpdated={refreshPosts} />
                        </Col>
                    ))
                )}
            </Row>
        </Container>
    );
};

export default FeedPage;
