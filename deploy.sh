#!/bin/bash
# =============================================================================
# deploy.sh — Full deployment script for the college server
# Run once on the server after cloning/pulling the repo.
#
# Usage:   bash deploy.sh <your-domain>
# Example: bash deploy.sh myapp.colman.ac.il
# =============================================================================

set -e  # exit immediately on any error

DOMAIN="${1}"
if [ -z "$DOMAIN" ]; then
    echo "ERROR: No domain provided."
    echo "Usage: bash deploy.sh <your-domain>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
CLIENT_DIR="$SCRIPT_DIR/client"

echo ""
echo "======================================================="
echo "  Deploying web-dev-final-project"
echo "  Domain: $DOMAIN"
echo "======================================================="
echo ""

# ---------------------------------------------------------------------------
# 1. Generate SSL certificates (self-signed, CN = your domain)
# ---------------------------------------------------------------------------
echo "[1/7] Generating SSL certificates for $DOMAIN..."
bash "$SERVER_DIR/certs/generate-certs.sh" "$DOMAIN"

# ---------------------------------------------------------------------------
# 2. Make sure the logs directory exists
# ---------------------------------------------------------------------------
echo "[2/7] Creating logs directory..."
mkdir -p "$SERVER_DIR/logs"

# ---------------------------------------------------------------------------
# 3. Write client/.env.production with the real domain
# ---------------------------------------------------------------------------
echo "[3/7] Writing client/.env.production..."
# Preserve GOOGLE_CLIENT_ID from existing file if present, otherwise use example
GOOGLE_CLIENT_ID="573915126197-1k3trdcfe2r6nce0cc4ikg1i73en4u55.apps.googleusercontent.com"
if [ -f "$CLIENT_DIR/.env.production" ]; then
    EXISTING=$(grep '^VITE_GOOGLE_CLIENT_ID=' "$CLIENT_DIR/.env.production" | cut -d= -f2-)
    [ -n "$EXISTING" ] && GOOGLE_CLIENT_ID="$EXISTING"
fi
cat > "$CLIENT_DIR/.env.production" <<EOF
VITE_API_URL=https://$DOMAIN
VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
EOF
echo "  VITE_API_URL=https://$DOMAIN"

# ---------------------------------------------------------------------------
# 4. Build the backend
# ---------------------------------------------------------------------------
echo "[4/7] Installing & building the backend..."
cd "$SERVER_DIR"
npm install
npm run build

# ---------------------------------------------------------------------------
# 5. Build the frontend
# ---------------------------------------------------------------------------
echo "[5/7] Installing & building the frontend..."
cd "$CLIENT_DIR"
npm install
npm run build

# ---------------------------------------------------------------------------
# 6. Copy built frontend into server's static folder
# ---------------------------------------------------------------------------
echo "[6/7] Copying frontend build to server/public/client..."
mkdir -p "$SERVER_DIR/public/client"
rm -rf "$SERVER_DIR/public/client"/*
cp -r "$CLIENT_DIR/dist/." "$SERVER_DIR/public/client/"

# ---------------------------------------------------------------------------
# 7. Allow Node to bind to ports < 1024 without sudo
# ---------------------------------------------------------------------------
echo "[7/8] Granting Node.js permission to bind to port 443..."
NODE_BIN="$(which node)"
sudo setcap 'cap_net_bind_service=+ep' "$NODE_BIN"

# ---------------------------------------------------------------------------
# 8. Start / Restart with PM2
# ---------------------------------------------------------------------------
echo "[8/8] Starting app with PM2 in production mode..."
cd "$SERVER_DIR"
pm2 delete web-dev-final-server 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "======================================================="
echo "  Deployment complete!"
echo "  Open https://$DOMAIN in your browser."
echo ""
echo "  Useful PM2 commands:"
echo "    pm2 list                        — see running apps"
echo "    pm2 logs web-dev-final-server   — stream live logs"
echo "    pm2 restart web-dev-final-server"
echo "    pm2 stop    web-dev-final-server"
echo "======================================================="
echo ""
echo "IMPORTANT: Make sure server/.env is configured!"
echo "  Copy server/.env.example → server/.env and fill in:"
echo "    MONGO_URI   (with user:password auth)"
echo "    JWT_ACCESS_SECRET"
echo "    JWT_REFRESH_SECRET"
echo "    GOOGLE_CLIENT_ID"
echo "    GEMINI_API_KEY"
echo "    ALLOWED_ORIGINS=https://$DOMAIN"
echo ""
