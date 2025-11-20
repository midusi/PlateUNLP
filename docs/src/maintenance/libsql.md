# Hosting libSQL

> Based on the guide by Hubert Lin: https://hubertlin.me/posts/2024/11/self-hosting-turso-libsql/

First of all, why hosting libSQL and not using SQLite with a file? Well, SQLite is great and works amazing for local development, but when deployed to production, having a file-based database can be a pain for maintenance, backups, and scaling.

The big advantaghe of hosting libSQL is **remote access**. You can access the database from anywhere, making it easier to manage and run migrations.

To run a libSQL server, you can use their Docker image:

```bash
docker run -p 8080:8080 -d ghcr.io/tursodatabase/libsql-server:latest
```

## Configuration

There is some important [configuration](https://github.com/tursodatabase/libsql/blob/main/docs/DOCKER.md) to do. Mainly, these environment variables:

- `SQLD_NODE`: whether this instance is the `primary` or a `replica`.
  - If set as `replica`, you need to also set `SQLD_PRIMARY_URL`.
- `SQLD_DB_PATH`: location of the database file inside `/var/lib/sqld/`, defaults to `iku.db`.
- `SQLD_HTTP_LISTEN_ADDR`: this is the HTTP endpoint that you can use to connect to your database, defaults to `0.0.0.0:8080`.
- `SQLD_GRPC_LISTEN_ADDR`: this is used for inter-node communication, defaults to `0.0.0.0:5001`.

You can leave your instance without authentication for testing purposes, but it's recommended to set up authentication for production use. You can use `SQLD_HTTP_AUTH` to allow HTTP basic authentication.

Otherwise, you can use the more robust JWT-based authentication, which is explained in the next section.

## Authentication

You can secure your libSQL server using JWT-based authentication. For this, you need to specify a public key in the environment variable `SQLD_AUTH_JWT_KEY` (plaintext) or `SQLD_AUTH_JWT_KEY_FILE` (path to a file).

The public key should be in either of these formats:
- PKCS#8-encoded Ed25519 PEM
- plain bytes of a Ed25519 public key in URL-safe base64 format

To generate a key pair, you can use the following script:

```bash
#!/usr/bin/bash

openssl genpkey -algorithm ED25519 -out ./id_ed25519
openssl pkey -in ./id_ed25519 -pubout -out ./id_ed25519.pub
chmod 600 ./id_ed25519
```

To generate a JWT token, you can use this script:

```bash
#!/usr/bin/bash
set -e

PRIVATE_KEY="./id_ed25519"

b64url() {
    openssl base64 -e -A | tr '+/' '-_' | tr -d '='
}

read -p "Select access mode ('rw' for read-write, 'ro' for read-only): " MODE
if [[ "$MODE" != "rw" && "$MODE" != "ro" ]]; then
    echo "Error: Invalid mode. Must be 'rw' or 'ro'."
    exit 1
fi
read -p "Enter expiration time in seconds (e.g., 3600) or leave empty for no expiration: " DURATION

HEADER_JSON='{"alg":"EdDSA","typ":"JWT"}'
if [[ -n "$DURATION" ]]; then
    if ! [[ "$DURATION" =~ ^[0-9]+$ ]]; then
        echo "Error: Expiration must be a number."
        exit 1
    fi
    NOW=$(date +%s)
    EXP_TIME=$((NOW + DURATION))
    PAYLOAD_JSON="{\"a\":\"$MODE\",\"exp\":$EXP_TIME}"
else
    PAYLOAD_JSON="{\"a\":\"$MODE\"}"
fi

B64_HEADER=$(echo -n "$HEADER_JSON" | b64url)
B64_PAYLOAD=$(echo -n "$PAYLOAD_JSON" | b64url)
SIGNING_INPUT="$B64_HEADER.$B64_PAYLOAD"

# Create a temporary file for the input
TMP_INPUT=$(mktemp)
echo -n "$SIGNING_INPUT" > "$TMP_INPUT"
# -rawin is required for Ed25519 in OpenSSL 3.x
SIGNATURE=$(openssl pkeyutl -sign -inkey "$PRIVATE_KEY" -rawin -in "$TMP_INPUT" | b64url)
rm "$TMP_INPUT"

echo ""
echo "Generated JWT:"
echo "$SIGNING_INPUT.$SIGNATURE"
echo ""
```