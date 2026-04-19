#!/usr/bin/env bash

set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-$HOME/apps/cityfarm}"
COMPOSE_FILE="$DEPLOY_PATH/docker-compose.vps.yml"
ENV_FILE="$DEPLOY_PATH/.env"

mkdir -p "$DEPLOY_PATH"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the VPS"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required on the VPS"
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing compose file: $COMPOSE_FILE"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

if [[ -z "${GHCR_USERNAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "GHCR_USERNAME and GHCR_TOKEN are required"
  exit 1
fi

cd "$DEPLOY_PATH"

printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans
docker image prune -f
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
