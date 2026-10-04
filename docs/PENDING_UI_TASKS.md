# Pending UI Tasks — PhongTroXanh FE

Danh sách các tính năng **đã có logic/state ở FE nhưng chưa có UI hoàn chỉnh**.
Dùng file này để nhắc nhở khi quay lại làm FE sau khi BE xong.

---

## 🔴 Priority: Cần bổ sung trước khi release

### [SUPER MATCH] Thêm nút ⭐ Super Match vào SwipeStage

- **File cần sửa:** [`src/components/shared/SwipeStage.tsx`](../src/components/shared/SwipeStage.tsx)
- **Context:** [`src/app/context/MonetizationContext.tsx`](../src/app/context/MonetizationContext.tsx) — `superMatchesLeft` đã có state đầy đủ
- **Màn hình dùng SwipeStage:**
  - `features/roommates/pages/Roommates.tsx` — Tìm bạn ở ghép
  - `features/rooms/pages/Discover.tsx` — Khám phá phòng

**Việc cần làm:**
1. Thêm prop `onSuperMatch?: (item: T) => void` vào `SwipeStage`
2. Thêm nút ⭐ màu vàng giữa nút Undo và nút Heart trong hàng action buttons
3. Khi bấm ⭐:
   - Kiểm tra `superMatchesLeft > 0`, nếu không → `openPricing()`
   - Nếu có → gọi `onSuperMatch(current)` + `setSuperMatchesLeft(prev => prev - 1)`
4. **Phím tắt**: Phím `↑` hiện đang dùng cho `onInfo` (chi tiết). Cân nhắc đổi sang `Shift+↑` hoặc giữ nguyên Info ở `↑`, Super Match ở nút bấm

**Hành vi Super Match cần hiển thị cho target (người bị super match):**
- Card của người đã Super Match có viền màu vàng/badge ⭐ trong feed
- Cần backend trả thêm field `isSuperMatchedByMe: boolean` hoặc `superMatchedByUserId` trong response feed
- Xem spec API: `GET /api/v1/matching/feed` — cần thêm field này vào MatchCandidateDTO

---

## 🟡 Cần làm sau khi BE kết nối

### [PAYMENT] Kết nối real API thay mock

- **File:** `src/app/context/MonetizationContext.tsx` — hàm `confirmPayment()` hiện đang mock
- Cần gọi `POST /api/v1/payments/create-order` → nhận VNPay URL hoặc VietQR
- Sau khi thanh toán thành công → gọi lại `GET /api/v1/users/me` để refresh `swipesLeft`, `boostsLeft`, `superMatchesLeft`

### [ROOMTYPES] Fetch động từ API thay mock

- **File:** `src/data/mock.ts` line 305 — `export const roomTypes = [...]`
- Hiện hardcode 4 loại: `["Phòng trọ", "Phòng khép kín", "Studio", "Căn hộ mini"]`
- Cần gọi `GET /api/v1/room-types` → trả về danh sách từ bảng `room_types` (dynamic, Admin thêm được)
- **7 màn hình** dùng `roomTypes` từ mock — tất cả cần update

### [AUTH] Kết nối login/register thật

- **File:** `src/features/auth/pages/Login.tsx`, `Onboarding.tsx`, `LandlordOnboarding.tsx`
- Hiện tại FE dùng `AuthContext` với mock user
- Cần gọi `POST /api/v1/auth/login`, `POST /api/v1/auth/register`

---

## 🟢 Nice to have

### [SWIPE] Gesture vuốt lên = Super Match

- Hiện tại `SwipeStage.tsx` chỉ nhận drag theo trục X (`drag="x"`)
- Để hỗ trợ "vuốt lên = Super Match" (như Tinder), cần đổi sang `drag` 2 chiều
- Khá phức tạp hơn, **không ưu tiên** — dùng nút bấm trước

---

*Cập nhật lần cuối: 2026-09-02*
