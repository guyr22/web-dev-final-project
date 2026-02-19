import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import PostCard from '../components/features/PostCard';
import usePosts from '../hooks/usePosts';

const FeedPage = () => {
    const { posts, loading, error, refreshPosts } = usePosts();

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
            <h1 className="mb-4">Feed</h1>
            <Row>
                {posts.length === 0 ? (
                    <Col>
                        <p className="text-muted">No posts found.</p>
                    </Col>
                ) : (
                    posts.map((post) => (
                        <Col key={post._id} md={6} lg={4} className="mb-4">
                            <PostCard post={post} />
                        </Col>
                    ))
                )}
            </Row>
        </Container>
    );
};

export default FeedPage;
