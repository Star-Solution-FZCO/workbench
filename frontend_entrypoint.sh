#!/bin/sh
tmp=$(mktemp)
export ENV_FILENAME_HASH=$(uuidgen | cut -c 1-8)
envsubst < /usr/share/nginx/html/index.html > "$tmp" && mv "$tmp" /usr/share/nginx/html/index.html
chmod 644 /usr/share/nginx/html/index.html
envsubst < /usr/share/nginx/html/env.template.js > "/usr/share/nginx/html/assets/env-${ENV_FILENAME_HASH}.js" 
exec nginx -g 'daemon off;'