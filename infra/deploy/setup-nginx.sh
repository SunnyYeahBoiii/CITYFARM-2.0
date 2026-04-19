#!/usr/bin/env bash

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-$HOME/apps/cityfarm}"
ENV_FILE="${1:-$DEPLOY_PATH/.env}"
NGINX_CONF_NAME="${NGINX_CONF_NAME:-cityfarm.conf}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTTP_TEMPLATE="${NGINX_HTTP_TEMPLATE:-}"
HTTPS_TEMPLATE="${NGINX_HTTPS_TEMPLATE:-}"
TARGET_PATH="/etc/nginx/sites-available/${NGINX_CONF_NAME}"
ENABLED_PATH="/etc/nginx/sites-enabled/${NGINX_CONF_NAME}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo or as root"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}"
  exit 1
fi

if [[ -z "${HTTP_TEMPLATE}" ]]; then
  if [[ -f "${SCRIPT_DIR}/cityfarm.http.conf.template" ]]; then
    HTTP_TEMPLATE="${SCRIPT_DIR}/cityfarm.http.conf.template"
  else
    HTTP_TEMPLATE="${SCRIPT_DIR}/../nginx/cityfarm.http.conf.template"
  fi
fi

if [[ -z "${HTTPS_TEMPLATE}" ]]; then
  if [[ -f "${SCRIPT_DIR}/cityfarm.https.conf.template" ]]; then
    HTTPS_TEMPLATE="${SCRIPT_DIR}/cityfarm.https.conf.template"
  else
    HTTPS_TEMPLATE="${SCRIPT_DIR}/../nginx/cityfarm.https.conf.template"
  fi
fi

if [[ ! -f "${HTTP_TEMPLATE}" ]]; then
  echo "Missing HTTP Nginx template: ${HTTP_TEMPLATE}"
  exit 1
fi

if [[ ! -f "${HTTPS_TEMPLATE}" ]]; then
  echo "Missing HTTPS Nginx template: ${HTTPS_TEMPLATE}"
  exit 1
fi

while IFS='=' read -r key value; do
  [[ -z "${key}" ]] && continue
  case "${key}" in
    APP_DOMAIN|ADMIN_DOMAIN|API_DOMAIN|LETSENCRYPT_EMAIL|NGINX_CLIENT_MAX_BODY_SIZE|WEB_UPSTREAM_HOST|ADMIN_UPSTREAM_HOST|API_UPSTREAM_HOST|WEB_HOST_PORT|ADMIN_HOST_PORT|API_HOST_PORT)
      export "${key}=${value}"
      ;;
  esac
done < <(grep -E '^(APP_DOMAIN|ADMIN_DOMAIN|API_DOMAIN|LETSENCRYPT_EMAIL|NGINX_CLIENT_MAX_BODY_SIZE|WEB_UPSTREAM_HOST|ADMIN_UPSTREAM_HOST|API_UPSTREAM_HOST|WEB_HOST_PORT|ADMIN_HOST_PORT|API_HOST_PORT)=' "${ENV_FILE}")

: "${APP_DOMAIN:?APP_DOMAIN is required}"
: "${ADMIN_DOMAIN:?ADMIN_DOMAIN is required}"
: "${API_DOMAIN:?API_DOMAIN is required}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL is required}"

WEB_UPSTREAM_HOST="${WEB_UPSTREAM_HOST:-127.0.0.1}"
ADMIN_UPSTREAM_HOST="${ADMIN_UPSTREAM_HOST:-127.0.0.1}"
API_UPSTREAM_HOST="${API_UPSTREAM_HOST:-127.0.0.1}"
WEB_HOST_PORT="${WEB_HOST_PORT:-3000}"
ADMIN_HOST_PORT="${ADMIN_HOST_PORT:-3003}"
API_HOST_PORT="${API_HOST_PORT:-3001}"
NGINX_CLIENT_MAX_BODY_SIZE="${NGINX_CLIENT_MAX_BODY_SIZE:-25m}"

APP_CERT_FULLCHAIN="/etc/letsencrypt/live/${APP_DOMAIN}/fullchain.pem"
APP_CERT_PRIVKEY="/etc/letsencrypt/live/${APP_DOMAIN}/privkey.pem"
ADMIN_CERT_FULLCHAIN="/etc/letsencrypt/live/${ADMIN_DOMAIN}/fullchain.pem"
ADMIN_CERT_PRIVKEY="/etc/letsencrypt/live/${ADMIN_DOMAIN}/privkey.pem"
API_CERT_FULLCHAIN="/etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem"
API_CERT_PRIVKEY="/etc/letsencrypt/live/${API_DOMAIN}/privkey.pem"

mkdir -p /var/www/certbot

render_template() {
  local template="$1"
  envsubst '
    $APP_DOMAIN
    $ADMIN_DOMAIN
    $API_DOMAIN
    $WEB_UPSTREAM_HOST
    $ADMIN_UPSTREAM_HOST
    $API_UPSTREAM_HOST
    $WEB_HOST_PORT
    $ADMIN_HOST_PORT
    $API_HOST_PORT
    $NGINX_CLIENT_MAX_BODY_SIZE
    $APP_CERT_FULLCHAIN
    $APP_CERT_PRIVKEY
    $ADMIN_CERT_FULLCHAIN
    $ADMIN_CERT_PRIVKEY
    $API_CERT_FULLCHAIN
    $API_CERT_PRIVKEY
  ' <"${template}" >"${TARGET_PATH}"
}

enable_site() {
  ln -sfn "${TARGET_PATH}" "${ENABLED_PATH}"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx
}

have_all_certs() {
  [[ -f "${APP_CERT_FULLCHAIN}" ]] \
    && [[ -f "${APP_CERT_PRIVKEY}" ]] \
    && [[ -f "${ADMIN_CERT_FULLCHAIN}" ]] \
    && [[ -f "${ADMIN_CERT_PRIVKEY}" ]] \
    && [[ -f "${API_CERT_FULLCHAIN}" ]] \
    && [[ -f "${API_CERT_PRIVKEY}" ]]
}

render_template "${HTTP_TEMPLATE}"
enable_site

if ! have_all_certs; then
  certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email "${LETSENCRYPT_EMAIL}" \
    -d "${APP_DOMAIN}" \
    -d "${ADMIN_DOMAIN}" \
    -d "${API_DOMAIN}"
fi

render_template "${HTTPS_TEMPLATE}"
enable_site

echo "Nginx is configured for ${APP_DOMAIN}, ${ADMIN_DOMAIN}, ${API_DOMAIN}."
