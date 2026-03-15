import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from '@jest/globals';

let mongod: MongoMemoryServer;
let accessToken: string;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    // Clean DB and create a fresh user before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    const reg = await request(app).post('/auth/register').send({
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'pass1234',
    });
    accessToken = reg.body.accessToken;
});

// ---------------------------------------------------------------------------
// GET /user/profile
// ---------------------------------------------------------------------------
describe('GET /user/profile', () => {
    it('returns the authenticated user profile', async () => {
        const res = await request(app)
            .get('/user/profile')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            username: 'profileuser',
            email: 'profile@example.com',
        });
        expect(res.body).not.toHaveProperty('password');
        expect(res.body).not.toHaveProperty('refreshTokens');
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(app).get('/user/profile');
        expect(res.status).toBe(401);
    });

    it('returns 401 for an invalid token', async () => {
        const res = await request(app)
            .get('/user/profile')
            .set('Authorization', 'Bearer bad.token.here');
        expect(res.status).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// PUT /user/profile
// ---------------------------------------------------------------------------
describe('PUT /user/profile', () => {
    it('updates the bio and returns updated user', async () => {
        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ bio: 'My new bio' });

        expect(res.status).toBe(200);
        expect(res.body.bio).toBe('My new bio');
        expect(res.body.username).toBe('profileuser');
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(app)
            .put('/user/profile')
            .send({ bio: 'should fail' });
        expect(res.status).toBe(401);
    });

    it('clears the bio when an empty string is sent', async () => {
        // First set a bio
        await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ bio: 'initial bio' });

        // Then clear it
        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ bio: '' });

        expect(res.status).toBe(200);
        expect(res.body.bio).toBe('');
    });

    it('updates the username successfully', async () => {
        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ username: 'newusername' });

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('newusername');
    });

    it('returns 409 when the new username is already taken', async () => {
        // Register a second user so their username is taken
        await request(app).post('/auth/register').send({
            username: 'takenuser',
            email: 'taken@example.com',
            password: 'pass1234',
        });

        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ username: 'takenuser' });

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/already taken/i);
    });

    it('returns 400 when username is shorter than 3 characters', async () => {
        const res = await request(app)
            .put('/user/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ username: 'ab' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/3 characters/i);
    });
});
