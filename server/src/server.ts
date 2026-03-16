import 'dotenv/config'; 
import app from './app';
import mongoose from 'mongoose';
import https from 'https';
import fs from 'fs';   

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/web-dev-project';

const sslOptions = {
    key: fs.readFileSync('/etc/ssl/private/nginx-selfsigned.key'),
    cert: fs.readFileSync('/etc/ssl/certs/nginx-selfsigned.crt')
};

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        https.createServer(sslOptions, app).listen(PORT, () => {
            console.log(`secure Server is running on https://node55.cs.colman.ac.il:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });