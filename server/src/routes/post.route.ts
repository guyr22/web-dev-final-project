import express from 'express';
import PostController from '../controllers/post.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer Setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure this directory exists or create it? 
        // For now assume public/uploads exists as per instructions.
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Preserve extension
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// All routes are protected
router.use(authMiddleware);

router.get('/', PostController.getAll.bind(PostController));

router.post('/', upload.single('image'), PostController.create.bind(PostController));

router.put('/:id', PostController.update.bind(PostController));

router.delete('/:id', PostController.delete.bind(PostController));

export default router;
