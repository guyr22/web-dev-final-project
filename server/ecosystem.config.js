module.exports = {
    apps: [
        {
            name: 'web-dev-final-server',
            script: './dist/server.js',
            cwd: __dirname,           // ensure relative paths (certs, public) resolve correctly
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',

            // PM2 log files (directory created by deploy.sh)
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_file: './logs/combined.log',
            time: true,               // prefix log lines with timestamps

            env: {
                NODE_ENV: 'development',
                PORT: 3001,
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
