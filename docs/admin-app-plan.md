# CITYFARM Admin App Plan

## 1. Muc tieu

Tao mot admin app rieng trong monorepo de quan ly cac module van hanh co ban, khong tron vao `apps/web`:

- Newsfeed posts
- Marketplace listings/cay trong dang ban
- Orders
- Users va role co ban
- Cau hinh he thong va asset moderation o muc toi thieu

Admin app phai:

- La mot app doc lap trong monorepo
- Dung Next.js App Router nhu web hien tai
- Co deployment/build rieng
- Tai su dung nhung package chung thuc su can thiet, khong phu thuoc vao mobile shell

## 2. Hien trang repo

Repo hien tai da la Turborepo:

- Root scripts chay qua `turbo run ...`
- Workspace dang quet `apps/*` va `packages/*`
- `apps/web` dung Next.js App Router
- `apps/api` la NestJS API chinh
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config` da ton tai

Nhan xet quan trong:

- Frontend da co `UserRole.ADMIN` o layer web, nhung chua co luong admin app rieng
- Community API hien moi phuc vu end-user feed/listing
- Order API hien moi co tao order, chua co list/update cho admin
- Visual language cua mobile da ro rang: earthy background, green deep, soil accent, card trang bo tron, topbar mo blur

## 3. Cau truc monorepo de xuat

```text
apps/
  web/                 # app hien tai cho nguoi dung/mobile shell
  admin/               # app admin moi, deploy rieng
  api/                 # NestJS backend
  model-api/

packages/
  ui/                  # primitives chung co the tai su dung
  admin-ui/            # admin-only components: table, filters, stats, shell
  api-client/          # typed fetchers/SDK dung chung giua web va admin
  auth/                # getUser, role helpers, cookie/session mapping dung chung
  domain-types/        # FeedPost, MarketListing, OrderSummary, UserSummary...
  eslint-config/
  typescript-config/
```

Nguyen tac tach biet:

- `apps/web` giu mobile shell va UX hien tai, khong them route admin vao day.
- `apps/admin` la desktop-first dashboard rieng, co login/layout/metadata/guards rieng.
- `apps/api` tiep tuc la backend trung tam; admin dung chung API nhung se mo them namespace `/admin/*`.
- Package chung chi chua primitive, type, auth util, API client. Khong share screen-level component giua web va admin.

## 4. Chien luoc chia se package

### Bat buoc chia se

- `packages/api-client`
  - Dong goi base client, auth-aware fetch, query keys, parser, error mapping
  - Tach rieng de `web` va `admin` khong tu viet lai giao tiep API

- `packages/auth`
  - Chua role enum, auth helpers, `requireRole`, session mapping
  - Dung cho server guards trong App Router va cho client provider

- `packages/domain-types`
  - Chua type DTO chung cho feed, marketplace, order, user
  - Giup admin va web dong bo contract nhanh hon

### Co the chia se sau phase 1

- `packages/admin-ui`
  - DataTable
  - FilterBar
  - KPI cards
  - Empty states
  - Confirm dialogs
  - Status badges

### Khong nen chia se truc tiep

- CSS/module cua mobile
- Screen components trong `apps/web/components/cityfarm/*`
- Mobile shell topbar + bottom dock

Ly do:

- Admin co mat do thong tin va interaction khac hoan toan
- Neu share qua muc se tao coupling giua mobile app va dashboard

## 5. De xuat `apps/admin`

### Stack

- Next.js App Router
- React 19
- Tailwind v4 nhu `apps/web`
- Metadata/layout/loading/error boundaries theo chuan App Router
- Server-side guard cho nhom route admin

### Route groups

```text
apps/admin/app/
  (public)/
    login/page.tsx
    forgot-password/page.tsx            # neu can

  (admin)/
    layout.tsx                          # admin shell + role guard
    loading.tsx
    error.tsx
    dashboard/page.tsx

    content/
      posts/page.tsx
      posts/[postId]/page.tsx

    marketplace/
      listings/page.tsx
      listings/[listingId]/page.tsx

    orders/
      page.tsx
      [orderId]/page.tsx

    users/
      page.tsx
      [userId]/page.tsx

    assets/
      page.tsx                          # phase 2

    settings/
      page.tsx
```

### Shell admin

- Desktop/tablet first shell
- Left sidebar + sticky topbar
- Global search
- Workspace tabs/breadcrumb
- Notification area
- Quick filters theo module

### Auth/admin entrypoint

- `login` tach rieng khoi `apps/web`
- Sau login, route group `(admin)` kiem tra:
  - da dang nhap
  - co role `ADMIN`
- Neu khong dung role:
  - redirect sang login
  - hoac trang `403`

Khuyen nghi:

- Dung chung session/cookie backend neu cung domain/subdomain
- Neu admin deploy o subdomain rieng, can chot cookie domain strategy ngay tu dau

## 6. Ban do module admin

### 6.1 Dashboard

Muc tieu:

- Tong quan van hanh trong ngay
- Tam diem can xu ly ngay lap tuc

Widget chinh:

- KPI: so post moi, listing moi, order moi, order tre, listing sap het han
- Feed moderation queue
- Order status breakdown
- Marketplace activity theo district
- Recent actions timeline

### 6.2 Content / Posts

Muc tieu:

- Quan ly newsfeed/community posts

Tac vu:

- List/search/filter theo post type, district, owner, publish state
- Xem detail post
- Hide/unpublish/delete/restore
- Xem comment/reaction summary
- Flag/moderation note

### 6.3 Marketplace / Listings

Muc tieu:

- Quan ly cay trong/listing dang ban trong marketplace

Tac vu:

- List/search/filter theo district, seller, verified grower, expiry, active state
- Xem detail listing + seller + lien ket garden plant neu co
- Approve/hide/remove listing
- Xem tinh trang asset hinh anh

### 6.4 Orders

Muc tieu:

- Quan ly don hang ecommerce/co ban

Tac vu:

- List/filter theo status, ngay tao, loai san pham, buyer
- Xem chi tiet order, item, giao hang, note
- Cap nhat status
- Them internal note
- Track don tre, don can lien he

### 6.5 Users

Muc tieu:

- Quan ly tai khoan va role co ban

Tac vu:

- Search user
- Xem profile tong hop
- Xem role/grower verification
- Khoa/mo khoa tai khoan neu can
- Gan role admin/supplier/expert theo permission policy

### 6.6 Settings

Muc tieu:

- Cau hinh van hanh co ban

Tac vu:

- System config nhe
- Lookup data
- Permission matrix read-only o phase 1

## 7. Phan backend can bo sung de admin dung duoc

## 7.1 Da co

- Feed endpoints cho user:
  - list/detail/create/delete post
  - comment/reaction
- Marketplace endpoints cho user:
  - list/create/delete listing
- Orders:
  - create order

## 7.2 Chua co nhung bat buoc cho admin

- RBAC thuc su o backend
- Admin guards/decorators
- Admin list endpoints co search/sort/filter
- Admin detail endpoints gom du lieu lien quan
- Update status/publish state
- Soft delete/hide/unpublish
- Audit log/internal note

## 7.3 Namespace API de xuat

```text
/admin/auth/me
/admin/dashboard/summary

/admin/posts
/admin/posts/:id
/admin/posts/:id/publish
/admin/posts/:id/hide
/admin/posts/:id/delete

/admin/marketplace/listings
/admin/marketplace/listings/:id
/admin/marketplace/listings/:id/approve
/admin/marketplace/listings/:id/hide
/admin/marketplace/listings/:id/delete

/admin/orders
/admin/orders/:id
/admin/orders/:id/status
/admin/orders/:id/note

/admin/users
/admin/users/:id
/admin/users/:id/role
/admin/users/:id/status
```

Nguyen tac:

- Khong sua API end-user de giong admin
- Them namespace `/admin/*` ro rang de permission va observability don gian

## 8. Dinh huong UI/UX cho admin

## 8.1 DNA ke thua tu mobile

Giu lai nhung thanh phan nhan dien tot nhat tu mobile:

- Bang mau earth/green/soil
- Nen sang co gradient mem
- Card trang, border nhe, shadow mem
- CTA xanh dam
- Radius lon 16-24px
- Microcopy ngan, ro

Khong mang nguyen xi mobile shell vao admin. Admin nen la dashboard desktop-first.

## 8.2 Design direction

Huong UI nen theo:

- Data-dense dashboard
- Earthy operations console
- Reliability > decorative effects

Palette de xuat:

- Primary: `#355B31`
- Secondary: `#79965E`
- Accent/Warning: `#CD924A`
- Surface: `#FFFFFF`
- Screen: `#F8FAF7`
- Background: `#F4EFE4`
- Text strong: `#1F2916`
- Text muted: `#5C6B5F`

Typography:

- Tiep tuc dung `Geist Sans`/`Geist Mono` nhu web hien tai de dong bo va tranh external font
- `Geist Mono` chi dung cho order code, ID, metric delta, log snippet

## 8.3 Component system admin

- Sidebar navigation
- Sticky topbar
- KPI cards
- Data table
- Filter bar
- Search input
- Segmented status tabs
- Drawer/side panel cho quick detail
- Full detail page cho item phuc tap
- Confirm dialog cho moderation actions
- Empty state
- Skeleton loading
- Status badge

## 8.4 Pattern theo man hinh

### Dashboard

- Hero metrics 4-6 card
- 2 chart chinh
- 2 queue card o ben phai
- Recent activity table o duoi

### Posts

- Table + bo loc
- Detail drawer de review nhanh
- Preview media/card ben trong detail

### Marketplace

- Table mode mac dinh
- Co card preview cho image-heavy listing
- District, seller, expiry la filter co san

### Orders

- Table co frozen columns cho code/status/createdAt
- Detail page chia 3 cot:
  - order info
  - item info
  - shipping/internal notes

### Users

- Search-centric
- Summary cards tren dau
- Role va verification la action noi bat

## 8.5 Responsive

- >=1280px: day du sidebar + multi-column dashboard
- 1024-1279px: sidebar collapse, table van la mode chinh
- <1024px: admin van hoat dong duoc nhung uu tien tablet shell
- <768px: table phai co `overflow-x-auto` hoac chuyen sang stacked cards

## 8.6 Anti-patterns

- Nhet mobile bottom dock vao admin
- Qua nhieu glass effect gay giam do doc bang du lieu
- Dung mau moi lech khoi CITYFARM
- Table khong co filter/search bulk actions
- Dialog qua nhieu buoc cho tac vu moderation don gian

## 9. Lo trinh trien khai

### Phase 0 - Alignment

- Chot pham vi phase 1: posts, marketplace listings, orders
- Chot auth strategy cho admin domain
- Chot naming: `apps/admin`, `/admin/*`

### Phase 1 - Monorepo foundation

- Scaffold `apps/admin`
- Cau hinh scripts build/dev/lint/check-types
- Tao admin layout, metadata, login, protected route group
- Tach package chung toi thieu: `api-client`, `auth`, `domain-types`

### Phase 2 - Backend admin enablement

- Them RBAC guard/decorator trong NestJS
- Them `/admin/posts`, `/admin/marketplace/listings`, `/admin/orders`
- Them search/filter/pagination/sort
- Them update status/hide actions

### Phase 3 - Core UI modules

- Dashboard
- Posts management
- Marketplace listings management
- Orders management

### Phase 4 - Operational hardening

- Audit log
- Internal notes
- Bulk actions
- Error monitoring
- Empty/loading/error states hoan chinh

### Phase 5 - Expansion

- Users/roles
- Asset management
- Supplier/expert workflows
- Reporting nang cao

## 10. Quyet dinh can chot som

1. Admin app co dung chung cookie/session voi web hay khong?
2. Admin se goi truc tiep `apps/api` hay them BFF rieng?
3. Order lifecycle se dung enum nao cho update status?
4. Marketplace moderation la hard delete hay hide/soft delete?
5. Phase 1 co can users/roles hay chi can posts + listings + orders?

## 11. Khuyen nghi chot

Khuyen nghi practical nhat:

- Tao `apps/admin` rieng trong monorepo, khong nhung vao `apps/web`
- Giu chung `apps/api`, bo sung namespace `/admin/*`
- Phase 1 chi lam:
  - dashboard
  - posts
  - marketplace listings
  - orders
- UI admin ke thua token mau va cam giac CITYFARM, nhung dung shell desktop-first
- Sau khi phase 1 on dinh moi tach them `packages/admin-ui`
