# KIẾN TRÚC CÔNG NGHỆ - PHÒNG TRỌ XANH

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

### 1.1. Architecture Pattern: 3-Tier Layered + Monolithic (MVP)

Với đội ngũ 3 dev Java/React và timeline 12 tuần, chúng ta chọn **Monolithic với kiến trúc phân tầng 3 lớp (3-Tier Layered Architecture)** — tiêu chuẩn, rõ ràng, dễ phát triển nhanh nhưng có tính modul hóa cao để dễ tách thành microservices khi mở rộng.

```
┌───────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│                                                                   │
│   ┌─────────────┐    ┌──────────────────┐    ┌────────────────┐  │
│   │  Web App    │    │  Mobile Web      │    │  Admin Panel   │  │
│   │  (React)    │    │  (Responsive)    │    │  (React)       │  │
│   └──────┬──────┘    └────────┬─────────┘    └───────┬────────┘  │
│          │                    │                       │           │
└──────────┼────────────────────┼───────────────────────┼───────────┘
           │                    │                       │
           ▼                    ▼                       ▼
┌───────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / REVERSE PROXY                │
│                            (NGINX / Spring Cloud Gateway)         │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                       SPRING BOOT WEB API                         │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                  Presentation Layer                     │    │
│   │  Controllers: AuthController, RoomController,           │    │
│   │  MatchController, ChatController, ReviewController      │    │
│   └────────────────────────┬────────────────────────────────┘    │
│                            │                                      │
│   ┌────────────────────────┼────────────────────────────────┐    │
│   │                   Business Layer                        │    │
│   │  Services: AuthService, RoomService, MatchingService,   │    │
│   │  ChatService, NotificationService, VerificationService  │    │
│   └────────────────────────┬────────────────────────────────┘    │
│                            │                                      │
│   ┌────────────────────────┼────────────────────────────────┐    │
│   │                Data Access Layer                        │    │
│   │  Repositories: UserRepository, RoomRepository,          │    │
│   │  MatchRepository, MessageRepository, ReviewRepository   │    │
│   └────────────────────────┬────────────────────────────────┘    │
│                            │                                      │
│   ┌────────────────────────┼────────────────────────────────┐    │
│   │                Domain Layer (Entities)                  │    │
│   │  Models: User, UserProfile, Room, Match, Message,      │    │
│   │  Review, Swipe, SwapRequest, Rental, Report            │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │PostgreSQL│   │Cloudinary│   │ Goong    │   │ Twilio/  │
    │(Database)│   │(Images)  │   │ Maps API │   │ Stringee │
    └──────────┘   └──────────┘   └──────────┘   │ (OTP)    │
                                                  └──────────┘
```

---

## 2. TECH STACK CHI TIẾT

### 2.1. Backend

| Thành phần | Công nghệ | Lý do chọn |
|-----------|-----------|------------|
| **Framework** | Spring Boot 3.x (Java 17/21) | Tiêu chuẩn doanh nghiệp, mạnh mẽ, ổn định, cộng đồng lớn, hỗ trợ Spring Security bảo mật cao |
| **ORM** | Spring Data JPA (Hibernate) | Tự động sinh truy vấn, quản lý thực thể dễ dàng qua Repositories, hỗ trợ JPQL và Criteria API |
| **Database** | PostgreSQL | Hệ quản trị CSDL quan hệ mã nguồn mở mạnh mẽ nhất, hỗ trợ tốt kiểu JSON và truy vấn không gian (PostGIS nếu cần scale) |
| **Authentication** | Spring Security + JWT | Framework bảo mật tiêu chuẩn, quản lý phân quyền (Role-based) chặt chẽ, stateless session tối ưu |
| **Real-time** | Spring WebSocket + STOMP | Hỗ trợ chat real-time, thông báo trực tiếp qua giao thức pub/sub nhẹ nhàng và ổn định |
| **Caching** | Spring Cache + Caffeine / Redis | Tăng tốc độ truy vấn phòng trọ phổ biến, tối ưu tài nguyên hệ thống |
| **API Docs** | Springdoc-openapi (Swagger UI) | Tự động sinh tài liệu API trực tiếp từ mã nguồn, dễ dàng thử nghiệm API |

### 2.2. Frontend

| Thành phần | Công nghệ | Lý do chọn |
|-----------|-----------|------------|
| **Framework** | React 18 + TypeScript | Phổ biến, dễ phát triển, hệ sinh thái lớn |
| **UI Library** | Tailwind CSS v4 + Radix UI + MUI Icons | Giao diện hiện đại, responsive, tuỳ biến tối ưu |
| **State Management** | Zustand | Nhẹ hơn Redux, dễ dùng, đủ quản lý state toàn cục |
| **HTTP Client** | Axios + TanStack Query (React Query v5) | Caching, retry, loading states và đồng bộ dữ liệu tự động |
| **Map** | react-leaflet + Goong Maps API | Leaflet làm map renderer (miễn phí), Goong cung cấp Tiles + Autocomplete + Nearby Search |
| **Routing** | React Router v7 | Hỗ trợ file-system routing và quản lý data tải trang tối ưu |
| **Chat UI** | Custom component + STOMP client | Kết nối WebSocket/STOMP trực tiếp tới Spring Boot backend |

### 2.3. Infrastructure & DevOps

| Thành phần | Công nghệ | Chi phí |
|-----------|-----------|---------|
| **Hosting Backend** | Railway.app / Render / AWS Elastic Beanstalk | 0đ (Free tier / Trial) hoặc ~$5/tháng |
| **Hosting Frontend** | Vercel Free | 0đ |
| **Database** | PostgreSQL Free (Neon.tech / Supabase) hoặc VPS | 0đ (Free tier) hoặc ~150K/tháng |
| **Image Storage** | Cloudinary Free (25GB) | 0đ |
| **CI/CD** | GitHub Actions | 0đ |
| **Domain** | PhongTroXanh.vn qua inet.vn | ~150K/năm |
| **SSL** | Let's Encrypt (auto) | 0đ |
| **Monitoring** | Spring Boot Actuator + Prometheus + Grafana | 0đ |

---

## 3. DATABASE SCHEMA

### 3.1. ERD (Entity Relationship Diagram)

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      Users       │       │    UserProfiles   │       │      Rooms       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ Id (PK)          │──1:1──│ UserId (PK,FK)   │       │ Id (PK)          │
│ PhoneNumber      │       │ BudgetMin        │       │ LandlordId (FK)  │──→ Users
│ Email            │       │ BudgetMax        │       │ Title            │
│ FullName         │       │ PreferredDistrict│       │ Description      │
│ Role (enum)      │       │ University       │       │ Price            │
│ CccdNumber       │       │ SleepSchedule    │       │ ElectricityPrice │
│ CccdImageUrl     │       │ Cleanliness (1-5)│       │ WaterPrice       │
│ CccdVerified     │       │ SmokingOk (bool) │       │ WifiPrice        │
│ AvatarUrl        │       │ PetFriendly      │       │ ParkingPrice     │
│ IsVerified       │       │ Gender           │       │ Address          │
│ TrustScore       │       │ Bio              │       │ District         │
│ CreatedAt        │       │ MoveInDate       │       │ City             │
│ UpdatedAt        │       └──────────────────┘       │ Latitude         │
└──────────────────┘                                   │ Longitude        │
         │                                             │ RoomType (enum)  │
         │                                             │ Area (m²)        │
         │       ┌──────────────────┐                  │ MaxOccupants     │
         │       │     Swipes       │                  │ Amenities (JSON) │
         │       ├──────────────────┤                  │ Images (JSON[])  │
         ├──────→│ Id (PK)          │                  │ Status (enum)    │
         │       │ SwiperId (FK)    │──→ Users         │ IsVerified       │
         │       │ TargetId (FK)    │──→ Users         │ ExpiresAt        │
         │       │ Direction (enum) │                  │ ViewCount        │
         │       │ CreatedAt        │                  │ CreatedAt        │
         │       └──────────────────┘                  │ UpdatedAt        │
         │                                             └──────────────────┘
         │       ┌──────────────────┐                           │
         │       │     Matches      │                           │
         │       ├──────────────────┤                           │
         ├──────→│ Id (PK)          │                           │
         │       │ UserAId (FK)     │──→ Users                  │
         │       │ UserBId (FK)     │──→ Users                  │
         │       │ Status (enum)    │                           │
         │       │ CreatedAt        │                           │
         │       └──────────────────┘                           │
         │                                                      │
         │       ┌──────────────────┐       ┌──────────────────┐
         │       │  Conversations   │       │    Messages      │
         │       ├──────────────────┤       ├──────────────────┤
         ├──────→│ Id (PK)          │──1:N──│ Id (PK)          │
         │       │ RoomId (FK)      │──→ Rooms ConversationId(FK)│
         │       │ Participant1 (FK)│       │ SenderId (FK)    │──→ Users
         │       │ Participant2 (FK)│       │ Content          │
         │       │ CreatedAt        │       │ IsRead           │
         │       │ UpdatedAt        │       │ CreatedAt        │
         │       └──────────────────┘       └──────────────────┘
         │
         │       ┌──────────────────┐       ┌──────────────────┐
         │       │     Rentals      │       │     Reviews      │
         │       ├──────────────────┤       ├──────────────────┤
         ├──────→│ Id (PK)          │       │ Id (PK)          │
         │       │ TenantId (FK)    │──→ Users  RentalId (FK)    │──→ Rentals
         │       │ RoomId (FK)      │──→ Rooms  ReviewerId (FK)  │──→ Users
         │       │ StartDate        │       │ RevieweeId (FK)  │──→ Users
         │       │ EndDate          │       │ Rating (1-5)     │
         │       │ Status (enum)    │       │ Comment          │
         │       │ CheckInCode      │       │ CreatedAt        │
         │       │ IsLeaseholder    │       └──────────────────┘
         │       │ CreatedAt        │
         │       └──────────────────┘
         │
         │       ┌──────────────────┐       ┌──────────────────┐
         │       │   SwapRequests   │       │     Reports      │
         │       ├──────────────────┤       ├──────────────────┤
         └──────→│ Id (PK)          │       │ Id (PK)          │
                 │ RequesterId (FK) │──→ Users  ReporterId (FK)  │──→ Users
                 │ CurrentRoomId(FK)│──→ Rooms  TargetType (enum)│
                 │ TargetPrefs(JSON)│       │ TargetId         │
                 │ IsLeaseholder    │       │ Reason           │
                 │ LandlordStatus   │ (enum)│ Description      │
                 │ NewTenantId (FK) │──→ Users  Status (enum)    │
                 │ Status (enum)    │       │ CreatedAt        │
                 │ CreatedAt        │       └──────────────────┘
                 │ UpdatedAt        │
                 └──────────────────┘
```

### 3.2. Enums

```java
public enum UserRole { TENANT, LANDLORD, ADMIN }
public enum RoomType { PHONG_TRO, PHONG_GHEP, CAN_HO_MINI, NHA_CHUNG }
public enum RoomStatus { AVAILABLE, RENTED, HIDDEN, EXPIRED }
public enum SwipeDirection { LEFT, RIGHT }
public enum MatchStatus { PENDING, MATCHED, REJECTED, EXPIRED }
public enum ReportTargetType { ROOM, USER, REVIEW }
public enum ReportStatus { PENDING, REVIEWING, RESOLVED, DISMISSED }
public enum RentalStatus { ACTIVE, ENDED, CANCELLED }
public enum SwapLandlordStatus { PENDING, APPROVED, REJECTED, NOT_REQUIRED }
public enum SwapRequestStatus { OPEN, MATCHING, PENDING_LANDLORD, APPROVED, COMPLETED, CANCELLED }
```

---

## 4. API DESIGN

### 4.1. RESTful API Endpoints

#### Authentication
```
POST   /api/auth/send-otp          Gửi OTP đến số điện thoại
POST   /api/auth/verify-otp        Xác thực OTP → trả JWT
POST   /api/auth/refresh-token     Refresh JWT token
POST   /api/auth/logout             Đăng xuất
```

#### Users & Profiles
```
GET    /api/users/me                Lấy thông tin user hiện tại
PUT    /api/users/me                Cập nhật thông tin cá nhân
POST   /api/users/me/avatar        Upload avatar
POST   /api/users/me/cccd          Upload ảnh CCCD để xác thực
GET    /api/users/me/profile       Lấy profile matching
PUT    /api/users/me/profile       Cập nhật preferences (thói quen, ngân sách...)
```

#### Rooms
```
GET    /api/rooms                   Danh sách phòng (search, filter, pagination)
GET    /api/rooms/{id}              Chi tiết phòng
POST   /api/rooms                   [Landlord] Đăng phòng mới
PUT    /api/rooms/{id}              [Landlord] Cập nhật phòng
DELETE /api/rooms/{id}              [Landlord] Ẩn/xóa phòng
POST   /api/rooms/{id}/images      [Landlord] Upload ảnh phòng
GET    /api/rooms/nearby            Tìm phòng gần vị trí (lat, lng, radius)
GET    /api/rooms/landlord/me       [Landlord] Danh sách phòng của tôi
POST   /api/rooms/{id}/boost       [Landlord] Nâng tin nổi bật (trả phí)
```

#### Roommate Matching
```
GET    /api/matching/candidates     Danh sách người tương thích (swipe deck)
POST   /api/matching/swipe          Swipe left/right
GET    /api/matching/matches        Danh sách đã match
POST   /api/matching/swap/request   Tạo yêu cầu hoán đổi bạn cùng phòng
GET    /api/matching/swap/requests  Lấy danh sách các yêu cầu hoán đổi
PUT    /api/matching/swap/{id}/approve [Landlord] Phê duyệt yêu cầu swap của Leaseholder
PUT    /api/matching/swap/{id}/confirm Xác nhận hoàn thành hoán đổi phòng
```

#### Chat (REST + STOMP WebSocket)
```
GET    /api/conversations           Danh sách cuộc trò chuyện
GET    /api/conversations/{id}/messages  Tin nhắn trong cuộc trò chuyện
POST   /api/conversations           Tạo cuộc trò chuyện mới (khi match hoặc hỏi phòng)

WebSocket Endpoint: /ws/chat
STOMP Destinations:
  → Send: /app/chat.sendMessage (payload: MessageDTO)
  → Subscribe: /topic/messages/{conversationId} (payload: MessageDTO)
  → Send: /app/chat.typing (payload: TypingDTO)
  → Subscribe: /topic/typing/{conversationId} (payload: TypingDTO)
```

#### Rentals
```
POST   /api/rentals/check-in        Xác nhận bàn giao nhận phòng (1-click hoặc nhập OTP)
GET    /api/rentals/me              Lịch sử/Danh sách phòng đang thuê hiện tại
PUT    /api/rentals/{id}/terminate  Chấm dứt mối quan hệ thuê phòng
```

#### Reviews (Đánh giá)
```
GET    /api/reviews/room/{roomId}         Review của phòng
GET    /api/reviews/user/{userId}         Review của user
POST   /api/reviews                       Đánh giá (chỉ mở sau khi đã Rental check-in)
```

#### Admin
```
GET    /api/admin/verifications          Danh sách CCCD chờ duyệt
PUT    /api/admin/verifications/{id}     Duyệt/từ chối CCCD
GET    /api/admin/reports                Danh sách báo cáo
PUT    /api/admin/reports/{id}           Xử lý báo cáo
GET    /api/admin/dashboard              Thống kê tổng quan
```

### 4.2. Query Parameters mẫu cho GET /api/rooms

```
GET /api/rooms?
    city=hcm
    &district=quan9
    &priceMin=1500000
    &priceMax=3000000
    &roomType=PhongTro
    &amenities=wifi,dieuhoa,maylanh
    &nearLat=10.8412
    &nearLng=106.8098
    &radiusKm=3
    &sortBy=price_asc
    &page=1
    &pageSize=20
```

---

## 5. THUẬT TOÁN MATCHING

### 5.1. Weighted Compatibility Score

```java
@Service
public class MatchingServiceImpl implements MatchingService {

    @Override
    public double calculateScore(UserProfile a, UserProfile b) {
        double score = 0;

        // 1. Budget overlap (35%)
        score += 0.35 * budgetOverlap(a, b);

        // 2. Location proximity (25%)
        score += 0.25 * locationScore(a, b);

        // 3. Habit compatibility (20%)
        score += 0.20 * habitScore(a, b);

        // 4. Gender preference (10%)
        score += 0.10 * genderMatch(a, b);

        // 5. Move-in date (10%)
        score += 0.10 * moveInDateScore(a, b);

        return BigDecimal.valueOf(score * 100)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue(); // 0.0 - 100.0
    }
}
```

### 5.2. Chi tiết từng hàm

```
BudgetOverlap(a, b):
  overlap = min(a.BudgetMax, b.BudgetMax) - max(a.BudgetMin, b.BudgetMin)
  range = max(a.BudgetMax, b.BudgetMax) - min(a.BudgetMin, b.BudgetMin)
  return max(0, overlap / range)

LocationScore(a, b):
  if a.PreferredDistrict == b.PreferredDistrict → 1.0
  if same city, adjacent districts → 0.5
  else → 0.0

HabitScore(a, b):
  factors = [SleepSchedule, Cleanliness, Smoking, PetFriendly]
  matches = count of factors where a == b
  return matches / factors.length

GenderMatch(a, b):
  if either has no preference → 1.0
  if preferences align → 1.0
  else → 0.0

MoveInDateScore(a, b):
  daysDiff = abs(a.MoveInDate - b.MoveInDate)
  if daysDiff <= 7 → 1.0
  if daysDiff <= 14 → 0.7
  if daysDiff <= 30 → 0.4
  else → 0.1
```

---

## 6. BẢO MẬT & XÁC THỰC

### 6.1. Authentication Flow

```
┌──────────┐                    ┌──────────────┐                ┌──────────┐
│  Client   │                    │  API Server  │                │  Twilio/ │
│           │                    │              │                │ Stringee │
└─────┬─────┘                    └──────┬───────┘                └────┬─────┘
      │                                 │                             │
      │  1. POST /auth/send-otp         │                             │
      │  { phone: "0901234567" }        │                             │
      │────────────────────────────────→│                             │
      │                                 │  2. Generate OTP            │
      │                                 │  Store in cache (5min TTL)  │
      │                                 │                             │
      │                                 │  3. Send SMS                │
      │                                 │────────────────────────────→│
      │                                 │                             │
      │  4. POST /auth/verify-otp       │                             │
      │  { phone, otp: "123456" }       │                             │
      │────────────────────────────────→│                             │
      │                                 │  5. Verify OTP              │
      │                                 │  Create/Get User            │
      │                                 │  Generate JWT + RefreshToken│
      │                                 │                             │
      │  6. { accessToken, refreshToken }│                            │
      │←────────────────────────────────│                             │
      │                                 │                             │
```

### 6.2. Security Measures

| Lớp bảo mật | Giải pháp |
|-------------|-----------|
| **Authentication** | JWT (15 phút) + Refresh Token (7 ngày) |
| **Authorization** | Role-based (Tenant, Landlord, Admin) + Resource-based |
| **Rate Limiting** | 5 OTP/số/giờ, 100 requests/phút/IP |
| **Input Validation** | Jakarta Bean Validation (@Valid, @NotNull...) |
| **SQL Injection** | Spring Data JPA / JPQL parameterized queries |
| **XSS** | Content sanitization cho review/comment |
| **CORS** | Whitelist domain PhongTroXanh.vn |
| **HTTPS** | Bắt buộc, redirect HTTP → HTTPS |
| **Image Upload** | Giới hạn 5MB, chỉ jpg/png, scan malware |
| **CCCD Data** | Mã hóa AES-256, chỉ admin xem, xóa sau xác thực |

### 6.3. Anti-Abuse Flagging System (Cơ chế chống báo cáo giả)

Để ngăn chặn việc cạnh tranh không lành mạnh (ví dụ: các chủ trọ dùng tài khoản ảo để báo cáo dìm hàng tin đăng của đối thủ) và lạm dụng tính năng báo cáo, hệ thống áp dụng cơ chế xác thực và tính điểm trọng số báo cáo như sau:

#### 1. Hệ thống tính điểm trọng số báo cáo (Report Weighting System)
Mỗi tài khoản gửi báo cáo sẽ có một trọng số (Weight) khác nhau dựa trên mức độ uy tín và sự liên quan thực tế:
*   **Trọng số = 1.5:** Người thuê thực tế đã check-in thuê phòng đó (Rental Status = Active/Ended) và có huy hiệu xác minh CCCD.
*   **Trọng số = 1.0:** Người thuê đã xác minh danh tính (CCCD Verified) nhưng chưa check-in tại phòng này.
*   **Trọng số = 0.2:** Người thuê chưa xác minh danh tính.
*   **Trọng số = 0.0 (Không kích hoạt tự động ẩn):** Chủ trọ khác báo cáo phòng trọ đối thủ. Các báo cáo này chỉ được đưa thẳng vào hàng đợi Admin để kiểm duyệt thủ công, không bao giờ được tính điểm cộng dồn để tự động ẩn tin đăng nhằm tránh phá hoại.

**Công thức ẩn tin tự động:** Tin đăng sẽ tự động bị ẩn tạm thời và chuyển sang trạng thái chờ duyệt của Admin khi tổng trọng số báo cáo đạt ngưỡng:
$$\sum (\text{Report\_Weight}) \ge 3.0$$

#### 2. Cơ chế xử phạt báo cáo sai sự thật (Penalty for Malicious Flagging)
Khi Admin kiểm duyệt và xác định báo cáo là **Báo cáo giả/Báo cáo láo**:
*   **Hạ TrustScore:** Người báo cáo bị trừ trực tiếp **50 điểm TrustScore** và mất huy hiệu xanh.
*   **Hạn chế tính năng:** Nếu TrustScore của tài khoản < 50, hệ thống sẽ khóa chức năng Báo cáo (Report) và Đánh giá (Review) của tài khoản đó trong 30 ngày.
*   **Khóa tài khoản:** Vi phạm báo cáo giả từ 3 lần trở lên sẽ bị khóa tài khoản vĩnh viễn.

#### 3. Quy trình Kháng nghị (Appeal Flow) & Whitelisting cho Chủ trọ
*   **Thông báo & Kháng nghị nhanh:** Ngay khi tin đăng bị tự động ẩn, chủ trọ nhận thông báo: *"Tin đăng [Tên phòng] bị tạm ẩn do nhận được báo cáo phản hồi tiêu cực. Bạn có thể gửi Kháng nghị bằng cách cung cấp thêm hình ảnh thực tế hoặc hóa đơn điện nước gần nhất"*.
*   **Duyệt ưu tiên:** Đơn kháng nghị của chủ trọ được xếp vào hàng đợi ưu tiên cao của Admin (cam kết xử lý trong 4 giờ làm việc).
*   **Whitelisting (Danh sách trắng tạm thời):** Nếu kháng nghị thành công, tin đăng được khôi phục đồng thời đưa vào *Whitelisting* trong 7 ngày tiếp theo. Trong thời gian này, các báo cáo mới gửi lên tin đăng này sẽ không được cộng dồn trọng số để ẩn tin tự động, mà bắt buộc phải chờ Admin duyệt thủ công.

---

## 7. PROJECT STRUCTURE

```
PhongTroXanh/
├── backend/                              # Spring Boot Backend (Maven project)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/phongtroxanh/
│   │   │   │   ├── config/               # Security config, WebSocket config, Cache configurations
│   │   │   │   ├── controller/           # REST Controllers (@RestController)
│   │   │   │   ├── dto/                  # Request / Response DTOs
│   │   │   │   ├── entity/               # JPA @Entity models (User, Room, Match, Message...)
│   │   │   │   ├── repository/           # Spring Data JPA Repository interfaces
│   │   │   │   ├── service/              # Service interfaces
│   │   │   │   │   └── impl/             # Service implementation classes
│   │   │   │   └── exception/            # Custom exceptions & GlobalExceptionHandler
│   │   │   └── resources/
│   │   │       ├── application.yml       # App configuration variables
│   │   │       └── db/migration/         # Flyway schema migrations
│   │   └── test/                         # JUnit 5 & Mockito test suites
│   └── pom.xml                           # Maven dependencies (Spring Boot starter dependencies)
│
├── frontend/                             # React Frontend (Vite + React Router v7)
│   ├── src/
│   │   ├── app/                          # Routes & page components (Routing file-system)
│   │   ├── components/                   # Global shared UI components (Radix/custom components)
│   │   ├── features/                     # Modular business features (Auth, Rooms, Matching, Chat)
│   │   │   ├── auth/                     # Login, Register, OTP verification
│   │   │   ├── rooms/                    # Room posting, room deck listing, maps
│   │   │   ├── matching/                 # Swiping roommates, compatibility scoring
│   │   │   └── chat/                     # WebSocket chat UI & integration
│   │   ├── hooks/                        # Custom reusable React hooks
│   │   ├── lib/                          # HTTP Client & map renderer setups
│   │   ├── styles/                       # CSS stylesheets & Tailwind settings
│   │   ├── types/                        # TypeScript types & interface declarations
│   │   └── main.tsx                      # Frontend entry point
│   └── package.json
│
├── docker-compose.yml                    # Local multi-container setup (PostgreSQL, Redis, PGAdmin)
├── .github/workflows/ci.yml              # CI/CD pipelines (Github Actions)
└── README.md
```

---

## 8. DEPLOYMENT ARCHITECTURE

### 8.1. MVP (Tháng 1-3) — Miễn phí

```
                    ┌──────────────┐
                    │   Vercel     │ ← React Frontend (Free)
                    │   (CDN)     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Railway/Render│ ← Spring Boot API (Free Tier/Trial)
                    │  App Service │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │PostgreSQL│ │Cloudinary│ │ Goong    │
       │ Neon/Supa│ │ Free     │ │ Maps     │
       │ (Free)   │ │ (25GB)   │ │ Free     │
       └──────────┘ └──────────┘ └──────────┘
```

### 8.2. Scale (Tháng 6+) — Khi có doanh thu

```
                    ┌──────────────┐
                    │   Vercel     │ ← React Frontend
                    │   (CDN)     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   NGINX      │ ← Load Balancer + SSL
                    │              │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  VPS (2-4GB) │ ← Spring Boot + WebSocket
                    │  Vultr/DO   │
                    │  ~200K/tháng │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │PostgreSQL│ │Cloudinary│ │  Redis   │
       │ on VPS   │ │ Paid     │ │ Cache    │
       └──────────┘ └──────────┘ └──────────┘
```

---

## 9. PHÂN CÔNG CÔNG VIỆC THEO DEV

| Dev | Vai trò | Phụ trách |
|-----|---------|-----------|
| **Dev 1 (Team Lead)** | Fullstack / Architect | Setup project, CI/CD, Auth, Database, Review code |
| **Dev 2** | Backend Focus | Room CRUD, Search/Filter, Matching algorithm, Admin API |
| **Dev 3** | Frontend Focus | React UI, Map integration, Chat UI, Responsive design |

Cả 3 dev cùng support: Bug fix, testing, deployment.

---

*Tài liệu tiếp theo: 04 - Product Roadmap & MVP Features*
