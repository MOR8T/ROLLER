#!/bin/sh
# Issues the first Let's Encrypt certificate for the site.
#
#     ./scripts/issue-letsencrypt.sh roller.tj admin@roller.tj
#
# Prerequisites: the domain's A record already points at this server, and nginx
# is running and serving :80 (the ACME challenge location is already in
# roller.conf). Renewals are a separate cron entry — see DEPLOYMENT.md.
#
# Chose HTTP-01 over Cloudflare's Origin CA deliberately: a Let's Encrypt
# certificate is valid to browsers whether or not Cloudflare proxies the domain,
# so it survives turning the orange cloud off — which is a live possibility
# until the latency measurement from Dushanbe is in.
set -e

DOMAIN="$1"
EMAIL="$2"
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "usage: $0 <domain> <email>" >&2
  exit 1
fi

COMPOSE="docker compose -f $(dirname "$0")/../docker-compose.prod.yml"

# --dry-run first: Let's Encrypt rate-limits real failures hard (5 per hour per
# domain), and a misconfigured webroot is the usual reason for one.
echo "==> dry run"
$COMPOSE run --rm certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email --dry-run

echo "==> issuing for real"
$COMPOSE run --rm certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email

echo
echo "Certificate is in the 'letsencrypt' volume at:"
echo "  /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "Next: switch nginx/conf.d/roller.conf over to it and reload."
