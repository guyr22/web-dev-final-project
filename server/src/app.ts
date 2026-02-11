import express from 'express';
import cors from 'cors';
import { mockAuth } from './middleware/mockAuth';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock Auth Middleware (Enabled for Phase 1-3)
// In production/Phase 4, this should be replaced with real JWT middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(mockAuth);
}

// Routes will be added here
app.get('/health', (req, res) => {
    res.send('Server is healthy');
});

export default app;
