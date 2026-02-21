import { Card, Badge } from 'react-bootstrap';
import { IPost } from '../../types';

interface PostCardProps {
    post: IPost;
}

const PostCard = ({ post }: PostCardProps) => {
    return (
        <Card className="h-100 shadow-sm">
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
                    By: {post.owner}
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
            <Card.Footer className="text-muted">
                <small>{post.likes?.length || 0} Likes</small>
                <span className="mx-2">•</span>
                <small>{post.comments?.length || 0} Comments</small>
            </Card.Footer>
        </Card>
    );
};

export default PostCard;
