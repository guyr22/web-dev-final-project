#!/bin/bash
# Generate self-signed SSL certificates
# Usage: bash generate-certs.sh <domain>
# Example: bash generate-certs.sh myapp.colman.ac.il

CERTS_DIR="$(dirname "$0")"
DOMAIN="${1:-localhost}"

echo "Generating self-signed SSL certificates for: $DOMAIN"

openssl req -x509 \
  -newkey rsa:4096 \
  -keyout "$CERTS_DIR/key.pem" \
  -out "$CERTS_DIR/cert.pem" \
  -days 365 \
  -nodes \
  -subj "/C=IL/ST=Israel/L=Tel Aviv/O=WebDevFinal/CN=$DOMAIN"

echo "Done! Certificates generated:"
echo "  Private key: $CERTS_DIR/key.pem"
echo "  Certificate: $CERTS_DIR/cert.pem"
