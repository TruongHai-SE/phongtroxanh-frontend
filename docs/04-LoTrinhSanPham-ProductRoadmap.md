# PRODUCT ROADMAP & MVP FEATURES - PHÒNG TRỌ XANH

---

## 1. PHƯƠNG PHÁP PHÁT TRIỂN

### Agile Scrum — Sprint 2 tuần

| Yếu tố | Chi tiết |
|---------|----------|
| **Sprint length** | 2 tuần |
| **Số sprint** | 6 sprints = 12 tuần |
| **Daily standup** | 15 phút mỗi sáng (online qua Discord/Zalo) |
| **Sprint review** | Cuối mỗi sprint — demo cho cả nhóm |
| **Backlog tool** | Trello hoặc GitHub Projects (miễn phí) |
| **Version control** | Git + GitHub (branching: main → develop → feature/) |
| **CI/CD** | GitHub Actions — auto build & test khi push |

---

## 2. MVP FEATURE LIST (MoSCoW)

### Must Have (Phải có trong MVP)

| # | Feature | Mô tả | Sprint |
|---|---------|-------|--------|
| F1 | **Đăng ký / Đăng nhập OTP** | Xác thực qua số điện thoại, JWT token | Sprint 1 |
| F2 | **Phân quyền Tenant / Landlord** | Chọn vai trò khi đăng ký, UI khác nhau | Sprint 1 |
| F3 | **Đăng phòng trọ** | Landlord đăng tin: ảnh, giá, địa chỉ, tiện nghi, giá điện/nước | Sprint 2 |
| F4 | **Tìm kiếm & Bộ lọc** | Lọc theo giá, quận, loại phòng, tiện nghi | Sprint 2 |
| F5 | **Chi tiết phòng** | Xem ảnh, giá đầy đủ, vị trí bản đồ, thông tin chủ trọ | Sprint 2 |
| F6 | **Bản đồ tìm phòng** | Hiển thị phòng trên bản đồ, tìm phòng gần trường | Sprint 3 |
| F7 | **Profile Roommate** | Tạo hồ sơ: ngân sách, thói quen, khu vực mong muốn | Sprint 3 |
| F8 | **Swipe Matching** | Giao diện swipe trái/phải để chọn bạn ở cùng | Sprint 4 |
| F9 | **Chat real-time** | Nhắn tin giữa tenant-landlord và tenant-tenant khi match | Sprint 4 |
| F10 | **Upload CCCD** | Chủ trọ upload ảnh CCCD, admin review thủ công | Sprint 5 |
| F11 | **Check-in xác thực thuê** | Xác nhận bàn giao nhận phòng (1-click hoặc OTP) để liên kết Tenant-Room | Sprint 5 |
| F12 | **Đánh giá 2 chiều** | Chỉ mở sau check-in, đánh giá 2 chiều và cập nhật TrustScore | Sprint 5 |
| F13 | **Hoán đổi bạn cùng phòng**| Luồng Swap roommate phân vai trò Leaseholder vs Co-tenant | Sprint 5 |

### Should Have (Nên có)

| # | Feature | Mô tả | Sprint |
|---|---------|-------|--------|
| S1 | **Duyệt/Quản lý đánh giá**| Xem danh sách đánh giá, ẩn review vi phạm cộng đồng | Sprint 5 |
| S2 | **Lưu phòng yêu thích** | Bookmark phòng để xem lại | Sprint 5 |
| S3 | **Push Notification** | Thông báo match mới, tin nhắn mới | Sprint 5 |
| S4 | **Admin Dashboard** | Quản lý CCCD chờ duyệt, báo cáo, thống kê | Sprint 5-6 |
| S5 | **Tin đăng nổi bật (Boost)** | Landlord trả phí để tin hiện lên đầu | Sprint 6 |

### Could Have (Có thể thêm sau)

| # | Feature | Mô tả |
|---|---------|-------|
| C1 | **Hợp đồng mẫu** | Tạo hợp đồng thuê từ template |
| C2 | **Thanh toán online** | Tích hợp MoMo/VNPay cho boost tin |
| C3 | **Landlord Analytics** | Số lượt xem, tỉ lệ liên hệ |
| C4 | **So sánh phòng** | So sánh 2-3 phòng cạnh nhau |
| C5 | **Lịch xem phòng** | Đặt lịch hẹn xem phòng qua app |

### Won't Have (Không làm trong MVP)

- Thanh toán tiền thuê hàng tháng qua app
- Video tour phòng (360°)
- AI chatbot tư vấn
- Đa ngôn ngữ (chỉ tiếng Việt)
- iOS/Android native app (web responsive đủ dùng)

---

## 3. SPRINT PLAN CHI TIẾT (12 TUẦN)

### SPRINT 1 (Tuần 1-2): Foundation & Authentication
**Mục tiêu:** Setup dự án, hệ thống đăng nhập hoạt động

| Task | Assignee | Ngày |
|------|----------|------|
| Setup solution Spring Boot + React project structure | Dev 1 | T1-T2 |
| Setup GitHub repo, branching strategy, CI/CD | Dev 1 | T1-T2 |
| Database design + Flyway migrations | Dev 1 | T3-T4 |
| Auth API: Send OTP, Verify OTP, JWT | Dev 2 | T3-T7 |
| Setup Twilio/Stringee SMS integration | Dev 2 | T5-T6 |
| React project setup, routing, UI kit | Dev 3 | T1-T3 |
| Trang đăng nhập/đăng ký UI + OTP flow | Dev 3 | T4-T7 |
| Role selection screen (Tenant/Landlord) | Dev 3 | T8-T10 |
| Thiết kế logo, brand identity | Marketing 1 | T1-T5 |
| Tạo fanpage Facebook, TikTok | Marketing 1 | T5-T10 |
| Khảo sát sinh viên (Google Form) | Marketing 2 | T1-T10 |
| Phân tích tài chính chi tiết | BA | T1-T10 |

**Deliverable:** User có thể đăng ký/đăng nhập bằng SĐT

---

### SPRINT 2 (Tuần 3-4): Room Listings
**Mục tiêu:** Chủ trọ đăng phòng, người thuê tìm phòng

| Task | Assignee | Ngày |
|------|----------|------|
| Room CRUD API (create, read, update, delete) | Dev 2 | T1-T5 |
| Image upload to Cloudinary | Dev 2 | T5-T7 |
| Search & Filter API (giá, quận, tiện nghi) | Dev 2 | T7-T10 |
| Trang đăng phòng UI (form + upload ảnh) | Dev 3 | T1-T5 |
| Trang danh sách phòng + bộ lọc UI | Dev 3 | T5-T8 |
| Trang chi tiết phòng UI | Dev 3 | T8-T10 |
| Code review, testing, bug fix | Dev 1 | T5-T10 |
| Pagination, error handling | Dev 1 | T1-T5 |
| Bắt đầu content TikTok (tips tìm trọ) | Marketing 1 | T1-T10 |
| Khảo sát chủ trọ quanh FPT | Marketing 2 | T1-T10 |

**Deliverable:** Landlord đăng phòng, tenant tìm và xem phòng

---

### SPRINT 3 (Tuần 5-6): Map + Roommate Profile
**Mục tiêu:** Bản đồ hoạt động, profile roommate sẵn sàng

| Task | Assignee | Ngày |
|------|----------|------|
| Goong Maps API integration | Dev 1 | T1-T5 |
| Nearby rooms API (geo query) | Dev 1 | T5-T7 |
| UserProfile API (CRUD preferences) | Dev 2 | T1-T5 |
| Matching candidates API (sắp xếp theo score) | Dev 2 | T5-T10 |
| Map component UI (react-leaflet + Goong tiles) | Dev 3 | T1-T5 |
| Trang "Tìm phòng gần tôi" | Dev 3 | T5-T7 |
| Trang tạo profile roommate UI | Dev 3 | T7-T10 |
| Content: video review phòng trọ thật | Marketing 1 | T1-T10 |
| Onboard 20-30 chủ trọ đầu tiên (seed data) | Marketing 2 | T1-T10 |

**Deliverable:** Xem phòng trên bản đồ, tạo profile ghép bạn

---

### SPRINT 4 (Tuần 7-8): Matching + Chat
**Mục tiêu:** Tính năng cốt lõi — swipe match và chat hoạt động

| Task | Assignee | Ngày |
|------|----------|------|
| Matching algorithm implementation | Dev 1 | T1-T5 |
| Swipe API (left/right) + Match detection | Dev 1 | T5-T7 |
| Spring WebSocket/STOMP setup + Chat API | Dev 2 | T1-T7 |
| Conversation management API | Dev 2 | T7-T10 |
| Swipe card UI (react component) | Dev 3 | T1-T5 |
| Match notification screen | Dev 3 | T5-T7 |
| Chat UI (real-time messaging) | Dev 3 | T7-T10 |
| Chạy ads Facebook nhỏ để test | Marketing 1 | T5-T10 |
| Event mini tại FPT "Tìm bạn ở cùng" | Marketing 2 | T7-T10 |

**Deliverable:** User swipe, match, và chat được với nhau

---

### SPRINT 5 (Tuần 9-10): Trust & Safety
**Mục tiêu:** Xác thực, review, báo cáo, hoán đổi roommate — xây dựng lòng tin

| Task | Assignee | Ngày |
|------|----------|------|
| CCCD upload API + Admin review flow | Dev 1 | T1-T5 |
| Swap Roommate Request & Approval API | Dev 1 | T5-T7 |
| Report/Flag API (chống báo cáo giả bằng TrustScore & Kháng nghị) | Dev 1 | T8-T10 |
| Verified Check-in & Review API (2-way verified reviews) | Dev 2 | T1-T5 |
| Push notification (WebSocket + browser) | Dev 2 | T5-T8 |
| Saved/Favorite rooms API | Dev 2 | T8-T10 |
| CCCD upload UI + verified badge display | Dev 3 | T1-T3 |
| Check-in Handover Verification UI & Verified Review flow | Dev 3 | T3-T5 |
| Swap Roommate UI (Leaseholder warnings & Approval screen) | Dev 3 | T5-T8 |
| Favorite button + saved list | Dev 3 | T8-T10 |
| Chuẩn bị nội dung pitch deck | Marketing 1 + BA | T1-T10 |
| Thu thập testimonial từ early users | Marketing 2 | T5-T10 |

**Deliverable:** Hệ thống xác thực, review 2 chiều, hoán đổi roommate và lưu phòng hoạt động

---

### SPRINT 6 (Tuần 11-12): Polish, Monetization & Launch
**Mục tiêu:** Hoàn thiện sản phẩm, tính năng trả phí, chuẩn bị demo

| Task | Assignee | Ngày |
|------|----------|------|
| Admin dashboard (thống kê, quản lý) | Dev 1 | T1-T5 |
| Boost listing feature (featured rooms) | Dev 1 | T5-T8 |
| Performance optimization, caching | Dev 2 | T1-T5 |
| Bug fix tổng thể, edge cases | Dev 2 | T5-T10 |
| Admin panel UI | Dev 3 | T1-T5 |
| Responsive polish, UX improvements | Dev 3 | T5-T8 |
| Landing page + SEO setup | Dev 3 | T8-T10 |
| Hoàn thiện pitch deck | Marketing 1 + BA | T1-T5 |
| Video demo sản phẩm | Marketing 1 | T5-T8 |
| Chuẩn bị thuyết trình EXE101 | Cả nhóm | T8-T10 |

**Deliverable:** Sản phẩm MVP hoàn chỉnh, sẵn sàng demo EXE101

---

## 4. MILESTONE TIMELINE

```
Tuần 1  ──── Tuần 2  ──── Tuần 3  ──── Tuần 4  ──── Tuần 5  ──── Tuần 6
  │            │            │            │            │            │
  ▼            ▼            ▼            ▼            ▼            ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐
│  M1: AUTH      │  │  M2: LISTINGS  │  │  M3: MAP + PROFILE         │
│  Đăng nhập     │  │  Đăng/tìm      │  │  Bản đồ + hồ sơ roommate  │
│  hoạt động     │  │  phòng OK      │  │  hoạt động                 │
└────────────────┘  └────────────────┘  └────────────────────────────┘

Tuần 7  ──── Tuần 8  ──── Tuần 9  ──── Tuần 10 ──── Tuần 11 ──── Tuần 12
  │            │            │            │            │             │
  ▼            ▼            ▼            ▼            ▼             ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────┐
│  M4: MATCH + CHAT  │  │  M5: TRUST SYSTEM  │  │  M6: LAUNCH READY     │
│  Swipe & chat      │  │  Xác thực, review  │  │  MVP hoàn chỉnh       │
│  hoạt động         │  │  badge hoạt động   │  │  Demo EXE101 ✓        │
└────────────────────┘  └────────────────────┘  └────────────────────────┘
```

---

## 5. USER FLOW CHÍNH

### 5.1. Tenant Flow (Tìm phòng)

```
Mở app → Đăng nhập OTP → Chọn "Người thuê"
    │
    ├──→ [Tab 1: Tìm phòng]
    │       → Bộ lọc (giá, quận, tiện nghi)
    │       → Xem danh sách / Xem bản đồ
    │       → Tap phòng → Xem chi tiết
    │           → Xem ảnh, giá đầy đủ, review
    │           → "Liên hệ chủ trọ" → Chat
    │           → "Lưu phòng" → Yêu thích
    │
    ├──→ [Tab 2: Ghép bạn]
    │       → Tạo/sửa Profile
    │       → Swipe candidates
    │       → Match! → Chat
    │
    ├──→ [Tab 3: Tin nhắn]
    │       → Danh sách conversations
    │       → Real-time chat
    │
    └──→ [Tab 4: Tài khoản]
            → Thông tin cá nhân
            → Upload CCCD
            → Phòng đã lưu
            → Đăng xuất
```

### 5.2. Landlord Flow (Đăng phòng)

```
Mở app → Đăng nhập OTP → Chọn "Chủ trọ"
    │
    ├──→ [Tab 1: Phòng của tôi]
    │       → Danh sách phòng đã đăng
    │       → "Đăng phòng mới"
    │           → Nhập thông tin + giá chi tiết
    │           → Upload ảnh
    │           → Chọn vị trí trên bản đồ
    │           → Đăng tin (miễn phí / Boost)
    │       → Sửa / Ẩn phòng
    │       → "Bàn giao phòng (Check-in)" ➔ Xác nhận trực tiếp hoặc mã OTP
    │       → Duyệt yêu cầu "Hoán đổi hợp đồng (Swap)" từ Leaseholder ➔ Bấm đồng ý/từ chối
    │
    ├──→ [Tab 2: Tin nhắn]
    │       → Chat với người hỏi phòng
    │
    ├──→ [Tab 3: Đánh giá]
    │       → Xem review từ người thuê
    │       → Đánh giá người thuê (chỉ mở sau check-in)
    │
    └──→ [Tab 4: Tài khoản]
            → Upload CCCD → Badge xác thực
            → Gói Pro (tương lai)
            → Đăng xuất
```

### 5.3. Roommate Swapping Flow (Luồng Hoán đổi bạn cùng phòng)

```
Yêu cầu hoán đổi (Swap Roommate)
    │
    ├───→ Xác định vai trò trong Hợp đồng thuê:
    │
    ├───→ [Trường hợp 1: Người ký hợp đồng chính - Leaseholder]
    │        → Hệ thống hiển thị cảnh báo đỏ: "Yêu cầu chủ trọ duyệt và làm lại hợp đồng"
    │        → Tenant đăng tin cần Swap + thói quen mong muốn
    │        → Swipe & Match với Tenant mới phù hợp
    │        → Gửi "Yêu cầu chuyển nhượng hợp đồng" tới Chủ trọ (Landlord) qua app
    │        → Chủ trọ xem profile Tenant mới ➔ Chọn "Đồng ý/Từ chối"
    │        → Nếu đồng ý ➔ Cập nhật hợp đồng offline ➔ Xác nhận "Hoàn tất Swap" trên app
    │
    └───→ [Trường hợp 2: Người ở ghép phụ - Co-tenant]
             → Tenant đăng tin cần Swap + thói quen mong muốn
             → Swipe & Match với Tenant mới phù hợp
             │
             ├───→ Gửi yêu cầu duyệt cho Leaseholder cùng phòng
             │        → Leaseholder duyệt trên app
             │
             └───→ Hệ thống tự động gửi thông báo (Notification) thay đổi người ở cho Chủ trọ
                      → Hoàn tất Swap trên app
```

---

## 6. WIREFRAME CHỦ ĐẠO

### 6.1. Trang chủ (Tenant)

```
┌──────────────────────────────┐
│  🏠 Phòng Trọ Xanh          │
│  ─────────────────────────── │
│  [🔍 Tìm phòng trọ...     ] │
│                              │
│  Bộ lọc nhanh:              │
│  [Quận 9] [1-3tr] [Phòng trọ]│
│                              │
│  📍 Gần FPT University      │
│  ┌────────┐ ┌────────┐      │
│  │ 📸     │ │ 📸     │      │
│  │Phòng A │ │Phòng B │      │
│  │2.5tr ✓ │ │1.8tr   │      │
│  │Q.9 ★4.5│ │Q.9 ★4.2│      │
│  └────────┘ └────────┘      │
│  ┌────────┐ ┌────────┐      │
│  │ 📸     │ │ 📸     │      │
│  │Phòng C │ │Phòng D │      │
│  │3.0tr ✓ │ │2.0tr ✓ │      │
│  │Q.TĐ★4.8│ │Q.9 ★3.9│      │
│  └────────┘ └────────┘      │
│                              │
│  [🗺️ Xem bản đồ]           │
│                              │
│ ┌──────┬──────┬──────┬─────┐│
│ │🏠Tìm │👥Ghép│💬Chat│👤Me ││
│ │phòng │ bạn  │      │     ││
│ └──────┴──────┴──────┴─────┘│
└──────────────────────────────┘
```

### 6.2. Màn hình Swipe Matching

```
┌──────────────────────────────┐
│  👥 Tìm bạn ở cùng          │
│  ─────────────────────────── │
│                              │
│  ┌──────────────────────┐    │
│  │                      │    │
│  │     👤 Avatar        │    │
│  │                      │    │
│  │  Nguyễn Thị B, 20    │    │
│  │  SV FPT University   │    │
│  │                      │    │
│  │  💰 2-3 triệu/tháng │    │
│  │  📍 Quận 9           │    │
│  │  🌙 Ngủ sớm (22h)   │    │
│  │  🧹 Sạch sẽ: 4/5    │    │
│  │  🚭 Không hút thuốc  │    │
│  │  🐱 Thích thú cưng   │    │
│  │                      │    │
│  │  Tương thích: 87%    │    │
│  │  ███████████░░ 87%   │    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│     ❌              ✅       │
│   [Bỏ qua]      [Thích]     │
│                              │
│ ┌──────┬──────┬──────┬─────┐│
│ │🏠Tìm │👥Ghép│💬Chat│👤Me ││
│ └──────┴──────┴──────┴─────┘│
└──────────────────────────────┘
```

---

## 7. SUCCESS METRICS (KPI theo Sprint)

| Sprint | KPI | Target |
|--------|-----|--------|
| Sprint 1 | Auth hoạt động, 0 critical bugs | Pass |
| Sprint 2 | Đăng được phòng, tìm kiếm trả kết quả < 2s | Pass |
| Sprint 3 | Bản đồ load < 3s, seed 50+ phòng từ data thật | 50 phòng |
| Sprint 4 | Matching score tính đúng, chat real-time < 500ms delay | Pass |
| Sprint 5 | 100 phòng xác thực, 200+ user đăng ký (beta) | 100/200 |
| Sprint 6 | MVP feature-complete, demo EXE101 thành công | Pass |

---

## 8. RISK & CONTINGENCY CHO TỪNG SPRINT

| Risk | Xác suất | Impact | Giải pháp |
|------|----------|--------|-----------|
| OTP service gặp lỗi/tốn phí | Trung bình | Cao | Dùng Stringee thay Twilio (rẻ hơn cho VN), fallback email |
| Map API limit hết free tier | Thấp | Trung bình | Goong cho 30K requests/tháng, đủ cho MVP |
| Không đủ seed data (phòng trọ) | Cao | Rất cao | Marketing team đi khảo sát trực tiếp, tự nhập 50 phòng |
| Chat WebSocket không ổn định | Trung bình | Trung bình | Fallback sang polling mỗi 5s nếu WebSocket fail |
| Thành viên bận thi/nghỉ | Cao | Cao | Buffer 2 tuần (sprint 6), feature freeze nếu cần |

---

*Tài liệu tiếp theo: 05 - Chiến Lược Marketing*
