# **🌿 CITYFARM \- UI/UX Design Scheme & Guidelines**

**Phiên bản:** 1.0 (Dành cho MVP) **Nền tảng:** Mobile-First Web App (iOS/Android) **Tech Stack:** React, Tailwind CSS v4, Shadcn UI, Lucide Icons

## **1\. Nguyên tắc Thiết kế (Design Principles)**

Toàn bộ giao diện của CITYFARM phải tuân thủ 3 nguyên tắc cốt lõi:

1. **"Grow clean, live green" (Tự nhiên & Hiện đại):** Mang lại cảm giác tươi mát, sạch sẽ của không gian xanh thông qua màu sắc và khoảng trắng (white-space).

2. **Focus on Action (Hành động rõ ràng):** Người dùng luôn biết họ cần làm gì tiếp theo (Quét không gian, Tưới cây, Mua kit). Call-to-Action (CTA) phải nổi bật nhất trên màn hình.

3. **Gamified & Encouraging (Tích cực & Khích lệ):** Trồng cây dễ nản, thiết kế cần tạo động lực thông qua tiến trình (Progress bar), trạng thái khỏe mạnh, và các huy hiệu (Badges).

## **2\. Bảng Màu (Color Palette)**

Hệ thống sử dụng thang màu của Tailwind CSS. Tuyệt đối không hard-code mã màu Hex tùy tiện ngoài hệ thống này.

### **Màu Thương hiệu & Hành động chính (Primary Colors)**

Dùng cho định vị thương hiệu, các nút bấm (Buttons) quan trọng và liên kết.

* **Primary Base (green-600):** Màu nhận diện, nút bấm chính, icon hành động chính.

* **Primary Hover/Active (green-700):** Trạng thái khi nhấn/hover vào nút.

* **Primary Background (green-50 / green-100):** Nền của các thẻ (Card) cần nhấn mạnh hoặc trạng thái thành công.

### **Màu Trạng thái (Semantic & Status Colors)**

CITYFARM là app theo dõi sức khỏe cây, màu sắc có ý nghĩa cực kỳ quan trọng.

* **Thành công / Khỏe mạnh (Healthy):** Tone green (bg-green-100 text-green-700).

* **Cảnh báo / Cần chú ý (Warning / Action needed):** Tone orange hoặc yellow (bg-orange-100 text-orange-700, yellow-500). Dùng cho thẻ nhắc nhở tưới nước, bón phân, cây héo lá.

* **Nguy kịch / Lỗi (Critical / Error):** Tone red (bg-red-100 text-red-700, red-500). Dùng khi cây sắp chết hoặc thao tác lỗi.

* **Yếu tố Nước / Độ ẩm:** Tone blue (blue-600) cho các icon hình giọt nước.

* **AI (Trí tuệ nhân tạo):** Sử dụng kết hợp icon ✨ (Sparkles) với màu yellow-300 hoặc text gradient để làm nổi bật sự can thiệp của AI.

### **Màu Nền & Văn bản (Neutrals)**

* **Background App:** Xám nhạt bg-gray-50 hoặc bg-gray-100 để các Card trắng nổi bật.

* **Background Container:** Trắng bg-white cho nội dung chính, thẻ Card, thanh điều hướng.

* **Văn bản chính (Headings/Body):** text-gray-900 cho tiêu đề (rất đậm, dễ đọc), text-gray-600 cho đoạn văn và mô tả.

* **Văn bản phụ (Muted):** text-gray-400 hoặc text-gray-500 cho placeholder, ngày tháng.

## **3\. Hệ thống Chữ (Typography)**

Sử dụng Font hệ thống (System Sans-serif) để tối ưu tốc độ tải và đảm bảo hiển thị tự nhiên nhất trên cả iOS và Android.

| Cấp độ | Class Tailwind | Ứng dụng | Trọng lượng (Weight) |
| :---- | :---- | :---- | :---- |
| **H1 (Tiêu đề lớn)** | text-2xl | Tên App, Tiêu đề màn hình chính, Tên cây trong chi tiết | font-bold |
| **H2 (Tiêu đề mục)** | text-xl | Tên phần (Section), Tiêu đề Tab | font-bold |
| **H3 (Tiêu đề phụ)** | text-lg | Card Title lớn, Tên cây trong danh sách | font-bold / font-semibold |
| **Body (Văn bản chính)** | text-base | Nội dung mô tả, Input text | font-normal |
| **Body Small** | text-sm | Đoạn văn phụ, Label, Thời gian đăng bài | font-normal / font-medium |
| **Caption/Tag** | text-xs hoặc text-\[10px\] | Label của Bottom Nav, Badge, Status (Ngày trồng, %) | font-medium / font-bold uppercase |

## **4\. Bố cục & Không gian (Layout & Spacing)**

### **Mobile Container (Cực kỳ quan trọng)**

App được thiết kế cho di động nhưng có thể chạy trên trình duyệt web.

* Luôn bọc toàn bộ app trong một container canh giữa: w-full max-w-md min-h-screen bg-white mx-auto relative.

* Tuyệt đối không để nội dung tràn ra ngoài chiều rộng màn hình điện thoại (Max 448px).

### **Khoảng cách (Spacing)**

* **Padding màn hình:** Thường dùng px-4 hoặc px-6 cho khoảng cách từ mép màn hình đến nội dung.

* **Khoảng cách giữa các section:** Dùng space-y-4 hoặc space-y-6.

* **Khoảng cách trong Card:** Thường dùng p-4.

## **5\. UI Components & Patterns**

Sử dụng [Shadcn UI](https://ui.shadcn.com/) làm gốc và tùy biến theo style dưới đây.

### **5.1. Thẻ (Cards)**

* Hình dáng: Bo góc mềm mại rounded-xl hoặc rounded-2xl.

* Border & Bóng: Bỏ border đậm, dùng border-0 shadow-sm ring-1 ring-gray-100. Khi hover có thể thêm hover:shadow-md transition-shadow.

* Image Card: Ảnh luôn bọc trong thẻ có bo góc, dùng object-cover. Nếu có chữ nổi trên ảnh, bắt buộc phải có lớp overlay: bg-gradient-to-t from-black/70 to-transparent.

### **5.2. Nút bấm (Buttons)**

* **Primary Button:** bg-green-600 text-white rounded-md hover:bg-green-700 h-12 (hoặc h-14 cho nút quan trọng nhất).

* **Secondary/Outline:** variant="outline" border-green-600 text-green-700 hover:bg-green-50.

* **Floating Action Button (FAB \- Nút Camera):** Đặt ở giữa thanh điều hướng dưới cùng, hình tròn rounded-full w-16 h-16 \-top-10, có viền trắng border-\[6px\] border-white để tạo hiệu ứng khoét nền.

### **5.3. Nhãn & Trạng thái (Badges/Tags)**

* Thường dùng chữ nhỏ, in hoa hoặc Capitalize, bo góc rounded-full hoặc rounded-md.

* Các chỉ số quan trọng (Tiến độ %, Ngày) cần dùng font-semibold.

### **5.4. Iconography**

* Sử dụng thư viện **Lucide React**.

* Kích thước tiêu chuẩn: w-5 h-5 hoặc w-6 h-6. Độ dày nét (stroke-width) mặc định.

* Icon đi kèm text luôn có khoảng cách gap-2 hoặc mr-2.

## **6\. Nguyên tắc Code cho Front-end Team**

1. **Utility-First:** Sử dụng tối đa class của Tailwind. Hạn chế viết CSS custom vào index.css trừ khi làm animation phức tạp (như hiệu ứng quét QR animate-scan-down).

2. **Tái sử dụng Component:** Nút, Thẻ, Badge... phải dùng thông qua component của components/ui/ (Shadcn), không code lại từ đầu thẻ HTML raw.

3. **Tương tác (Interaction):** Mọi nút bấm hoặc thẻ có thể click (clickable card) đều phải có hiệu ứng phản hồi: hover:bg-..., active:scale-95, transition-all.

4. **Z-Index & Portals:** Các overlay như Modal quét QR hoặc Chat AI phải dùng createPortal với z-index cực cao (z-\[9999\]) để đảm bảo không bị kẹt dưới bottom navigation hoặc container của mobile.

