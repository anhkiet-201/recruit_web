#!/bin/bash

# Define domain and path
DOMAIN="timviec.vieclamhr.com"
CERT_DIR="./certbot/conf/live/$DOMAIN"

# Create directory structure
mkdir -p "$CERT_DIR"

# Generate self-signed certificate
echo "Generating self-signed certificate for $DOMAIN..."
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -days 365 \
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=MyOrg/OU=MyUnit/CN=$DOMAIN"

echo "Certificate generated at $CERT_DIR"
