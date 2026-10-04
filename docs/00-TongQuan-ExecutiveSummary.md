# PHONG TRO XANH - EXECUTIVE SUMMARY
## Nền tảng tìm phòng trọ & ghép bạn ở cùng uy tín cho sinh viên và người đi làm tại Việt Nam

---

## 1. TÊN DỰ ÁN

**Phòng Trọ Xanh** (PhongTroXanh.vn)

- **Slogan:** "Tìm trọ đúng - Ở đúng người"
- **Loại hình:** Nền tảng công nghệ (PropTech / Housing-as-a-Service)
- **Đội ngũ:** 6 thành viên (3 Dev Java (Spring Boot) / React, 2 Marketing, 1 Kinh tế)
- **Thời gian phát triển MVP:** 12 tuần (3 tháng)

---

## 2. VẤN ĐỀ (PROBLEM)

### Thực trạng tìm phòng trọ tại Việt Nam:

Mỗi năm, Việt Nam có khoảng **1.8 triệu sinh viên** nhập học đại học/cao đẳng và hàng triệu lao động di cư đến các thành phố lớn (TP.HCM, Hà Nội, Đà Nẵng). Tất cả đều cần một nơi ở, nhưng quá trình tìm phòng trọ hiện tại **cực kỳ đau đầu**:

| Vấn đề | Mức độ nghiêm trọng |
|--------|---------------------|
| **Lừa đảo tràn lan** — Đăng ảnh giả, thu tiền cọc rồi biến mất, phòng thực tế khác xa với quảng cáo | Rất cao |
| **Thông tin cũ/hết hạn** — 40-60% bài đăng trên các group Facebook đã cho thuê rồi nhưng không gỡ | Cao |
| **Không có đánh giá** — Không biết chủ trọ có uy tín không, khu vực có an toàn không | Cao |
| **Thiếu minh bạch giá** — Giá điện nước "chặt chém", phí phát sinh không được nêu rõ | Cao |
| **Không có cơ chế ghép bạn ở cùng** — Muốn chia phòng để tiết kiệm nhưng không biết tìm ai tin tưởng | Trung bình - Cao |
| **Tốn thời gian** — Phải gọi hàng chục số, đi xem hàng chục phòng, mất cả tuần | Trung bình |

### Dữ liệu minh chứng:
- Theo khảo sát của Batdongsan.com.vn, **67% người thuê trọ** từng gặp tình trạng phòng thực tế khác xa với hình ảnh đăng.
- Nhóm Facebook "Phòng trọ TP.HCM" có **hơn 1 triệu thành viên** — cho thấy nhu cầu cực lớn nhưng giải pháp hiện tại chỉ là group chat lộn xộn.
- Mỗi đầu năm học (tháng 8-9), lượng tìm kiếm "phòng trọ sinh viên" trên Google tăng **300-400%**.

---

## 3. GIẢI PHÁP (SOLUTION)

**Phòng Trọ Xanh** là nền tảng web kết nối chủ trọ - người thuê - bạn ở cùng với **3 lớp giá trị chính**:

### 3.1. Tin đăng xác thực (Verified Listings)
- Chủ trọ xác minh danh tính qua **CCCD/CMND + số điện thoại OTP**
- Hình ảnh phòng **bắt buộc chụp thực tế** (geotagged, timestamp)
- Hệ thống **tự động ẩn** tin đăng sau 30 ngày nếu không gia hạn → loại bỏ tin cũ
- Hiển thị rõ **giá điện/nước/wifi/giữ xe** — không phí ẩn

### 3.2. Ghép & Hoán đổi bạn ở cùng thông minh (Smart Roommate Matching & Swapping)
- Người dùng tạo profile: ngân sách, khu vực, thói quen (sạch sẽ, giờ giấc, thú cưng, hút thuốc...)
- Thuật toán matching dựa trên **điểm tương thích** (compatibility score) và vuốt (swipe) tìm bạn
- Luồng **Hoán đổi bạn cùng phòng (Roommate Swap)** phân loại theo vai trò hợp đồng:
  - *Người đứng tên hợp đồng (Leaseholder):* Cảnh báo ràng buộc pháp lý, yêu cầu chủ trọ duyệt chuyển nhượng.
  - *Người ở ghép phụ (Co-tenant):* Chỉ cần chủ hợp đồng duyệt, hệ thống tự động thông báo chủ trọ.

### 3.3. Đánh giá & Xếp hạng hai chiều xác thực (Verified 2-Way Reviews)
- Chỉ mở khóa đánh giá khi hệ thống xác thực **mối quan hệ thuê nhà thực tế** (qua mã check-in hoặc quét QR phòng trọ).
- Người thuê đánh giá chủ trọ/phòng trọ (1-5 sao + nhận xét).
- Chủ trọ đánh giá người thuê và cập nhật điểm **TrustScore** của người thuê.
- Hệ thống **badge uy tín**: "Chủ trọ Xanh" cho chủ trọ đạt 4.5+ sao.


---

## 4. TẦM NHÌN & SỨ MỆNH

### Tầm nhìn (Vision):
> Trở thành nền tảng tìm phòng trọ **số 1 Việt Nam** về độ tin cậy, giúp mọi sinh viên và người lao động tìm được nơi ở an toàn, minh bạch trong vòng 24 giờ.

### Sứ mệnh (Mission):
> Xóa bỏ nạn lừa đảo phòng trọ, tạo ra trải nghiệm tìm nhà-ở-cùng đơn giản, tin cậy, và công bằng cho cả người thuê lẫn chủ trọ.

---

## 5. MÔ HÌNH DOANH THU (TÓM TẮT)

| Nguồn thu | Mô tả | Giai đoạn |
|-----------|-------|-----------|
| **Tin đăng nổi bật** | Chủ trọ trả phí để tin hiện lên đầu trang | MVP (Tháng 1-3) |
| **Gói chủ trọ Pro** | Đăng không giới hạn + analytics + badge xác thực | Tháng 4-6 |
| **Hoa hồng ghép/swap** | Phí giao dịch nhỏ khi ghép hoặc hoán đổi phòng thành công | Tháng 4-6 |
| **Đối tác phụ trợ (B2B2C)** | Hoa hồng 5-10% từ dịch vụ liên kết (chuyển nhà, nội thất, internet) | Tháng 4-6 |
| **Tenant Premium** | Phí xác thực CCCD nhận huy hiệu "Tenant Xanh" (tăng tỉ lệ match) | Tháng 4-6 |
| **Quảng cáo** | Quảng cáo banner từ các nhà cung cấp dịch vụ thứ ba | Tháng 7+ |

---

## 6. CHỈ SỐ MỤC TIÊU (KPI) - 3 THÁNG ĐẦU

| Chỉ số | Mục tiêu |
|--------|----------|
| Số phòng trọ đăng | 500+ tin xác thực |
| Người dùng đăng ký | 2,000+ |
| Người dùng hoạt động hàng tháng (MAU) | 800+ |
| Tỉ lệ ghép phòng thành công | 15%+ |
| Doanh thu tháng 3 | 5-10 triệu VND |
| Khu vực phủ sóng | 1 thành phố (TP.HCM hoặc khu vực FPT) |

---

## 7. LỢI THẾ CẠNH TRANH

1. **Xác thực danh tính** — Không nền tảng phòng trọ nào tại VN làm tốt việc này
2. **Roommate matching** — Tính năng hoàn toàn mới, không có đối thủ trực tiếp
3. **Tập trung vào sinh viên** — UX/UI đơn giản, phù hợp Gen Z
4. **Giá minh bạch** — Buộc hiển thị tất cả chi phí, không phí ẩn
5. **Đội ngũ hiểu người dùng** — Chính nhóm phát triển cũng là sinh viên, hiểu pain point

---

## 8. ĐỘI NGŨ

| STT | Vai trò | Số lượng | Trách nhiệm chính |
|-----|---------|----------|--------------------|
| 1 | **Team Lead / Fullstack Dev** | 1 | Kiến trúc hệ thống, quản lý tiến độ, code backend |
| 2 | **Backend Dev** | 1 | API, database, xác thực, matching algorithm |
| 3 | **Frontend Dev** | 1 | Giao diện web, responsive, UX |
| 4 | **Marketing Lead** | 1 | Chiến lược marketing, content, social media |
| 5 | **Marketing Executive** | 1 | Chạy campaign, outreach chủ trọ, event |
| 6 | **Business Analyst / Kinh tế** | 1 | Tài chính, phân tích thị trường, pitch deck, pháp lý |

---

*Tài liệu chi tiết cho từng phần được trình bày trong các file tiếp theo.*
