# BUSINESS MODEL CANVAS - PHÒNG TRỌ XANH

---

## MÔ HÌNH KINH DOANH CANVAS (BMC)

```
┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐
│   KEY PARTNERS      │  KEY ACTIVITIES     │  VALUE PROPOSITIONS │  CUSTOMER           │  CUSTOMER           │
│                     │                     │                     │  RELATIONSHIPS      │  SEGMENTS           │
│ • Chủ nhà trọ /    │ • Phát triển &      │ CHO NGƯỜI THUÊ:     │                     │                     │
│   khu nhà trọ      │   bảo trì nền tảng  │ • Phòng trọ xác    │ • Hỗ trợ qua chat  │ PRIMARY:            │
│ • FPT University   │ • Xác minh chủ trọ  │   thực, không lừa  │ • Chatbot FAQ       │ • Sinh viên ĐH/CĐ  │
│   (hỗ trợ SV)     │   & tin đăng        │   đảo              │ • Email support     │   (18-24 tuổi)      │
│ • MoMo / ZaloPay   │ • Marketing &       │ • Ghép & Swap bạn  │ • Community group   │ • Lao động trẻ      │
│   (thanh toán)     │   acquisition       │   ở cùng phù hợp   │   trên Facebook     │   di cư (22-30)     │
│ • Google Maps API  │ • Quản lý cộng     │ • Giá minh bạch,   │ • Đánh giá & phản  │                     │
│ • Cloudinary       │   đồng & review    │   không phí ẩn     │   hồi 2 chiều      │ SECONDARY:          │
│   (lưu trữ ảnh)   │ • Onboard chủ trọ  │ • Tiết kiệm thời   │   đã xác thực      │ • Chủ nhà trọ cá   │
│ • VNPT / Viettel   │ • Chăm sóc khách   │   gian tìm kiếm   │                     │   nhân              │
│   (OTP SMS)        │   hàng             │                     │                     │ • Doanh nghiệp cho │
│ • Đối tác dịch vụ  │                     │                     │                     │   thuê nhỏ          │
│   (chuyển trọ, nột │                     │                     │                     │                     │
│   thất, internet)   │                     │                     │                     │                     │
│                     │                     │ CHO CHỦ TRỌ:       │                     │   thuê nhỏ          │
│                     │                     │ • Tiếp cận đúng    │                     │                     │
│                     │                     │   khách hàng       │                     │                     │
│                     │                     │ • Quản lý tin đăng │                     │                     │
│                     │                     │   dễ dàng          │                     │                     │
│                     │                     │ • Giảm tỉ lệ      │                     │                     │
│                     │                     │   phòng trống      │                     │                     │
├─────────────────────┼─────────────────────┤                     ├─────────────────────┼─────────────────────┤
│   KEY RESOURCES     │  CHANNELS           │                     │                     │                     │
│                     │                     │                     │                     │                     │
│ • Đội ngũ 6 người  │ • Website chính     │                     │                     │                     │
│ • Java Spring Boot │   (PhongTroXanh.vn) │                     │                     │                     │
│ • Database phòng   │ • Facebook Page &   │                     │                     │                     │
│   trọ xác thực     │   Groups            │                     │                     │                     │
│ • Thuật toán       │ • TikTok / Reels    │                     │                     │                     │
│   matching         │ • Zalo OA           │                     │                     │                     │
│ • Brand & trust    │ • SEO Google        │                     │                     │                     │
│                     │ • Offline: poster   │                     │                     │                     │
│                     │   tại trường ĐH    │                     │                     │                     │
├─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┤
│                                                                                                             │
│   COST STRUCTURE                                      │   REVENUE STREAMS                                   │
│                                                       │                                                     │
│ • Hosting & server (Railway/VPS): 500K-1.5tr/tháng    │ • Tin đăng nổi bật (Boost): 30K-50K/tin/tuần       │
│ • Domain + SSL: 300K/năm                              │ • Gói chủ trọ Pro: 200K-500K/tháng                 │
│ • SMS OTP: ~500đ/OTP × lượng đăng ký                 │ • Hoa hồng ghép phòng: 50K-100K/lần thành công     │
│ • API bản đồ: Free tier đủ MVP                        │ • Banner quảng cáo: dịch vụ chuyển nhà, nội thất   │
│ • Marketing: 2-5tr/tháng (ads + in ấn)               │ • (Tương lai) Featured listings cho bất động sản    │
│ • Nhân sự: 0đ (đội ngũ sinh viên)                     │                                                     │
│                                                       │                                                     │
└───────────────────────────────────────────────────────┴─────────────────────────────────────────────────────┘
```

---

## CHI TIẾT TỪNG Ô TRONG BMC

### 1. CUSTOMER SEGMENTS (Phân khúc khách hàng)

#### Nhóm chính - Người thuê trọ:

**Persona 1: Sinh viên năm nhất (Tân sinh viên)**
- **Tuổi:** 18-19
- **Đặc điểm:** Lần đầu rời quê, không biết khu vực, ngân sách hạn chế (1.5-3tr/tháng)
- **Nỗi đau:** Sợ bị lừa, không biết khu nào an toàn, muốn ở cùng bạn nhưng chưa quen ai
- **Hành vi:** Tìm trên Facebook, hỏi anh chị khóa trên, xem TikTok review
- **Giá trị cần:** An toàn, giá rẻ, có bạn cùng phòng, gần trường

**Persona 2: Sinh viên năm 2-4 (Chuyển trọ)**
- **Tuổi:** 19-23
- **Đặc điểm:** Đã có kinh nghiệm thuê trọ, muốn nâng cấp hoặc đổi khu vực, ngân sách 2-4tr/tháng
- **Nỗi đau:** Chủ trọ tăng giá, phòng xuống cấp, bạn ở cùng không hợp
- **Hành vi:** So sánh giá, đọc review, ưu tiên tiện nghi
- **Giá trị cần:** Minh bạch giá, đánh giá thật, ghép bạn mới

**Persona 3: Người đi làm trẻ (Fresh graduate)**
- **Tuổi:** 22-30
- **Đặc điểm:** Mới đi làm, chuyển thành phố, ngân sách 3-6tr/tháng
- **Nỗi đau:** Tốn thời gian tìm kiếm, muốn phòng đẹp hơn, cần gần nơi làm việc
- **Hành vi:** Tìm trên Google, dùng app, sẵn sàng trả thêm cho chất lượng
- **Giá trị cần:** Tiết kiệm thời gian, chất lượng cao, vị trí thuận tiện

#### Nhóm phụ - Chủ trọ:

**Persona 4: Chủ trọ cá nhân**
- **Đặc điểm:** Sở hữu 5-20 phòng, quản lý trực tiếp
- **Nỗi đau:** Phòng trống lâu, gặp người thuê thiếu uy tín, đăng tin bị chìm trên Facebook
- **Giá trị cần:** Tiếp cận đúng người thuê, quản lý dễ, ít rắc rối

---

### 2. VALUE PROPOSITIONS (Giá trị cung cấp)

| Cho người thuê | Cho chủ trọ |
|----------------|-------------|
| Phòng đã xác thực, giảm 90% rủi ro lừa đảo | Đăng tin tiếp cận đúng đối tượng (sinh viên, người đi làm) |
| Ghép & Hoán đổi bạn ở cùng dựa trên thói quen (Swap an toàn) | Người thuê đã được xác thực và đánh giá uy tín |
| Giá minh bạch: tiền phòng + điện + nước + phí khác | Dashboard quản lý phòng trống/đã thuê |
| Đánh giá thật từ người đã ở (chỉ được đánh giá khi có xác nhận thuê) | Giảm tỉ lệ trống và thời gian xử lý khi đổi người ở |
| Bộ lọc thông minh: giá, khu vực, tiện nghi | Gói nổi bật giúp tin hiện lên đầu |
| Bản đồ trực quan (Goong Maps) | Hỗ trợ quản lý và phản hồi đánh giá khách thuê |

---

### 3. CHANNELS (Kênh tiếp cận)

#### Online (70% ngân sách):
1. **Website PhongTroXanh.vn** — Kênh chính, SEO optimized
2. **Facebook** — Page + quảng cáo + seeding vào groups phòng trọ
3. **TikTok** — Video review phòng trọ, tips thuê trọ, storytelling lừa đảo
4. **Zalo Official Account** — Nhắn tin trực tiếp, thông báo phòng mới
5. **Google Ads** — Target từ khóa "phòng trọ + [tên quận/khu vực]"

#### Offline (30% ngân sách):
1. **Poster/banner tại trường đại học** — FPT, UIT, HCMUS, BK...
2. **Event mùa nhập học** — Booth tư vấn tìm trọ miễn phí
3. **Hợp tác hội sinh viên** — Kênh referral tự nhiên
4. **Phát tờ rơi khu nhà trọ** — Tiếp cận chủ trọ trực tiếp

---

### 4. CUSTOMER RELATIONSHIPS (Quan hệ khách hàng)

| Giai đoạn | Cách tiếp cận |
|-----------|---------------|
| **Thu hút (Acquisition)** | Content marketing (TikTok, Facebook), SEO, referral code |
| **Kích hoạt (Activation)** | Onboarding đơn giản, hiển thị phòng phù hợp ngay lần đầu |
| **Giữ chân (Retention)** | Push notification phòng mới, email digest hàng tuần |
| **Doanh thu (Revenue)** | Gói premium cho chủ trọ, boost tin |
| **Giới thiệu (Referral)** | "Mời bạn được 50K vào ví" cho cả người mời & người được mời |

---

### 5. REVENUE STREAMS (Dòng doanh thu)

#### Giai đoạn 1 - MVP (Tháng 1-3):
- **Tin đăng nổi bật (Boost Post):** 30,000 - 50,000 VND/tin/tuần
  - Tin hiện lên top trang chủ và kết quả tìm kiếm
  - Dự kiến: 50 tin/tháng × 40K = **2,000,000 VND/tháng**

#### Giai đoạn 2 - Growth (Tháng 4-6):
- **Gói Chủ Trọ Pro:** 200,000 - 500,000 VND/tháng
  - Đăng không giới hạn + badge xác thực + analytics
  - Dự kiến: 30 chủ trọ × 300K = **9,000,000 VND/tháng**

- **Phí ghép/swap phòng:** 50,000 - 100,000 VND/lần thành công
  - Khi 2 người match và xác nhận ở cùng hoặc hoán đổi phòng thành công
  - Dự kiến: 40 lần/tháng × 70K = **2,800,000 VND/tháng**

- **Đối tác dịch vụ phụ trợ (B2B2C Affiliate):** Hoa hồng 5-10% từ dịch vụ chuyển trọ, nội thất, internet
  - Dự kiến: 50 giao dịch/tháng × 80K hoa hồng trung bình = **4,000,000 VND/tháng**

- **Xác thực Tenant Premium (Huy hiệu Tenant Xanh):** Phí 15,000 - 20,000 VND/lần xác thực CCCD
  - Dự kiến: 150 người dùng/tháng × 20K = **3,000,000 VND/tháng**

#### Giai đoạn 3 - Scale (Tháng 7+):
- **Quảng cáo dịch vụ liên quan:** chuyển nhà, nội thất, internet (quảng cáo banner + sponsored)
  - Dự kiến: **10,000,000 - 20,000,000 VND/tháng**


---

### 6. KEY RESOURCES (Nguồn lực chính)

| Nguồn lực | Chi tiết |
|-----------|----------|
| **Nhân lực** | 6 thành viên: 3 dev Java (Spring Boot) / React, 2 marketing, 1 kinh tế |
| **Công nghệ** | Spring Boot, PostgreSQL, Railway/VPS hosting |
| **Dữ liệu** | Database phòng trọ xác thực (lợi thế cạnh tranh) |
| **Thương hiệu** | Brand "Xanh" = tin cậy, sạch sẽ, minh bạch |
| **Mạng lưới** | Quan hệ với chủ trọ quanh khu vực FPT/ĐH |
| **Tài chính** | Vốn ban đầu: 10-20 triệu VND (self-funded + giải thưởng) |

---

### 7. KEY ACTIVITIES (Hoạt động chính)

1. **Phát triển nền tảng** — Sprint 2 tuần, CI/CD, testing
2. **Onboard chủ trọ** — Đi thực tế, chụp ảnh, xác minh, nhập liệu
3. **Marketing & acquisition** — Content creation, ads, SEO, events
4. **Xác minh & kiểm duyệt** — Review tin đăng mới, xử lý báo cáo
5. **Chăm sóc khách hàng** — Hỗ trợ qua chat, xử lý tranh chấp
6. **Phân tích dữ liệu** — Tracking KPIs, A/B testing, cải thiện matching

---

### 8. KEY PARTNERSHIPS (Đối tác chính)

| Đối tác | Vai trò | Lợi ích cho họ |
|---------|---------|----------------|
| **FPT University** | Hỗ trợ SV tìm trọ, cho phép đặt poster | Giảm phàn nàn SV về nhà ở |
| **Hội sinh viên các trường** | Kênh referral, sự kiện | Hoạt động có giá trị cho SV |
| **MoMo / ZaloPay** | Cổng thanh toán | Thêm người dùng mới |
| **Chủ trọ khu vực FPT** | Đăng tin đầu tiên (seed data) | Tiếp cận SV miễn phí ban đầu |
| **Google Maps Platform** | API bản đồ | — (sử dụng free tier) |
| **VNPT / Viettel** | SMS OTP | — (trả phí) |

---

### 9. COST STRUCTURE (Cơ cấu chi phí)

#### Chi phí cố định hàng tháng:

| Khoản mục | Chi phí (VND/tháng) |
|-----------|---------------------|
| Hosting (VPS/Azure) | 500,000 - 1,500,000 |
| Domain + SSL (phân bổ) | 25,000 |
| Email service (SendGrid free) | 0 |
| Công cụ quản lý (Trello, GitHub free) | 0 |
| **Tổng cố định** | **~525,000 - 1,525,000** |

#### Chi phí biến đổi:

| Khoản mục | Chi phí |
|-----------|---------|
| SMS OTP | ~500 VND/OTP |
| Facebook Ads | 1,000,000 - 3,000,000/tháng |
| Google Ads | 500,000 - 2,000,000/tháng |
| In ấn (poster, tờ rơi) | 500,000 - 1,000,000/đợt |
| Sự kiện offline | 500,000 - 1,000,000/event |
| **Tổng biến đổi** | **~2,500,000 - 7,000,000/tháng** |

#### Chi phí nhân sự: 0 VND (đội ngũ sinh viên, dự án EXE101)

#### Tổng chi phí ước tính 3 tháng đầu: **10,000,000 - 25,000,000 VND**
