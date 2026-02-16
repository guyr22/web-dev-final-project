import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { mockAuth } from './middleware/mockAuth';
import authRoutes from './routes/auth.route';
import { swaggerSpec } from './config/swagger.config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation (Development only)
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'University Social App API Docs'
    }));
    // Serve Swagger JSON spec
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
}

// Mock Auth Middleware (Enabled for Phase 1-3)
// In production/Phase 4, this should be replaced with real JWT middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(mockAuth);
}

// Routes
app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
    res.send('Server is healthy');
});

export default app;
