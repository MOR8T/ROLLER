#!/bin/sh
# Generates the self-signed certificate nginx serves until roller.tj is ours.
#
#     ./scripts/gen-selfsigned-cert.sh 193.233.103.132
#
# Browsers will warn on a self-signed certificate — that is expected and fine
# for this phase. It is here so the admin panel's login POST is encrypted
# rather than crossing the network in clear text. Replace with Let's Encrypt
# as soon as a domain exists.
set -e

HOST="$1"
if [ -z "$HOST" ]; then
  echo "usage: $0 <ip-or-domain>" >&2
  exit 1
fi

DIR="$(dirname "$0")/../nginx/certs"
mkdir -p "$DIR"

# A certificate for a bare IP needs an IP: SAN; a domain needs DNS:. Browsers
# ignore the legacy CN field entirely, so getting this wrong means the cert is
# rejected outright rather than merely warned about.
case "$HOST" in
  *[!0-9.]*) SAN="DNS:$HOST" ;;
  *)         SAN="IP:$HOST" ;;
esac

openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout "$DIR/selfsigned.key" \
  -out "$DIR/selfsigned.crt" \
  -subj "/CN=$HOST" \
  -addext "subjectAltName=$SAN"

chmod 600 "$DIR/selfsigned.key"
chmod 644 "$DIR/selfsigned.crt"

echo "Certificate written to $DIR (SAN: $SAN)"
