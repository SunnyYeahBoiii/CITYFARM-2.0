# Deploy lên VPS bằng GitHub Actions

Pipeline này build 5 image Docker từ monorepo rồi push lên GHCR:

- `landing`
- `web`
- `admin`
- `api`
- `model-api`

Sau đó workflow upload `docker-compose.vps.yml` + Nginx templates lên VPS, cập nhật file `.env`, ghi exact SHA image refs, pull image mới và chạy `docker compose up -d`.

`NEXT_PUBLIC_*` của Next.js được bake vào image lúc build, nên các secret public URL bên dưới phải được set đúng trước khi workflow chạy.
Nếu thiếu URL bắt buộc, workflow và runtime sẽ fail-fast với message rõ ràng thay vì fallback ngầm về localhost.

## 1. Chuẩn bị VPS

Cài sẵn:

- Docker Engine
- Docker Compose plugin (`docker compose`)
- Nginx
- Certbot + plugin `python3-certbot-nginx`
- user deploy có quyền chạy Docker
- passwordless `sudo` nếu workflow được phép cài/reload Nginx và ghi key vào `/etc/cityfarm`

Tạo thư mục deploy, ví dụ:

```bash
mkdir -p /home/deploy/apps/cityfarm
```

Tạo file `.env` tại `DEPLOY_PATH` từ `infra/deploy/.env.vps.example`. Workflow sẽ tự tạo các thư mục con và upload deploy files, nên VPS không cần clone repo để deploy container.

Nếu bạn dùng Nginx hoặc Caddy trên host để reverse proxy, giữ `*_BIND_IP=127.0.0.1`.
Nếu muốn mở port trực tiếp ra internet, đổi `*_BIND_IP=0.0.0.0`.

## 2. GitHub Secrets bắt buộc

### SSH / deploy

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`

### Web

- `WEB_NEXT_PUBLIC_API_URL`
- `WEB_NEXT_PUBLIC_APP_URL`

### Admin

- `ADMIN_NEXT_PUBLIC_API_URL`
- `ADMIN_NEXT_PUBLIC_WEB_URL`

### Runtime env bắt buộc trong VPS `.env`

Workflow sẽ SSH vào VPS, tự upsert các biến `GCP_*` cho `model-api` từ GitHub Secrets, sau đó validate các key bắt buộc trong file `.env` tại `DEPLOY_PATH`:

- `LANDING_IMAGE`
- `WEB_IMAGE`
- `ADMIN_IMAGE`
- `API_IMAGE`
- `MODEL_API_IMAGE`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET_NAME`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`
- `WEB_ORIGINS`
- `WEB_NEXT_PUBLIC_API_URL`
- `WEB_NEXT_PUBLIC_APP_URL`
- `ADMIN_NEXT_PUBLIC_API_URL`
- `ADMIN_NEXT_PUBLIC_WEB_URL`
- `NEST_API_URL`
- `MODEL_API_URL`
- `GCP_PROJECT_ID`
- `GCP_LOCATION`
- `MODEL_API_GCP_KEY_FILE_ON_VPS`
- `MODEL_API_GOOGLE_APPLICATION_CREDENTIALS`
- `LETSENCRYPT_EMAIL` (khuyến nghị, dùng để đăng ký SSL cert; nếu bỏ trống sẽ fallback `admin@APP_DOMAIN`)

### GitHub Secrets bổ sung cho Model API (Vertex AI)

- `MODEL_API_GCP_PROJECT_ID`
- `MODEL_API_GCP_LOCATION`
- `MODEL_API_GCP_API_KEY` (tuỳ chọn)
- `MODEL_API_SECRET_KEY_JSON_B64` (khuyến nghị: base64 service-account JSON)
- `MODEL_API_SECRET_KEY_JSON` (fallback raw JSON, kém bền hơn với multiline env)
- `MODEL_API_GCP_KEY_FILE_ON_VPS` (tuỳ chọn; default `/etc/cityfarm/model-api/gcp-service-account.json`)

Nếu không truyền `MODEL_API_SECRET_KEY_JSON_B64` hoặc `MODEL_API_SECRET_KEY_JSON`, workflow sẽ dùng file đã provision sẵn tại `MODEL_API_GCP_KEY_FILE_ON_VPS` trên VPS.

### URL format checks (deploy `.env`)

- `NEST_API_URL`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`
- `WEB_NEXT_PUBLIC_API_URL`
- `WEB_NEXT_PUBLIC_APP_URL`
- `ADMIN_NEXT_PUBLIC_API_URL`
- `ADMIN_NEXT_PUBLIC_WEB_URL`
- `MODEL_API_URL`

## 3. GitHub Variables tùy chọn

- `DEPLOY_PATH`

Workflow dùng `DEPLOY_PATH` (mặc định `/root/CITYFARM-2.0`). Nếu deploy bằng non-root user, set GitHub Variable này thành path user ghi được, ví dụ `/home/deploy/apps/cityfarm`.

## 4. Trigger deploy

Workflow nằm ở `.github/workflows/deploy-vps.yml`.
Workflow có guard kiểm tra:
- secret URL bắt buộc trước bước build image
- biến `.env` bắt buộc trước `docker compose up`
- định dạng URL (`http://` hoặc `https://`) cho các biến URL quan trọng
- exact image tag `${GITHUB_SHA}` thay vì deploy bằng mutable `latest`
- model-api readiness qua `/ready`
- API readiness qua `/ready`
- `prisma:migrate:deploy` nếu API image có committed migration directories

Hiện tại pipeline tự chạy khi:

- push lên branch `main`
- chạy tay qua `workflow_dispatch`

Nếu bạn muốn deploy từ branch khác, sửa `on.push.branches`.

## 5. Thiết lập Nginx + SSL

Workflow hiện tự động apply Nginx theo domain app (`APP_DOMAIN`) ở mỗi lần deploy:

- cài `nginx` nếu VPS chưa có (Ubuntu/Debian, qua `apt-get`)
- cài `certbot` + `python3-certbot-nginx` nếu VPS chưa có
- copy `infra/nginx/cityfarm.http.conf.template` vào `/etc/nginx/sites-available/cityfarm.conf`
- enable site + disable default site
- `nginx -t` rồi reload/restart service

Nếu `WEB_NEXT_PUBLIC_APP_URL` dùng `https://...`, workflow sẽ tự:

- xin/gia hạn cert Let's Encrypt cho `APP_DOMAIN` bằng webroot challenge
- apply `infra/nginx/cityfarm.https.conf.template`
- bật redirect HTTP -> HTTPS

Bạn không cần SSH để cấu hình reverse proxy thủ công cho flow HTTP/HTTPS nếu DNS đã trỏ đúng về VPS.

Map mặc định:

- `cityfarm.id.vn` -> `127.0.0.1:3000` (web)
- `cityfarm.id.vn/admin` -> `127.0.0.1:3002` (admin)
- `cityfarm.id.vn/api` -> `127.0.0.1:3001` (api)

`model-api` không public trực tiếp.

### Trường hợp debug nhanh qua IP VPS

Mặc định khuyến nghị dùng domain `cityfarm.id.vn`. Nếu cần debug nhanh có thể truy cập trực tiếp bằng IP VPS:

1. `infra/deploy/docker-compose.vps.yml` đã bind localhost:
   - `127.0.0.1:3000 -> web:3000`
   - `127.0.0.1:3002 -> admin:3000`
   - `127.0.0.1:3001 -> api:3001`
2. Copy template Nginx:

```bash
sudo cp infra/nginx/cityfarm.http.conf.template /etc/nginx/sites-available/cityfarm.conf
sudo ln -sf /etc/nginx/sites-available/cityfarm.conf /etc/nginx/sites-enabled/cityfarm.conf
sudo nginx -t
sudo systemctl reload nginx
```

3. Truy cập landing page qua:

```text
http://<VPS_IP>/
```

Template trên route sẵn landing page (`/`) và có comment sẵn block cho `/api/` + `/admin/` để bật khi cần.
Khi có domain, chuyển sang flow SSL ở trên (Certbot + server_name theo domain).

## 6. Trình tự deploy hoàn chỉnh

1. Trỏ DNS `A record` của app domain về VPS.
2. SSH vào VPS, tạo `DEPLOY_PATH` và file `.env` từ `infra/deploy/.env.vps.example`.
3. Chạy workflow để build image, pull image mới, deploy app và auto-apply Nginx HTTP config.
4. Nếu `WEB_NEXT_PUBLIC_APP_URL` là `https://...`, workflow tự xin/gia hạn cert Let's Encrypt.
5. Từ lần sau chỉ cần push `main`, GitHub Actions sẽ tự build và deploy container mới theo SHA.

## 7. File tham khảo

- `infra/deploy/.env.vps.example`
- `infra/deploy/docker-compose.vps.yml`
- `infra/nginx/cityfarm.http.conf.template`
- `infra/nginx/cityfarm.https.conf.template`
