module.exports = {
    apps: [
        {
            name: 'web-dev-final-server',
            script: './dist/server.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 443,
                HTTPS: 'true',
                SSL_KEY_PATH: './certs/key.pem',
                SSL_CERT_PATH: './certs/cert.pem',
            },
        },
    ],
};
