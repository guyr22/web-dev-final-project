import 'dotenv/config'; // Load env vars before anything else
import fs from 'fs';
import http from 'http';
import https from 'https';
import app from './app';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/web-dev-project';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');

        if (process.env.HTTPS === 'true') {
            const sslKeyPath = process.env.SSL_KEY_PATH || './certs/key.pem';
            const sslCertPath = process.env.SSL_CERT_PATH || './certs/cert.pem';

            const credentials = {
                key: fs.readFileSync(sslKeyPath),
                cert: fs.readFileSync(sslCertPath),
            };

            https.createServer(credentials, app).listen(PORT, () => {
                console.log(`HTTPS server is running on port ${PORT}`);
            });
        } else {
            http.createServer(app).listen(PORT, () => {
                console.log(`HTTP server is running on port ${PORT}`);
            });
        }
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });
