import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.route';
import postRouter from './routes/post.route';
import userRouter from './routes/user.route';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
    exposedHeaders: ['X-Total-Count'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'))); // Serve uploaded files

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
app.use('/user', userRouter);

app.get('/health', (req, res) => {
    res.send('Server is healthy');
});

export default app;
