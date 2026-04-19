# Deploy lên VPS bằng GitHub Actions

Pipeline này build 4 image Docker từ monorepo rồi push lên GHCR:

- `web`
- `admin`
- `api`
- `model-api`

Sau đó workflow SSH vào VPS, cập nhật file `.env`, `docker-compose.vps.yml`, pull image mới và chạy `docker compose up -d`.

`NEXT_PUBLIC_*` của Next.js được bake vào image lúc build, nên các secret public URL bên dưới phải được set đúng trước khi workflow chạy.

## 1. Chuẩn bị VPS

Cài sẵn:

- Docker Engine
- Docker Compose plugin (`docker compose`)
- Nginx
- Certbot + plugin `python3-certbot-nginx`
- user deploy có quyền chạy Docker

Tạo thư mục deploy, ví dụ:

```bash
mkdir -p /home/deploy/apps/cityfarm
```

Repo đã có sẵn script bootstrap Ubuntu để cài toàn bộ stack host:

```bash
sudo bash /home/deploy/apps/cityfarm/bootstrap-ubuntu-vps.sh deploy
```

Trong đó `deploy` là user chạy workflow/deploy trên VPS.

Nếu bạn dùng Nginx hoặc Caddy trên host để reverse proxy, giữ `*_BIND_IP=127.0.0.1`.
Nếu muốn mở port trực tiếp ra internet, đổi `*_BIND_IP=0.0.0.0`.

## 2. GitHub Secrets bắt buộc

### SSH / deploy

- `VPS_HOST`
- `VPS_PORT`
- `VPS_USER`
- `VPS_SSH_KEY`
- `GHCR_USERNAME`
- `GHCR_TOKEN`
- `LETSENCRYPT_EMAIL`

`GHCR_TOKEN` nên là GitHub PAT có ít nhất quyền `read:packages`.

### Web

- `WEB_NEXT_PUBLIC_API_URL`
- `WEB_NEXT_PUBLIC_APP_URL`

### Admin

- `ADMIN_NEXT_PUBLIC_API_URL`
- `ADMIN_NEXT_PUBLIC_WEB_URL`

### API

- `API_DATABASE_URL`
- `API_DIRECT_URL`
- `API_SUPABASE_URL`
- `API_SUPABASE_SERVICE_ROLE_KEY`
- `API_SUPABASE_BUCKET_NAME`
- `API_SUPABASE_PUBLISHABLE_KEY`
- `API_SUPABASE_SECRET_KEY`
- `API_JWT_REFRESH_SECRET`
- `API_JWT_ACCESS_SECRET`
- `API_GOOGLE_CLIENT_ID`
- `API_GOOGLE_CLIENT_SECRET`
- `API_GOOGLE_CALLBACK_URL`
- `API_FRONTEND_URL`
- `API_WEB_ORIGINS`

### Model API

- `MODEL_GEMINI_API_KEY`

## 3. GitHub Variables tùy chọn

- `DEPLOY_PATH`
- `APP_DOMAIN`
- `ADMIN_DOMAIN`
- `API_DOMAIN`
- `NGINX_CLIENT_MAX_BODY_SIZE`
- `WEB_UPSTREAM_HOST`
- `ADMIN_UPSTREAM_HOST`
- `API_UPSTREAM_HOST`
- `WEB_BIND_IP`
- `WEB_HOST_PORT`
- `ADMIN_BIND_IP`
- `ADMIN_HOST_PORT`
- `API_BIND_IP`
- `API_HOST_PORT`
- `MODEL_BIND_IP`
- `MODEL_HOST_PORT`

Nếu không khai báo, workflow sẽ dùng mặc định trong file workflow.

## 4. Trigger deploy

Workflow nằm ở `.github/workflows/deploy-vps.yml`.

Hiện tại pipeline tự chạy khi:

- push lên branch `main`
- chạy tay qua `workflow_dispatch`

Nếu bạn muốn deploy từ branch khác, sửa `on.push.branches`.

## 5. Thiết lập Nginx + SSL

Workflow chỉ upload bundle deploy. Phần cài Nginx/cấp cert là one-time trên VPS:

```bash
cd /home/deploy/apps/cityfarm
chmod +x bootstrap-ubuntu-vps.sh setup-nginx.sh deploy.sh
sudo ./bootstrap-ubuntu-vps.sh deploy
sudo DEPLOY_PATH=/home/deploy/apps/cityfarm ./setup-nginx.sh
```

Script `setup-nginx.sh` sẽ:

- đọc domain từ file `.env`
- tạo config Nginx cho `app/admin/api`
- xin cert Let's Encrypt cho cả 3 domain
- bật HTTPS redirect
- reload Nginx

Map mặc định:

- `app.example.com` -> `127.0.0.1:3000`
- `admin.example.com` -> `127.0.0.1:3003`
- `api.example.com` -> `127.0.0.1:3001`

`model-api` không public trực tiếp.

## 6. Trình tự deploy hoàn chỉnh

1. Trỏ DNS `A record` của `APP_DOMAIN`, `ADMIN_DOMAIN`, `API_DOMAIN` về VPS.
2. Chạy workflow một lần để upload bundle và file `.env` lên VPS.
3. SSH vào VPS, chạy `bootstrap-ubuntu-vps.sh`.
4. Chạy `setup-nginx.sh` để cấp SSL và bật reverse proxy.
5. Từ lần sau chỉ cần push `main`, GitHub Actions sẽ tự build và deploy container mới.

## 7. File tham khảo

- `infra/deploy/.env.vps.example`
- `infra/deploy/docker-compose.vps.yml`
- `infra/deploy/deploy.sh`
- `infra/deploy/bootstrap-ubuntu-vps.sh`
- `infra/deploy/setup-nginx.sh`
- `infra/nginx/cityfarm.http.conf.template`
- `infra/nginx/cityfarm.https.conf.template`
