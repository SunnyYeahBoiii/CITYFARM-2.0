#!/usr/bin/env bash

set -euo pipefail

DEPLOY_USER="${1:-${SUDO_USER:-}}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script with sudo or as root"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release nginx certbot python3-certbot-nginx gettext-base ufw

install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

CODENAME="$(. /etc/os-release && echo "${VERSION_CODENAME}")"
ARCH="$(dpkg --print-architecture)"

cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable
EOF

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker
systemctl enable --now nginx

if [[ -n "${DEPLOY_USER}" ]]; then
  usermod -aG docker "${DEPLOY_USER}"
fi

ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
ufw --force enable || true

echo "Bootstrap completed."
if [[ -n "${DEPLOY_USER}" ]]; then
  echo "User '${DEPLOY_USER}' was added to the docker group. Re-login before deploying."
fi
