# VPS `.env` Update Handoff

Use this document for a coding agent running on the VPS to update the runtime `.env` for the current GitHub Actions deployment flow.

Do not paste or commit real secrets into this document. Keep secrets only in the VPS `.env` file or GitHub Actions secrets.

## Goal

Update `DEPLOY_PATH/.env` so Docker Compose uses internal service-to-service URLs, mounts the Vertex AI service-account credential from outside the repo, and lets GitHub Actions upsert SHA-pinned image refs on each deploy.

## Expected Deploy Path

Use the GitHub Actions `DEPLOY_PATH` value. If unknown, default to:

```bash
/root/CITYFARM-2.0
```

If the deploy user is not `root`, use the actual path, for example:

```bash
/home/deploy/apps/cityfarm
```

## Required `.env` Changes

Set these values in `${DEPLOY_PATH}/.env`:

```env
NODE_ENV=production

MODEL_API_URL=http://model-api:3003
NEST_API_URL=http://api:3001

GCP_PROJECT_ID=cityfarm-494909
GCP_LOCATION=global
MODEL_API_GCP_KEY_FILE_ON_VPS=/etc/cityfarm/model-api/gcp-service-account.json
MODEL_API_GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gcp-service-account.json

WEB_NEXT_PUBLIC_API_URL=https://cityfarm.id.vn/api
WEB_NEXT_PUBLIC_APP_URL=https://cityfarm.id.vn
ADMIN_NEXT_PUBLIC_API_URL=https://cityfarm.id.vn/api
ADMIN_NEXT_PUBLIC_WEB_URL=https://cityfarm.id.vn

NEXT_PUBLIC_API_URL=https://cityfarm.id.vn/api
NEXT_PUBLIC_APP_URL=https://cityfarm.id.vn
NEXT_PUBLIC_WEB_URL=https://cityfarm.id.vn

LANDING_BIND_IP=127.0.0.1
WEB_BIND_IP=127.0.0.1
ADMIN_BIND_IP=127.0.0.1
API_BIND_IP=127.0.0.1
```

Remove or leave unused, but do not rely on these old keys for deploy:

```env
GEMINI_API_KEY
```

The workflow will upsert these image refs automatically during deploy, so the agent does not need to fill them manually:

```env
LANDING_IMAGE
WEB_IMAGE
ADMIN_IMAGE
API_IMAGE
MODEL_API_IMAGE
```

## Safe Patch Script

Run this on the VPS. Set `DEPLOY_PATH` first if the default is wrong.

```bash
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/root/CITYFARM-2.0}"
ENV_FILE="${DEPLOY_PATH}/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"

upsert_env() {
  key="$1"
  value="$2"
  python3 - "$ENV_FILE" "$key" "$value" <<'PY'
import pathlib
import sys

env_path = pathlib.Path(sys.argv[1])
key = sys.argv[2]
value = sys.argv[3]
prefix = f"{key}="

lines = env_path.read_text(encoding="utf-8").splitlines()
for idx, line in enumerate(lines):
    if line.startswith(prefix):
        lines[idx] = f"{key}={value}"
        break
else:
    lines.append(f"{key}={value}")

env_path.write_text("\n".join(lines).rstrip("\n") + "\n", encoding="utf-8")
PY
}

delete_env() {
  key="$1"
  python3 - "$ENV_FILE" "$key" <<'PY'
import pathlib
import sys

env_path = pathlib.Path(sys.argv[1])
key = sys.argv[2]
prefix = f"{key}="

lines = [
    line for line in env_path.read_text(encoding="utf-8").splitlines()
    if not line.startswith(prefix)
]
env_path.write_text("\n".join(lines).rstrip("\n") + "\n", encoding="utf-8")
PY
}

upsert_env NODE_ENV production
upsert_env MODEL_API_URL http://model-api:3003
upsert_env NEST_API_URL http://api:3001

upsert_env GCP_PROJECT_ID cityfarm-494909
upsert_env GCP_LOCATION global
upsert_env MODEL_API_GCP_KEY_FILE_ON_VPS /etc/cityfarm/model-api/gcp-service-account.json
upsert_env MODEL_API_GOOGLE_APPLICATION_CREDENTIALS /run/secrets/gcp-service-account.json

upsert_env WEB_NEXT_PUBLIC_API_URL https://cityfarm.id.vn/api
upsert_env WEB_NEXT_PUBLIC_APP_URL https://cityfarm.id.vn
upsert_env ADMIN_NEXT_PUBLIC_API_URL https://cityfarm.id.vn/api
upsert_env ADMIN_NEXT_PUBLIC_WEB_URL https://cityfarm.id.vn

upsert_env NEXT_PUBLIC_API_URL https://cityfarm.id.vn/api
upsert_env NEXT_PUBLIC_APP_URL https://cityfarm.id.vn
upsert_env NEXT_PUBLIC_WEB_URL https://cityfarm.id.vn

upsert_env LANDING_BIND_IP 127.0.0.1
upsert_env WEB_BIND_IP 127.0.0.1
upsert_env ADMIN_BIND_IP 127.0.0.1
upsert_env API_BIND_IP 127.0.0.1

delete_env GEMINI_API_KEY

echo "Updated $ENV_FILE"
```

## Service Account File

The GitHub Actions workflow can write the service-account file from `MODEL_API_SECRET_KEY_JSON_B64` or `MODEL_API_SECRET_KEY_JSON`.

If the file is provisioned manually on VPS instead, it must exist here:

```bash
/etc/cityfarm/model-api/gcp-service-account.json
```

Expected permissions:

```bash
sudo install -d -m 700 /etc/cityfarm/model-api
sudo chmod 600 /etc/cityfarm/model-api/gcp-service-account.json
```

Do not store this key under `DEPLOY_PATH`, `apps/model-api`, or any git checkout.

## Verification

After editing `.env`, run:

```bash
cd "$DEPLOY_PATH"

grep -E '^(MODEL_API_URL|NEST_API_URL|GCP_PROJECT_ID|GCP_LOCATION|MODEL_API_GCP_KEY_FILE_ON_VPS|MODEL_API_GOOGLE_APPLICATION_CREDENTIALS)=' .env

test "$(grep -E '^MODEL_API_URL=' .env | cut -d= -f2-)" = "http://model-api:3003"
test "$(grep -E '^NEST_API_URL=' .env | cut -d= -f2-)" = "http://api:3001"
```

If image refs already exist in `.env`, validate compose:

```bash
docker compose -f infra/deploy/docker-compose.vps.yml config >/tmp/cityfarm-compose.yml
```

After the next GitHub Actions deploy succeeds, verify readiness:

```bash
curl -sf http://127.0.0.1:3003/ready
curl -sf http://127.0.0.1:3001/ready
curl -sf -H "Host: cityfarm.id.vn" http://127.0.0.1/
```

If `/ready` fails for model-api, check whether the service-account file is present and readable, then inspect container logs:

```bash
sudo test -r /etc/cityfarm/model-api/gcp-service-account.json
docker compose -f infra/deploy/docker-compose.vps.yml logs --tail=100 model-api
```
