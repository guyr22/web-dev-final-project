import { Container, Row, Col } from 'react-bootstrap';
import PostCard from './components/features/PostCard';
import { IPost } from './types';

function App() {
  const mockPost: IPost = {
    _id: '1',
    title: 'Amazing Sunset',
    content: 'Had a great time watching the sunset at the beach yesterday. The colors were incredible!',
    owner: 'user123',
    imgUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    likes: ['user2', 'user3'],
    tags: ['nature', 'sunset', 'beach'],
    comments: [
      { userId: 'user2', content: 'Wow, beautiful!' }
    ]
  };

  return (
    <Container className="py-5">
      <h1>Social App Component Test</h1>
      <Row className="mt-4">
        <Col md={6} lg={4}>
          <PostCard post={mockPost} />
        </Col>
      </Row>
    </Container>
  )
}

export default App
