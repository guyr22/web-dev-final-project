import { useState } from 'react';
import { Container, Spinner, Alert, Button, Modal, Form, InputGroup } from 'react-bootstrap';
import PostCard from '../components/features/PostCard';
import CreatePost from '../components/features/CreatePost';
import usePosts from '../hooks/usePosts';

const FeedPage = () => {
    const { posts, loading, loadingMore, error, hasMore, isSearching, searchQuery, postFilter, setPostFilter, refreshPosts, loadMore, performSearch, clearSearch } = usePosts();
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
        <Container className="py-4" style={{ maxWidth: '600px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">Your Feed</h2>
                <Button variant="dark" onClick={handleShow} className="fw-semibold rounded-3 shadow-sm">
                    + Create Post
                </Button>
            </div>

            <Form onSubmit={handleSearch} className="mb-4">
                <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="Smart Search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="shadow-sm rounded-start-3"
                    />
                    <Button variant="primary" type="submit" className="shadow-sm px-4 fw-semibold" style={{ zIndex: 0 }}>
                        Search
                    </Button>
                </InputGroup>
            </Form>

            <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex justify-content-center">
                    <div className="btn-group shadow-sm" role="group" aria-label="Post Filter">
                        <input type="radio" className="btn-check" name="btnradio" id="btnradio1" autoComplete="off" checked={postFilter === 'all'} onChange={() => setPostFilter('all')} />
                        <label className="btn btn-outline-primary" htmlFor="btnradio1">All Posts</label>

                        <input type="radio" className="btn-check" name="btnradio" id="btnradio2" autoComplete="off" checked={postFilter === 'mine'} onChange={() => setPostFilter('mine')} />
                        <label className="btn btn-outline-primary" htmlFor="btnradio2">My Posts</label>

                        <input type="radio" className="btn-check" name="btnradio" id="btnradio3" autoComplete="off" checked={postFilter === 'others'} onChange={() => setPostFilter('others')} />
                        <label className="btn btn-outline-primary" htmlFor="btnradio3">Others' Posts</label>
                    </div>
                </div>

                {isSearching && (
                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border">
                        <span className="fw-medium text-primary">
                            Search results for: "{searchQuery}"
                        </span>
                        <Button variant="outline-secondary" size="sm" onClick={handleClearSearch} className="fw-semibold">
                            Clear Search
                        </Button>
                    </div>
                )}
            </div>

            <Modal show={showCreateModal} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton className="border-bottom-0 pb-0">
                </Modal.Header>
                <Modal.Body className="pt-0">
                     <CreatePost onPostCreated={onPostCreated} />
                </Modal.Body>
            </Modal>

            {posts.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <p className="fs-5">No posts yet. Be the first to share something!</p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-4">
                    {posts.map((post) => (
                        <PostCard key={post._id} post={post} onPostDeleted={refreshPosts} onPostUpdated={refreshPosts} />
                    ))}

                    {hasMore && !isSearching && (
                        <div className="text-center py-3">
                            <Button
                                variant="outline-primary"
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="fw-semibold px-5 rounded-3"
                            >
                                {loadingMore ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load More'
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
