import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';

// Use AI mock mode so no real Gemini API calls are made
process.env.AI_MOCK_MODE = 'true';

let mongod: MongoMemoryServer;
let accessToken: string;
let userId: string;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    const reg = await request(app).post('/auth/register').send({
        username: 'postuser',
        email: 'posts@example.com',
        password: 'pass1234',
    });
    accessToken = reg.body.accessToken;
    userId = reg.body.user._id;
});

// ---------------------------------------------------------------------------
// Helper: create a post and return its body
// ---------------------------------------------------------------------------
async function createPost(overrides: object = {}) {
    const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Post', content: 'Some content', ...overrides });
    return res;
}

// ---------------------------------------------------------------------------
// GET /posts
// ---------------------------------------------------------------------------
describe('GET /posts', () => {
    it('returns an empty array when there are no posts', async () => {
        const res = await request(app)
            .get('/posts')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('returns paginated posts and X-Total-Count header', async () => {
        await createPost({ title: 'A' });
        await createPost({ title: 'B' });
        await createPost({ title: 'C' });

        const res = await request(app)
            .get('/posts?page=1&limit=2')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.headers['x-total-count']).toBe('3');
    });
});

// ---------------------------------------------------------------------------
// POST /posts
// ---------------------------------------------------------------------------
describe('POST /posts', () => {
    it('creates a post and returns it with owner populated', async () => {
        const res = await createPost();
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Test Post');
        expect(res.body.owner).toMatchObject({ username: 'postuser' });
        expect(Array.isArray(res.body.tags)).toBe(true);
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ title: 'No content' });
        expect(res.status).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
        const res = await request(app)
            .post('/posts')
            .send({ title: 'Test', content: 'hi' });
        expect(res.status).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// PUT /posts/:id
// ---------------------------------------------------------------------------
describe('PUT /posts/:id', () => {
    it('updates the post and returns updated data', async () => {
        const created = await createPost();
        const id = created.body._id;

        const res = await request(app)
            .put(`/posts/${id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ title: 'Updated Title' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated Title');
    });

    it('returns 404 for a non-existent post ID', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .put(`/posts/${fakeId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ title: 'X' });
        expect(res.status).toBe(404);
    });
});

// ---------------------------------------------------------------------------
// DELETE /posts/:id
// ---------------------------------------------------------------------------
describe('DELETE /posts/:id', () => {
    it('deletes an existing post and returns success message', async () => {
        const created = await createPost();
        const id = created.body._id;

        const res = await request(app)
            .delete(`/posts/${id}`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });

    it('returns 404 when the post does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .delete(`/posts/${fakeId}`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(404);
    });

    it('returns 401 when not authenticated', async () => {
        const created = await createPost();
        const res = await request(app).delete(`/posts/${created.body._id}`);
        expect(res.status).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// POST /posts/:id/like (toggle)
// ---------------------------------------------------------------------------
describe('POST /posts/:id/like', () => {
    it('likes a post and increments the like count', async () => {
        const created = await createPost();
        const id = created.body._id;

        const res = await request(app)
            .post(`/posts/${id}/like`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.likes).toBe(1);
        expect(res.body.isLiked).toBe(true);
    });

    it('unlikes a post on second call (toggle)', async () => {
        const created = await createPost();
        const id = created.body._id;

        await request(app)
            .post(`/posts/${id}/like`)
            .set('Authorization', `Bearer ${accessToken}`);

        const res = await request(app)
            .post(`/posts/${id}/like`)
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.likes).toBe(0);
        expect(res.body.isLiked).toBe(false);
    });

    it('returns 404 for a non-existent post', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .post(`/posts/${fakeId}/like`)
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(404);
    });
});

// ---------------------------------------------------------------------------
// POST /posts/:id/comment
// ---------------------------------------------------------------------------
describe('POST /posts/:id/comment', () => {
    it('adds a comment and returns the updated post', async () => {
        const created = await createPost();
        const id = created.body._id;

        const res = await request(app)
            .post(`/posts/${id}/comment`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ content: 'Great post!' });

        expect(res.status).toBe(201);
        expect(res.body.comments).toHaveLength(1);
        expect(res.body.comments[0].content).toBe('Great post!');
    });

    it('returns 400 when comment content is missing', async () => {
        const created = await createPost();
        const res = await request(app)
            .post(`/posts/${created.body._id}/comment`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});
        expect(res.status).toBe(400);
    });

    it('returns 404 when post does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .post(`/posts/${fakeId}/comment`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ content: 'hello' });
        expect(res.status).toBe(404);
    });
});

// ---------------------------------------------------------------------------
// GET /posts/search
// ---------------------------------------------------------------------------
describe('GET /posts/search', () => {
    it('returns 400 when q param is missing', async () => {
        const res = await request(app)
            .get('/posts/search')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(400);
    });

    it('returns matching posts for a search query (AI mock returns #mock, #test, #AI)', async () => {
        // Create a post with tags matching the mock AI return: #mock, #test, #AI
        await createPost({ tags: ['#mock', '#test'] });
        await createPost({ title: 'unrelated', content: 'foo', tags: ['#other'] });

        const res = await request(app)
            .get('/posts/search?q=anything')
            .set('Authorization', `Bearer ${accessToken}`);
        expect(res.status).toBe(200);
        // AI mock returns ["#mock","#test","#AI"], so the first post should match
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
});
