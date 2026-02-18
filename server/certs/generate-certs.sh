#!/bin/bash
# Generate self-signed SSL certificates for development/production
# Run this script once before deploying with HTTPS

CERTS_DIR="$(dirname "$0")"

echo "Generating self-signed SSL certificates..."

openssl req -x509 \
  -newkey rsa:4096 \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -days 365 \
  -nodes \
  -subj "/C=IL/ST=Israel/L=Tel Aviv/O=WebDevFinal/CN=localhost"

echo "Done! Certificates generated:"
echo "  Private key: $CERTS_DIR/key.pem"
echo "  Certificate: $CERTS_DIR/cert.pem"
