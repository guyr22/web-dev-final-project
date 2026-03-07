import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';

let mongod: MongoMemoryServer;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    // Clean all collections between tests
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// ---------------------------------------------------------------------------
// POST /auth/register
// ---------------------------------------------------------------------------
describe('POST /auth/register', () => {
    const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
    };

    it('registers a new user and returns tokens + user', async () => {
        const res = await request(app).post('/auth/register').send(validUser);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user).toMatchObject({
            username: validUser.username,
            email: validUser.email,
        });
        expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 400 when email is already taken', async () => {
        await request(app).post('/auth/register').send(validUser);
        const res = await request(app)
            .post('/auth/register')
            .send({ ...validUser, username: 'different' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when username is already taken', async () => {
        await request(app).post('/auth/register').send(validUser);
        const res = await request(app)
            .post('/auth/register')
            .send({ ...validUser, email: 'other@example.com' });
        expect(res.status).toBe(400);
    });

    it('returns 400 when required fields are missing', async () => {
        const res = await request(app).post('/auth/register').send({ email: 'x@x.com' });
        expect(res.status).toBe(400);
    });
});

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
describe('POST /auth/login', () => {
    const creds = { email: 'login@example.com', password: 'secret123' };

    beforeEach(async () => {
        await request(app)
            .post('/auth/register')
            .send({ username: 'loginuser', ...creds });
    });

    it('logs in with valid credentials and returns tokens', async () => {
        const res = await request(app).post('/auth/login').send(creds);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
    });

    it('returns 401 for wrong password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: creds.email, password: 'wrongpass' });
        expect(res.status).toBe(401);
    });

    it('returns 401 for unknown email', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'nobody@example.com', password: 'anything' });
        expect(res.status).toBe(401);
    });

    it('returns 400 when fields are missing', async () => {
        const res = await request(app).post('/auth/login').send({ email: creds.email });
        expect(res.status).toBe(400);
    });
});

// ---------------------------------------------------------------------------
// POST /auth/refresh
// ---------------------------------------------------------------------------
describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
        const reg = await request(app)
            .post('/auth/register')
            .send({ username: 'refreshuser', email: 'refresh@example.com', password: 'pass1234' });
        refreshToken = reg.body.refreshToken;
    });

    it('returns a new accessToken for a valid refreshToken', async () => {
        const res = await request(app).post('/auth/refresh').send({ refreshToken });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
    });

    it('returns 401 for an invalid refreshToken', async () => {
        const res = await request(app).post('/auth/refresh').send({ refreshToken: 'bad.token' });
        expect(res.status).toBe(401);
    });

    it('returns 400 when refreshToken is not provided', async () => {
        const res = await request(app).post('/auth/refresh').send({});
        expect(res.status).toBe(400);
    });
});

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------
describe('POST /auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
        const reg = await request(app)
            .post('/auth/register')
            .send({ username: 'logoutuser', email: 'logout@example.com', password: 'pass1234' });
        refreshToken = reg.body.refreshToken;
    });

    it('logs out successfully and invalidates the refresh token', async () => {
        const res = await request(app).post('/auth/logout').send({ refreshToken });
        expect(res.status).toBe(200);
        // Subsequent refresh should now fail
        const refreshRes = await request(app).post('/auth/refresh').send({ refreshToken });
        expect(refreshRes.status).toBe(401);
    });

    it('returns 400 when refreshToken is missing', async () => {
        const res = await request(app).post('/auth/logout').send({});
        expect(res.status).toBe(400);
    });
});
