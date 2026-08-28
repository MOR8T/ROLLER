# Server Actions carry hero-slide photos as multipart FormData. next.config.ts
# sets bodySizeLimit to 12mb and the backend accepts uploads up to 10 MB; this
# has to clear the larger of the two plus multipart overhead, or nginx rejects
# the upload with 413 before either of them sees it.
client_max_body_size 12m;

gzip on;
gzip_types text/plain text/css application/json application/javascript
           application/x-javascript text/xml application/xml image/svg+xml;
gzip_min_length 1024;

add_header X-Content-Type-Options    "nosniff"       always;
add_header X-Frame-Options           "SAMEORIGIN"    always;
add_header Referrer-Policy           "strict-origin-when-cross-origin" always;

# Docker's embedded DNS. Resolving through a variable rather than an `upstream`
# block matters here: an upstream is resolved once at startup, so after
# `docker compose up -d` gives a container a new IP, nginx would keep proxying
# to the old one until restarted by hand.
resolver 127.0.0.11 valid=10s ipv6=off;

proxy_http_version 1.1;
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade           $http_upgrade;
proxy_set_header Connection        $connection_upgrade;
proxy_read_timeout 60s;

location /api/ {
    set $backend_target http://backend:8000;
    proxy_pass $backend_target$request_uri;
}

# Admin-uploaded photos, served straight off the backend's volume. Proxied here
# rather than through Next.js so the bytes never pass through Node.
location /uploads/ {
    set $uploads_target http://backend:8000;
    proxy_pass $uploads_target$request_uri;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}

# Content-hashed build output — safe to cache forever. Next.js already sends
# its own Cache-Control here; hiding it first stops the response carrying two
# conflicting copies of the header.
location /_next/static/ {
    set $static_target http://frontend:3031;
    proxy_pass $static_target$request_uri;
    proxy_hide_header Cache-Control;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location / {
    set $frontend_target http://frontend:3031;
    proxy_pass $frontend_target$request_uri;
}
