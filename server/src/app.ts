import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.route';
import postRouter from './routes/post.route';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'University Social App API Docs'
}));

// Serve Swagger JSON spec
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Routes
app.use('/auth', authRoutes);
app.use('/posts', postRouter);

app.get('/health', (req, res) => {
    res.send('Server is healthy');
});

export default app;
