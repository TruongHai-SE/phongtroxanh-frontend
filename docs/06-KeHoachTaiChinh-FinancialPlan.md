# KẾ HOẠCH TÀI CHÍNH - PHÒNG TRỌ XANH

---

## 1. TỔNG QUAN TÀI CHÍNH

### 1.1. Vốn ban đầu

| Nguồn vốn | Số tiền (VND) | Ghi chú |
|-----------|---------------|---------|
| **Góp vốn từ thành viên** | 12,000,000 | 6 người × 2,000,000 VND/người |
| **Giải thưởng/Hỗ trợ EXE101** | 3,000,000 - 5,000,000 | Nếu đạt giải cuộc thi |
| **Tổng vốn khả dụng** | **15,000,000 - 17,000,000** | |

### 1.2. Nguyên tắc tài chính MVP

- **Chi phí nhân sự = 0đ** (đội ngũ SV, dự án học phần)
- **Tối đa hóa free tier** của mọi dịch vụ cloud
- **Marketing chi thông minh** — ưu tiên organic, guerrilla marketing
- **Break-even** mục tiêu trong 4-6 tháng

---

## 2. CHI PHÍ CHI TIẾT

### 2.1. Chi phí một lần (One-time Costs)

| Khoản mục | Chi phí (VND) | Ghi chú |
|-----------|---------------|---------|
| Domain PhongTroXanh.vn | 150,000 | inet.vn, gia hạn hàng năm |
| Logo & Brand design | 0 | Tự thiết kế (Canva Pro free cho SV) |
| Poster/banner in đợt 1 | 500,000 | 200 tờ A3 |
| Thiết bị (không cần mua) | 0 | Dùng laptop cá nhân |
| **Tổng one-time** | **650,000** | |

### 2.2. Chi phí hàng tháng (Monthly Recurring)

#### Giai đoạn MVP (Tháng 1-3)

| Khoản mục | Tháng 1 | Tháng 2 | Tháng 3 | Trung bình |
|-----------|---------|---------|---------|------------|
| **Hosting & Server** | | | | |
| Azure App Service (Free F1) | 0 | 0 | 0 | 0 |
| Azure SQL (Free 32GB) | 0 | 0 | 0 | 0 |
| Vercel (Frontend, Free) | 0 | 0 | 0 | 0 |
| Cloudinary (Images, Free 25GB) | 0 | 0 | 0 | 0 |
| **Dịch vụ bên thứ 3** | | | | |
| SMS OTP (Stringee ~500đ/OTP) | 50,000 | 150,000 | 300,000 | 167,000 |
| Goong Maps API (Free 30K req) | 0 | 0 | 0 | 0 |
| SendGrid Email (Free 100/ngày) | 0 | 0 | 0 | 0 |
| **Marketing** | | | | |
| Facebook Ads | 500,000 | 1,000,000 | 1,500,000 | 1,000,000 |
| TikTok Ads | 0 | 500,000 | 500,000 | 333,000 |
| KOC/KOL | 0 | 500,000 | 1,500,000 | 667,000 |
| In ấn bổ sung | 0 | 300,000 | 200,000 | 167,000 |
| Event offline | 0 | 500,000 | 500,000 | 333,000 |
| Referral rewards | 0 | 200,000 | 500,000 | 233,000 |
| **Công cụ** | | | | |
| GitHub (Free) | 0 | 0 | 0 | 0 |
| Trello (Free) | 0 | 0 | 0 | 0 |
| Canva (Free cho SV) | 0 | 0 | 0 | 0 |
| **Nhân sự** | 0 | 0 | 0 | 0 |
| | | | | |
| **TỔNG/THÁNG** | **550,000** | **3,150,000** | **5,000,000** | **2,900,000** |

#### Tổng chi phí 3 tháng MVP: **8,700,000 VND + 650,000 (one-time) = ~9,350,000 VND**

### 2.3. Chi phí hàng tháng — Giai đoạn Growth (Tháng 4-6)

| Khoản mục | Tháng 4 | Tháng 5 | Tháng 6 |
|-----------|---------|---------|---------|
| VPS Hosting (upgrade) | 300,000 | 300,000 | 300,000 |
| SMS OTP | 400,000 | 500,000 | 600,000 |
| Cloudinary (nếu vượt free) | 0 | 200,000 | 200,000 |
| Facebook Ads | 2,000,000 | 2,500,000 | 3,000,000 |
| TikTok Ads | 1,000,000 | 1,000,000 | 1,500,000 |
| KOC/KOL | 2,000,000 | 2,000,000 | 3,000,000 |
| Event & offline | 500,000 | 500,000 | 1,000,000 |
| Referral | 500,000 | 700,000 | 1,000,000 |
| **TỔNG/THÁNG** | **6,700,000** | **7,700,000** | **10,600,000** |

---

## 3. DOANH THU DỰ KIẾN

### 3.0. Phân tích mô hình doanh thu đối thủ & Xu hướng tiêu dùng

#### A. Benchmark doanh thu từ các nền tảng tham chiếu

| Nền tảng | Mô hình doanh thu | Điểm mạnh | Rủi ro nếu áp dụng cho Phòng Trọ Xanh | Kết luận |
|----------|-------------------|------------|----------------------------------------|----------|
| **Airbnb** | Commission trên giá trị giao dịch (Host 3%, Guest ~14%) | Dòng tiền lớn, kiểm soát thanh toán | SV thuê dài hạn không chấp nhận phí dịch vụ % hàng tháng | **Không áp dụng** — thu phí % trên tiền nhà dài hạn sẽ mất người dùng |
| **Chợ Tốt / Phongtro123** | Đăng tin nổi bật (Boost/VIP), gói đẩy tin tự động | Doanh thu ổn định từ chủ trọ chuyên nghiệp | Dễ spam tin ảo nếu không kèm xác minh | **Áp dụng có điều chỉnh** — chỉ tin Verified mới được Boost |
| **Ohana (Shark Tank VN)** | Hoa hồng 30-50% tháng đầu từ hợp đồng thành công | Doanh thu cao trên mỗi giao dịch | Tỉ lệ thất thoát (Leakage) lên đến 80% — khách và chủ tự liên hệ né phí | **Không áp dụng** — tránh phụ thuộc phí hoa hồng hợp đồng trực tiếp |
| **Tinder / Bumble** | Subscription (Gold/Premium) + Micro-transactions (Super Like, Boost) | Gen Z quen trả tiền nhỏ để tăng tốc matching | Cần user pool đủ lớn để matching hiệu quả | **Áp dụng trực tiếp** — bán lượt Super-match, ghim profile với giá micro |

#### B. Xu hướng tiêu dùng của đối tượng mục tiêu

**Phía Người thuê (Sinh viên Gen Z, 18-25 tuổi):**
- Cực kỳ nhạy cảm về giá → sẽ gỡ app ngay nếu bị ép trả phí Subscription hàng tháng chỉ để xem phòng.
- Quen trả micro-payment (15K-20K VND) qua ví điện tử (MoMo, ZaloPay) cho giá trị tức thì (huy hiệu xác thực, ghim bài tìm bạn).
- Có nhu cầu tiện lợi trọn gói khi dọn nhà (vận chuyển, nội thất, internet) → sẵn sàng dùng dịch vụ tích hợp trên app nếu có giá tốt.

**Phía Chủ trọ:**
- Phòng trống = mất 100K VND/ngày (phòng 3 triệu). Sẵn sàng chi 200K-300K (2-3 ngày phòng trống) để lấp phòng nhanh.
- Thích mua đứt lượt đẩy tin lẻ theo nhu cầu, không thích cam kết gói dài hạn phức tạp.
- Chủ trọ chuyên nghiệp (5+ phòng) sẵn sàng trả gói Pro để quản lý tập trung và có analytics.

#### C. Nguyên tắc thiết kế doanh thu

Dựa trên phân tích trên, Phòng Trọ Xanh áp dụng mô hình **3 Trục Doanh thu**:

1. **Trục B2B (Chủ trọ — Nguồn thu chủ lực ~60%):** Boost Post + Gói Pro
2. **Trục B2C (Người thuê — Nguồn thu bổ trợ ~20%):** Tenant Premium (huy hiệu xác thực) + Micro-transactions ghép bạn
3. **Trục B2B2C (Đối tác thứ 3 — Nguồn thu mở rộng ~20%):** Hoa hồng affiliate từ dịch vụ chuyển nhà, nội thất, internet

> **Nguyên tắc vàng:** Tất cả tính năng cốt lõi (tìm phòng, swipe ghép bạn, chat) đều MIỄN PHÍ. Chỉ thu phí cho giá trị gia tăng (tăng tốc, nổi bật, xác thực uy tín, dịch vụ tiện ích).

### 3.1. Nguồn doanh thu theo giai đoạn

#### Giai đoạn 1: Tin đăng nổi bật — Boost Post (Tháng 3+)

| Metric | Tháng 3 | Tháng 4 | Tháng 5 | Tháng 6 |
|--------|---------|---------|---------|---------|
| Tổng chủ trọ đăng tin | 200 | 350 | 500 | 700 |
| % chủ trọ dùng Boost | 5% | 8% | 10% | 12% |
| Số lượt Boost/tháng | 10 | 28 | 50 | 84 |
| Giá trung bình/Boost | 40,000 | 40,000 | 40,000 | 40,000 |
| **Doanh thu Boost** | **400,000** | **1,120,000** | **2,000,000** | **3,360,000** |

#### Giai đoạn 2: Gói Chủ Trọ Pro (Tháng 4+)

| Metric | Tháng 4 | Tháng 5 | Tháng 6 |
|--------|---------|---------|---------|
| Tổng chủ trọ | 350 | 500 | 700 |
| % đăng ký Pro | 3% | 5% | 7% |
| Số chủ trọ Pro | 10 | 25 | 49 |
| Giá gói Pro/tháng | 300,000 | 300,000 | 300,000 |
| **Doanh thu Pro** | **3,000,000** | **7,500,000** | **14,700,000** |

#### Giai đoạn 2: Phí ghép/swap phòng (Tháng 5+)

| Metric | Tháng 5 | Tháng 6 |
|--------|---------|---------|
| Số lượt ghép/swap thành công/tháng | 20 | 40 |
| Phí/lần thành công | 70,000 | 70,000 |
| **Doanh thu ghép/swap** | **1,400,000** | **2,800,000** |

#### Giai đoạn 2: Đối tác dịch vụ phụ trợ - B2B2C Affiliate (Tháng 4+)

| Metric | Tháng 4 | Tháng 5 | Tháng 6 |
|--------|---------|---------|---------|
| Số giao dịch thành công | 15 | 35 | 60 |
| Hoa hồng trung bình/giao dịch | 80,000 | 80,000 | 80,000 |
| **Doanh thu đối tác** | **1,200,000** | **2,800,000** | **4,800,000** |

#### Giai đoạn 2: Xác thực Tenant Premium (Tháng 4+)

| Metric | Tháng 4 | Tháng 5 | Tháng 6 |
|--------|---------|---------|---------|
| Số lượt xác thực CCCD | 50 | 100 | 180 |
| Phí xác thực | 20,000 | 20,000 | 20,000 |
| **Doanh thu xác thực** | **1,000,000** | **2,000,000** | **3,600,000** |

### 3.2. Bảng tổng hợp doanh thu

| Nguồn | T3 | T4 | T5 | T6 |
|-------|-----|-----|-----|-----|
| Boost Post | 400K | 1,120K | 2,000K | 3,360K |
| Gói Pro | — | 3,000K | 7,500K | 14,700K |
| Phí ghép/swap phòng | — | — | 1,400K | 2,800K |
| Đối tác phụ trợ (B2B2C) | — | 1,200K | 2,800K | 4,800K |
| Tenant Premium | — | 1,000K | 2,000K | 3,600K |
| **Tổng doanh thu** | **400K** | **6,320K** | **15,700K** | **29,260K** |


---

## 4. BÁO CÁO LÃI LỖ DỰ KIẾN (6 THÁNG)

```
               T1        T2        T3        T4        T5        T6
             ─────     ─────     ─────     ─────     ─────     ─────
Doanh thu      0         0       400K     6,320K   15,700K   29,260K
Chi phí     (550K)   (3,150K)  (5,000K)  (6,700K)  (7,700K) (10,600K)
             ─────     ─────     ─────     ─────     ─────     ─────
Lãi/Lỗ    (550K)   (3,150K)  (4,600K)    (380K)   8,000K   18,660K
             ─────     ─────     ─────     ─────     ─────     ─────
Lũy kế     (550K)   (3,700K)  (8,300K)  (8,680K)    (680K)   17,980K
```

### Biểu đồ trực quan:

```
Doanh thu vs Chi phí (triệu VND)

25 │                                                          ╭──── Doanh thu
   │                                                    ╭─────╯
20 │                                              ╭─────╯
   │                                        ╭─────╯
15 │                                  ╭─────╯
   │                            ╭─────╯
10 │                      ╭─────╯          ╭──────────── Chi phí
   │                ╭─────╯          ╭─────╯
 5 │          ╭─────╯          ╭─────╯
   │    ╭─────╯──────────╭─────╯
 0 ├────╯────────────────╯───────────────────────────────
   │  T1      T2      T3      T4      T5      T6
-5 │  ▓▓▓▓    ▓▓▓▓                          
   │  LỖ      LỖ     LỖ      LỖ     LÃI    LÃI
   │                                          
   └──────────────────────────────────────────────────
                                         ▲
                                    BREAK-EVEN
                                    (Tháng 5)
```

**Break-even point: Tháng 5** (tháng thứ 5 hoạt động)

---

## 5. UNIT ECONOMICS

### 5.1. Chi phí thu hút khách hàng (CAC)

| Metric | Giá trị |
|--------|---------|
| Tổng chi marketing 3 tháng | 8,900,000 VND |
| Tổng user đăng ký (target) | 2,000 |
| **CAC (Cost per Acquisition)** | **4,450 VND/user** |
| CAC qua Ads (paid) | ~15,000 VND/user |
| CAC qua Organic/Referral | ~0-2,000 VND/user |
| **Blended CAC** | **~4,500 VND/user** |

### 5.2. Giá trị vòng đời khách hàng (LTV)

**Cho chủ trọ (paying customer):**

| Metric | Giá trị |
|--------|---------|
| Doanh thu trung bình/chủ trọ/tháng | 80,000 VND (Boost) hoặc 300,000 (Pro) |
| Thời gian sử dụng trung bình | 6-12 tháng |
| **LTV (Boost user)** | **480,000 - 960,000 VND** |
| **LTV (Pro user)** | **1,800,000 - 3,600,000 VND** |
| **Weighted avg LTV** | **~800,000 VND** |

### 5.3. LTV/CAC Ratio

```
LTV / CAC = 800,000 / 4,500 = ~178:1 (cho blended)

Nếu chỉ tính paid users:
LTV / CAC = 800,000 / 15,000 = ~53:1

→ Rất healthy! (benchmark tốt: > 3:1)
```

**Lưu ý:** Tỉ lệ cao vì chi phí marketing thấp (chủ yếu organic + student team miễn phí). Khi scale sẽ tăng CAC.

---

## 6. KỊCH BẢN TÀI CHÍNH

### 6.1. Kịch bản lạc quan (Optimistic)

| Metric | Giá trị |
|--------|---------|
| User đăng ký tháng 6 | 5,000+ |
| Phòng đăng tin | 1,000+ |
| Chủ trọ Pro | 70+ |
| Doanh thu tháng 6 | 30,000,000+ VND |
| Lũy kế lãi/lỗ tháng 6 | +10,000,000 VND |

**Điều kiện:** Content TikTok viral (1 video 100K+ views), partnership trường ĐH thành công, tỉ lệ chuyển đổi Pro cao.

### 6.2. Kịch bản cơ bản (Base case) — Đã trình bày ở trên

| Metric | Giá trị |
|--------|---------|
| User đăng ký tháng 6 | 3,000 |
| Phòng đăng tin | 700 |
| Chủ trọ Pro | 49 |
| Doanh thu tháng 6 | 20,860,000 VND |
| Lũy kế lãi/lỗ tháng 6 | +2,580,000 VND |

### 6.3. Kịch bản bi quan (Pessimistic)

| Metric | Giá trị |
|--------|---------|
| User đăng ký tháng 6 | 1,000 |
| Phòng đăng tin | 300 |
| Chủ trọ Pro | 15 |
| Doanh thu tháng 6 | 8,000,000 VND |
| Lũy kế lãi/lỗ tháng 6 | -8,000,000 VND |

**Kế hoạch B:** Nếu bi quan → giảm chi marketing, focus hoàn toàn organic, pivot sang mô hình chỉ listing (không matching), tìm angel investor/incubator.

---

## 7. KẾ HOẠCH GỌI VỐN (NẾU CẦN SCALE)

### 7.1. Pre-seed Round (Sau EXE101, nếu traction tốt)

| Metric | Giá trị |
|--------|---------|
| Thời điểm | Tháng 7-9 (sau khi có traction) |
| Số tiền cần | 100-300 triệu VND |
| Định giá pre-money | 1-2 tỷ VND |
| Nguồn | Angel investor, Startup incubator |
| Mục đích | Scale marketing, thuê thêm dev, mở rộng TP mới |

### 7.2. Tiêu chí để gọi vốn

- 5,000+ users đã đăng ký
- 1,000+ phòng xác thực
- 50+ chủ trọ trả phí
- Doanh thu > 20 triệu/tháng
- Tỉ lệ retention 30 ngày > 30%

### 7.3. Nhà đầu tư/Incubator tiềm năng tại VN

| Tên | Loại | Ghi chú |
|-----|------|---------|
| **VIISA** | Accelerator | Chuyên startup VN giai đoạn sớm |
| **Topica Founder Institute** | Incubator | Hỗ trợ founder trẻ |
| **Zone Startups Vietnam** | Accelerator | Kết nối quốc tế |
| **SIHUB (TP.HCM)** | Incubator nhà nước | Hỗ trợ miễn phí, workspace |
| **FPT Ventures** | CVC | Đầu tư vào startup SV FPT |
| **ESP Capital** | VC | Đầu tư giai đoạn Seed tại VN |
| **ThinkZone Ventures** | VC | Đầu tư Pre-seed/Seed |

---

## 8. SỬ DỤNG VỐN (Allocation)

### 3 tháng đầu (Tổng: ~10 triệu VND)

```
┌──────────────────────────────────────────────────────┐
│                  PHÂN BỔ VỐN MVP                      │
│                                                       │
│   ████████████████████████████████████  Marketing 72% │
│   ██████████                           Tech/Hosting 8%│
│   █████████████████████                Reserve 20%    │
│                                                       │
│   Marketing:     7,200,000 VND (ads, content, event) │
│   Tech/Hosting:    800,000 VND (domain, SMS, server) │
│   Dự phòng:      2,000,000 VND (emergency fund)     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 9. FINANCIAL DASHBOARD (Theo dõi hàng tháng)

| KPI tài chính | Cách tính | Target |
|--------------|-----------|--------|
| **MRR** (Monthly Recurring Revenue) | Tổng doanh thu tháng | Tăng 50%+ mỗi tháng |
| **Burn rate** | Chi phí/tháng - Doanh thu/tháng | Giảm dần |
| **Runway** | Vốn còn lại / Burn rate | > 3 tháng |
| **CAC** | Tổng chi marketing / Số user mới | < 10K VND |
| **ARPU** | Doanh thu / Tổng user hoạt động | Tăng theo tháng |
| **Churn rate** (chủ trọ Pro) | % hủy gói Pro/tháng | < 10% |
| **Gross margin** | (Doanh thu - Chi phí trực tiếp) / Doanh thu | > 70% |

---

*Tài liệu tiếp theo: 07 - Phân Tích Rủi Ro & SWOT*
