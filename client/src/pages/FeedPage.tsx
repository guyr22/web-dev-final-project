import { useState } from 'react';
import { Container, Spinner, Alert, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import PostCard from '../components/features/PostCard';
import CreatePost from '../components/features/CreatePost';
import usePosts from '../hooks/usePosts';

const FeedPage = () => {
    const { posts, loading, loadingMore, error, hasMore, isSearching, searchQuery, refreshPosts, loadMore, performSearch, clearSearch } = usePosts();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    const handleClose = () => setShowCreateModal(false);
    const handleShow = () => setShowCreateModal(true);

    const onPostCreated = () => {
        refreshPosts();
        handleClose();
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(searchInput);
    };

    const handleClearSearch = () => {
        setSearchInput('');
        clearSearch();
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

    if (error) {
        return (
            <Container className="mt-5" style={{ maxWidth: '600px' }}>
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
        <Container className="py-5" style={{ maxWidth: '640px' }}>
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="fw-bold mb-1 text-white">Your Feed</h2>
                    <p className="text-muted small mb-0">Discover what's happening now</p>
                </div>
                <Button onClick={handleShow} className="btn-premium d-flex align-items-center gap-2">
                    <span style={{ fontSize: '1.2rem' }}>+</span>
                    <span>Create Post</span>
                </Button>
            </div>

            <Form onSubmit={handleSearch} className="mb-5">
                <InputGroup className="glass-card rounded-pill p-1">
                    <Form.Control
                        type="text"
                        placeholder="Search for moments..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="bg-transparent border-0 text-white px-4 py-2 shadow-none"
                        maxLength={500}
                    />
                    <Button variant="link" type="submit" className="text-primary fw-bold text-decoration-none px-4">
                        Search
                    </Button>
                </InputGroup>
                {searchInput.length > 0 && (
                    <div className="px-3 mt-2">
                         <span className={`small ${searchInput.length >= 500 ? 'text-danger' : 'text-muted opacity-50'}`} style={{ fontSize: '0.7rem' }}>
                            {searchInput.length}/500 characters
                        </span>
                    </div>
                )}
            </Form>

            {isSearching && (
                <div className="d-flex justify-content-between align-items-center mb-5 p-3 glass-card rounded-3 border-0">
                    <span className="small text-muted">
                        Showing results for <span className="text-white fw-bold">"{searchQuery}"</span>
                    </span>
                    <Button variant="link" size="sm" onClick={handleClearSearch} className="text-primary text-decoration-none fw-bold small p-0">
                        Clear
                    </Button>
                </div>
            )}

            <Modal show={showCreateModal} onHide={handleClose} size="lg" centered contentClassName="glass-card border-0">
                <Modal.Header closeButton closeVariant="white" className="border-0 pb-0 pt-4 px-4">
                     <Modal.Title className="fw-bold text-white fs-4">Create New Post</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4 pt-3">
                     <CreatePost onPostCreated={onPostCreated} />
                </Modal.Body>
            </Modal>

            {posts.length === 0 ? (
                <div className="text-center py-5 glass-card rounded-4 border-0">
                    <div className="fs-1 mb-3">🎐</div>
                    <h5 className="text-white fw-bold">No posts found</h5>
                    <p className="text-muted small">Be the first to share a moment with the community!</p>
                    <Button onClick={handleShow} className="btn-premium mt-3">
                        Share Something
                    </Button>
                </div>
            ) : (
                <div className="d-flex flex-column gap-5">
                    {posts.map((post) => (
                        <PostCard key={post._id} post={post} onPostDeleted={refreshPosts} onPostUpdated={refreshPosts} />
                    ))}

                    {hasMore && !isSearching && (
                        <div className="text-center py-4">
                            <Button
                                variant="outline-primary"
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="fw-bold px-5 rounded-pill border-2 transition-all"
                                style={{ background: loadingMore ? 'transparent' : 'rgba(99, 102, 241, 0.05)' }}
                            >
                                {loadingMore ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        <span>Syncing...</span>
                                    </>
                                ) : (
                                    'Load More Moments'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Container>
    );
};

export default FeedPage;
