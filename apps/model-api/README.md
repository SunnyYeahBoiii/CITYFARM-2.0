# 🤖 CITYFARM 2.0 - Model API (AI Service)

Đây là Microservice chịu trách nhiệm xử lý các tác vụ Trí tuệ Nhân tạo (AI) cho hệ sinh thái CITYFARM 2.0. Service này hoạt động như một lớp trung gian (Wrapper) giao tiếp trực tiếp với **Google Gemini API**, cung cấp các endpoint phân tích tình trạng cây trồng và tư vấn chăm sóc dựa trên ngữ cảnh thực tế.

## 🛠️ Tech Stack

* **Runtime:** Python 3.10+
* **Framework:** Flask
* **AI SDK:** `google-genai` (Google's latest official SDK)
* **Package Manager:** Poetry (v2.0+ chuẩn PEP 621)

---

## ⚙️ Yêu cầu môi trường (Prerequisites)

Nếu bạn chạy service này độc lập (không dùng Docker), máy tính của bạn cần cài đặt sẵn:
* Python 3.10 trở lên.
* [Poetry](https://python-poetry.org/docs/) để quản lý môi trường ảo và thư viện.
* Google Gemini API Key (Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/)).

---

### Cấu hình biến môi trường

1.  Copy tệp mẫu:
    ```bash
    cp .env.example .env
    ```
2.  Mở tệp `.env` vừa tạo và điền API Key của bạn. 
    **Lưu ý cực kỳ quan trọng:** Tuyệt đối KHÔNG sử dụng dấu ngoặc kép (`" "`) bọc quanh giá trị của Key.
    ```env
    PORT=3002
    GEMINI_API_KEY=AIzaSy...your_actual_key_here
    ```
