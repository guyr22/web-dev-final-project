import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Absolute path: <project-root>/server/public/uploads
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');

// Create the directory if it doesn't exist (recursive so intermediate dirs are made too)
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

export const upload = multer({ storage: storage });
