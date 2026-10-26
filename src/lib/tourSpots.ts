export type LabelSide = "top" | "bottom" | "left" | "right";

export interface TourSpot {
  /** CSS selector, e.g. "[data-tour='discover-swipe-card']" */
  selector: string;
  /** Short title shown in step header */
  label: string;
  /** Detailed explanation of logic, buttons, icons, and workflow connection */
  description: string;
  /** Practical pro-tip for the user */
  tip?: string;
  /** Preferred side for Popover placement */
  labelSide?: LabelSide;
  /** Padding around target element in px (default: 8) */
  pad?: number;
  /** Optional max height clamp for spotlight cutout on very tall containers */
  maxSpotHeight?: number;
}

export interface TourFlowStep {
  id: string;
  /** Short name shown in the chapter switcher */
  shortTitle: string;
  /** Full screen/module title */
  title: string;
  /** Route path (including query string for landlord tabs) */
  route: string;
  /** High-level summary of this screen's role in the system */
  summary: string;
  /** Ordered list of spotlight targets on this screen */
  spots: TourSpot[];
}

/**
 * ============================================================================
 * 1. LUỒNG HƯỚNG DẪN NGƯỜI THUÊ (TENANT WORKFLOWS - 8 MÀN HÌNH CỐT LÕI)
 * ============================================================================
 */
export const TENANT_TOUR_FLOWS: TourFlowStep[] = [
  {
    id: "tenant-discover",
    shortTitle: "1. Tìm & Quẹt phòng",
    title: "Khám phá & Quẹt thẻ tìm phòng (/discover)",
    route: "/discover",
    summary:
      "Trung tâm tìm phòng thông minh: lọc theo trường ĐH/quận/tiện nghi, quẹt phải để lưu & đưa vào bảng so sánh, hoặc chuyển sang bản đồ trực quan.",
    spots: [
      {
        selector: "[data-tour='discover-swipe-card']",
        label: "Thẻ phòng tương tác & Điểm % Phù hợp",
        description:
          "Hiển thị giá thuê, diện tích, tiện nghi nổi bật, trạng thái xác minh CCCD của Chủ trọ và tỷ lệ % Phù hợp với hồ sơ của bạn. Dùng mũi tên Trái/Phải trên ảnh để lướt xem toàn bộ ảnh thực tế của phòng.",
        tip: "Bấm trực tiếp vào vùng ảnh trên thẻ phòng để mở ngay trang Chi tiết phòng đầy đủ (/rooms/:id).",
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 440,
      },
      {
        selector: "[data-tour='discover-swipe-actions']",
        label: "4 Nút quyết định nhanh dưới thẻ phòng",
        description:
          "Từ trái sang phải: (1) Dấu X đỏ: Bỏ qua phòng chưa ưng; (2) Mũi tên vàng: Hoàn tác lại phòng vừa lỡ tay vuốt qua; (3) Chữ i xanh dương: Mở trang chi tiết phí điện/nước & đặt lịch hẹn; (4) Tim xanh lá: Lưu vào Yêu thích và đẩy vào hàng đợi So sánh.",
        tip: "Bạn cũng có thể dùng phím mũi tên ← (Bỏ qua), → (Thích), ↑ (Xem chi tiết) trên bàn phím.",
        labelSide: "top",
        pad: 10,
      },
      {
        selector: "[data-tour='discover-filter-sidebar']",
        label: "Bộ lọc Quận, Ngân sách & 23 Tiện nghi",
        description:
          "Lọc chính xác theo khoảng giá, Quận/Huyện, Loại hình phòng và 23 tiện nghi tiếng Việt (Máy lạnh, WC riêng, Giờ tự do, Khóa vân tay...). Hỗ trợ gõ tên trường ĐH (VD: Bách Khoa, UIT, FTU) để tự động suy luận khu vực gần trường.",
        tip: "Bấm 'Xem thêm (+13 tiện nghi)' để mở rộng đầy đủ 23 tiêu chí lọc rồi nhấn 'Áp dụng bộ lọc'.",
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 460,
      },
      {
        selector: "[data-tour='discover-btn-compare'], [data-tour='discover-view-switcher']",
        label: "Nút So sánh song song 4 phòng",
        description:
          "Đưa các phòng bạn vừa quẹt phải (Thả tim) sang bảng phân tích song song tối đa 4 phòng cùng lúc để đối chiếu giá thuê, tiền cọc, diện tích và phí dịch vụ.",
        tip: "Con số trong ngoặc hiển thị số phòng bạn đã lưu sẵn sàng để đưa vào bảng đối chiếu.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='discover-btn-map'], [data-tour='discover-view-switcher']",
        label: "Nút Xem bản đồ giá & Trường Đại học",
        description:
          "Chuyển sang giao diện Bản đồ số tương tác để xem vị trí ghim giá từng phòng ('3.5tr', '4.2tr') và đo khoảng cách từng km từ phòng trọ tới trường Đại học hoặc công ty của bạn.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='tenant-nav-tabs']",
        label: "5 Tab điều hướng chính trên thanh Header",
        description:
          "Chuyển đổi tức thì giữa 5 phân khu cốt lõi của Người thuê: (1) Tìm phòng, (2) Ghép bạn ở ghép, (3) Phòng của tôi (quản lý lịch hẹn & hợp đồng), (4) Đổi/Pass phòng và (5) Tin nhắn trực tuyến.",
        tip: "Mọi phòng bạn lưu hoặc đăng ký xem ở tab Tìm phòng đều tự động đồng bộ sang các tab còn lại.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='nav-icon-crown'], [data-tour='tenant-nav-actions']",
        label: "Biểu tượng Vương miện — Gói Hội viên VIP",
        description:
          "Mở bảng quyền lợi Hội viên Premium dành cho người thuê: mở khóa lượt vuốt tìm phòng & tìm bạn ở ghép không giới hạn mỗi ngày.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='nav-icon-saved'], [data-tour='tenant-nav-actions']",
        label: "Biểu tượng Trái tim — Danh sách Phòng đã lưu",
        description:
          "Truy cập nhanh kho lưu trữ tất cả các phòng trọ bạn đã bấm thả tim để xem lại bất kỳ lúc nào hoặc chọn phòng đưa vào bảng So sánh.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='nav-icon-avatar'], [data-tour='tenant-nav-actions']",
        label: "Chuông Thông báo & Menu Hồ sơ / Điểm Uy Tín",
        description:
          "Biểu tượng Chuông báo hiệu tức thì khi Chủ trọ duyệt lịch hẹn xem phòng. Bấm vào Avatar góc phải để quản lý Hồ sơ cá nhân, Xác thực CCCD (+20 TrustScore) và xem Điểm Uy Tín của bạn.",
        tip: "Khi đã hiểu rõ màn hình Khám phá, bấm 'Qua màn tiếp' bên dưới để xem tiếp hướng dẫn Bản đồ & Trường ĐH!",
        labelSide: "bottom",
        pad: 6,
      },
    ],
  },
  {
    id: "tenant-map",
    shortTitle: "2. Bản đồ & Trường ĐH",
    title: "Tìm phòng trên Bản đồ & Định vị Trường ĐH (/map)",
    route: "/map",
    summary:
      "Quan sát trực quan ghim giá phòng trên bản đồ, tìm phòng theo bán kính quanh các trường Đại học / Khu công nghệ và định vị GPS thực tế.",
    spots: [
      {
        selector: "[data-tour='map-landmark-search']",
        label: "Tìm theo Trường ĐH, Công ty & Điểm mốc",
        description:
          "Nhập tên trường đại học, công ty, tuyến đường hoặc bấm vào các chip 'Xem nhanh' (ĐH Bách Khoa, ĐH KHTN, ĐH Quốc tế...) để bản đồ tự động bay tới và tính khoảng cách từng km từ phòng trọ tới điểm mốc.",
        tip: "Khi chọn một trường ĐH, mỗi thẻ phòng bên dưới sẽ hiện rõ huy hiệu 'Cách ĐH ... m / km' để bạn ước lượng quãng đường đi học.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='map-gps-controls']",
        label: "Định vị GPS 'Gần tôi' & Quay về Bàn quẹt",
        description:
          "Bấm 'Gần tôi' để lấy tọa độ GPS hiện tại và quét các phòng trọ còn trống xung quanh bạn. Bấm nút 'Vuốt' để quay lại giao diện quẹt thẻ bất kỳ lúc nào.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='map-room-list']",
        label: "Danh sách phòng đồng bộ với Ghim giá trên Bản đồ",
        description:
          "Khi bạn rê chuột hoặc bấm lần 1 vào thẻ phòng trong danh sách, bản đồ bên phải sẽ bay tới và phóng to ghim giá ('3.5tr', '4.2tr') của phòng đó. Bấm lần 2 vào thẻ đang chọn để mở trang Chi tiết phòng.",
        tip: "Các phòng có cùng địa chỉ tòa nhà được hệ thống tự động tách nhẹ tọa độ để các ghim giá không bao giờ đè lên nhau.",
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 420,
      },
    ],
  },
  {
    id: "tenant-compare",
    shortTitle: "3. So sánh phòng",
    title: "Bảng So sánh Trực diện 4 Phòng (/compare)",
    route: "/compare",
    summary:
      "Đặt tối đa 4 phòng trọ cạnh nhau để đối chiếu giá thuê, tiền cọc, diện tích, độ uy tín chủ trọ, phí dịch vụ và danh sách tiện nghi.",
    spots: [
      {
        selector: "[data-tour='compare-header-actions']",
        label: "Nút '+ Thêm phòng so sánh' & Quản lý danh sách",
        description:
          "Bạn có thể thêm tối đa 4 phòng vào bảng so sánh từ danh sách phòng đã lưu, phòng vừa quẹt thích trên trang Khám phá, hoặc tìm kiếm trực tiếp từ kho phòng.",
        tip: "Bấm '+ Thêm phòng so sánh' để mở hộp thoại lọc thông minh theo đúng tiêu chí hồ sơ của bạn.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='compare-room-cards'], [data-tour='compare-table-area']",
        label: "Thẻ phòng đối chiếu, Huy hiệu Tối ưu & Nút Thuê nhanh",
        description:
          "Hiển thị song song ảnh phòng, tiêu đề, địa chỉ và tự động gắn huy hiệu 'Tiết kiệm nhất' (xanh lá) hoặc 'Rộng nhất' (xanh dương). Bạn có thể bấm nút thùng rác góc phải ảnh để đổi phòng khác, hoặc bấm 'Chi tiết' / 'Thuê' ngay dưới phòng ưng ý.",
        labelSide: "bottom",
        pad: 8,
        maxSpotHeight: 310,
      },
      {
        selector: "[data-tour='compare-price-row'], [data-tour='compare-table-area']",
        label: "Tự động tô sáng thông số có lợi nhất cho bạn",
        description:
          "Trên từng dòng thông số (Giá thuê, Đặt cọc, Diện tích, Điểm uy tín chủ trọ, Phí điện/nước và 23 Tiện nghi), hệ thống tự động tô đậm màu xanh cho phòng có chỉ số tốt nhất để bạn ra quyết định trong tích tắc.",
        tip: "Kéo xuống bên dưới bảng để đối chiếu chi tiết từng khoản phí phụ thu và dấu tích tiện nghi của các phòng.",
        labelSide: "top",
        pad: 6,
        maxSpotHeight: 160,
      },
    ],
  },
  {
    id: "tenant-roommates",
    shortTitle: "4. Ghép bạn ở ghép",
    title: "Quẹt Thẻ Tìm Bạn Cùng Phòng Hợp Lối Sống (/roommates)",
    route: "/roommates",
    summary:
      "Thuật toán chấm điểm tương thích dựa trên ngân sách, khu vực quận ưu tiên và 5 thói quen sinh hoạt (giờ giấc, vệ sinh, hút thuốc, tiếng ồn, dẫn khách).",
    spots: [
      {
        selector: "[data-tour='roommates-header-controls']",
        label: "Công tắc Hiển thị hồ sơ, Đẩy top 24h & Nút Đã ghép",
        description:
          "(1) Công tắc 'Hiển thị hồ sơ': cho phép ẩn/hiện hồ sơ của bạn trên bàn quẹt; (2) Nút 'Đẩy top 24h': ưu tiên đưa hồ sơ của bạn lên đầu danh sách gợi ý; (3) Nút 'Đã ghép': mở danh sách những người đã thích nhau 2 chiều.",
        tip: "Nếu bạn đã tìm đủ bạn cùng phòng, hãy tắt 'Hiển thị hồ sơ' để không nhận thêm lời mời mới.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='roommates-swipe-card']",
        label: "Thẻ Hồ sơ Bạn trọ & Huy hiệu Lối sống",
        description:
          "Hiển thị trường học/nơi làm việc, ngân sách mong muốn, các thẻ thói quen sinh hoạt (Ngủ trước 23h, Gọn gàng, Không hút thuốc) và tỷ lệ % Hợp cạ với bạn.",
        tip: "Bấm vào ảnh đại diện hoặc nút chữ (i) bên dưới để xem biểu đồ phân tích độ hợp chi tiết từng tiêu chí.",
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 440,
      },
      {
        selector: "[data-tour='roommates-swipe-actions']",
        label: "Gửi tín hiệu Ghép đôi 2 chiều",
        description:
          "Bấm nút Tim xanh (Phù hợp) để gửi lời mời làm quen. Khi đối phương cũng bấm Thích bạn, hệ thống sẽ thông báo Ghép đôi thành công (Match) và mở khóa phòng Chat 1-1.",
        labelSide: "top",
        pad: 10,
      },
    ],
  },
  {
    id: "tenant-matches",
    shortTitle: "5. Bạn đã ghép",
    title: "Danh sách Bạn Cùng Phòng Đã Ghép Đôi (/matches)",
    route: "/matches",
    summary:
      "Quản lý các kết nối bạn cùng phòng đã tương hợp 2 chiều, xem điểm TrustScore của đối phương và mở cuộc trò chuyện trực tiếp.",
    spots: [
      {
        selector: "[data-tour='matches-main-list']",
        label: "Danh sách kết nối tương hợp 2 chiều",
        description:
          "Mỗi thẻ hiển thị phần trăm tương thích lối sống, trường học/công ty và điểm uy tín của bạn cùng phòng. Bạn có thể bấm 'Nhắn tin ngay' để trao đổi việc thuê chung hoặc hủy ghép đôi nếu không còn phù hợp.",
        tip: "Hãy trao đổi rõ về ngân sách chia tiền phòng, tiền điện nước và nội quy sinh hoạt chung qua khung Chat trước khi cùng đi xem phòng.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 360,
      },
    ],
  },
  {
    id: "tenant-rentals",
    shortTitle: "6. Phòng của tôi",
    title: "Theo dõi Lịch hẹn, Bàn giao & Hợp đồng (/rentals/me)",
    route: "/rentals/me",
    summary:
      "Nơi quản lý toàn bộ vòng đời thuê phòng: từ lúc gửi yêu cầu hẹn xem phòng, chờ chủ trọ phê duyệt, xác nhận dọn vào ở (+10 TrustScore) đến khi thanh lý hợp đồng.",
    spots: [
      {
        selector: "[data-tour='rentals-header-bar']",
        label: "Trung tâm theo dõi Hợp đồng & Lịch hẹn",
        description:
          "Mọi yêu cầu 'Đăng ký xem & thuê phòng' bạn gửi từ trang Chi tiết phòng sẽ xuất hiện tại đây và tự động làm mới trạng thái mỗi 8 giây.",
        tip: "Bạn có thể bấm nút 'Làm mới' bất kỳ lúc nào để cập nhật phản hồi mới nhất từ Chủ trọ.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='rentals-list-area']",
        label: "Quy trình 3 Bước: Chờ duyệt -> Nhận phòng -> Đang thuê",
        description:
          "Bước 1 (Chờ chủ trọ duyệt): Chủ trọ xem hồ sơ và duyệt lịch hẹn. Bước 2 (Đã duyệt - Chờ nhận phòng): Nút 'Xác nhận đã nhận phòng' sẽ sáng lên để bạn bấm khi nhận chìa khóa. Bước 3 (Đang thuê): Hợp đồng có hiệu lực, cộng +10 điểm TrustScore và mở khóa quyền viết Đánh giá phòng.",
        tip: "Lưu ý quan trọng: Bạn chỉ có thể viết Đánh giá công khai cho phòng trọ sau khi đã hoàn tất bước 'Xác nhận đã nhận phòng' tại màn hình này.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 360,
      },
    ],
  },
  {
    id: "tenant-swap",
    shortTitle: "7. Đổi / Pass phòng",
    title: "Chợ Chuyển Nhượng & Hoán Đổi Hợp Đồng (/swap)",
    route: "/swap",
    summary:
      "Giải pháp chuyển nhượng hợp đồng thuê phòng minh bạch 3 bên (Người đi - Người tiếp quản - Chủ trọ) giúp bảo toàn tiền đặt cọc khi cần chuyển chỗ ở trước hạn.",
    spots: [
      {
        selector: "[data-tour='swap-tabs-bar']",
        label: "3 Chế độ: Khám phá tin, Đăng tin swap & Yêu cầu của tôi",
        description:
          "Tab 'Khám phá tin': tìm các phòng đang cần pass lại hợp đồng với giá gốc. Tab 'Đăng tin swap': tạo yêu cầu tìm người thế chỗ cho phòng bạn đang thuê. Tab 'Yêu cầu của tôi': theo dõi tiến độ ghép ứng viên và chờ Chủ trọ phê duyệt.",
        tip: "Chọn đúng phòng bạn đang có hợp đồng thuê khi đăng tin để Chủ trọ có thể phê duyệt Phụ lục chuyển nhượng chính thức.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='swap-safety-guide']",
        label: "Quy trình Bảo toàn Tiền đặt cọc 3 bên",
        description:
          "Khi có ứng viên đồng ý nhận phòng của bạn, yêu cầu sẽ chuyển sang màn hình 'Chuyển nhượng' của Chủ trọ. Ngay khi Chủ trọ bấm Phê duyệt, hợp đồng cũ của bạn được tất toán hợp pháp và quyền thuê chuyển sang người mới.",
        labelSide: "left",
        pad: 8,
        maxSpotHeight: 360,
      },
    ],
  },
  {
    id: "tenant-chat",
    shortTitle: "8. Tin nhắn Real-time",
    title: "Trò chuyện Trực tiếp với Chủ trọ & Bạn cùng phòng (/chat)",
    route: "/chat",
    summary:
      "Hệ thống nhắn tin thời gian thực qua WebSocket, phân loại rõ cuộc trò chuyện với Chủ trọ và Bạn cùng phòng kèm câu hỏi gợi ý nhanh.",
    spots: [
      {
        selector: "[data-tour='chat-Workspace']",
        label: "Danh sách Hội thoại & Khung Chat WebSocket",
        description:
          "Bên trái cho phép lọc hội thoại theo 'Tất cả', 'Chủ trọ' hoặc 'Bạn cùng phòng'. Bên phải là khung chat thời gian thực tích hợp sẵn các mẫu câu hỏi nhanh ('Phòng còn trống không ạ?', 'Khi nào xem phòng được?') và gửi hình ảnh.",
        tip: "Trạng thái 'Trực tuyến (Real-time)' màu xanh lá trên góc khung chat báo hiệu kết nối WebSocket đang hoạt động tức thì.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 380,
      },
    ],
  },
];

/**
 * Các điểm hướng dẫn bổ sung khi người dùng đang đứng ở trang Chi tiết phòng (/rooms/:id),
 * Phòng đã lưu (/saved) hoặc Hồ sơ (/profile)
 */
export const TENANT_EXTRA_PAGE_SPOTS: Record<
  string,
  { title: string; summary: string; spots: TourSpot[] }
> = {
  "/rooms/": {
    title: "Chi tiết Phòng trọ & Đặt lịch xem phòng (/rooms/:id)",
    summary:
      "Kiểm tra hình ảnh thực tế, bảng minh bạch chi phí điện/nước/cọc, độ uy tín của Chủ trọ và gửi yêu cầu hẹn xem & thuê phòng.",
    spots: [
      {
        selector: "[data-tour='room-detail-gallery']",
        label: "Thư viện Ảnh thực tế (Hỗ trợ phóng to)",
        description:
          "Bấm vào bất kỳ bức ảnh nào để mở chế độ phóng to toàn màn hình (Lightbox), giúp bạn quan sát kỹ diện tích, cửa sổ và nội thất phòng.",
        labelSide: "bottom",
        pad: 8,
        maxSpotHeight: 360,
      },
      {
        selector: "[data-tour='room-detail-booking-box']",
        label: "Hồ sơ Chủ trọ & Nút Đăng ký Xem / Thuê phòng",
        description:
          "Kiểm tra huy hiệu Xác minh CCCD và điểm đánh giá của Chủ trọ. Bấm 'Đăng ký xem & thuê phòng' để chọn ngày hẹn xem thực tế và ngày dọn vào ở, hoặc bấm 'Nhắn tin cho chủ trọ' để trao đổi ngay.",
        tip: "Sau khi gửi yêu cầu đăng ký, bạn sẽ được chuyển tới mục 'Phòng của tôi' (/rentals/me) để theo dõi trạng thái Chủ trọ phê duyệt.",
        labelSide: "left",
        pad: 8,
      },
      {
        selector: "[data-tour='room-detail-fees']",
        label: "Bảng Minh bạch Chi phí Hàng tháng",
        description:
          "Niêm yết rõ ràng Tiền thuê, Tiền đặt cọc, giá Điện, Nước, Wi-Fi và phí gửi xe do Chủ trọ cam kết, ngăn chặn hoàn toàn chi phí ẩn.",
        labelSide: "top",
        pad: 8,
      },
      {
        selector: "[data-tour='room-detail-review-report']",
        label: "Đánh giá Xác thực & Báo cáo Vi phạm",
        description:
          "Nút 'Viết đánh giá' dành riêng cho người thuê đã hoàn tất nhận phòng thực tế (Check-in), đảm bảo 100% nhận xét minh bạch. Nếu phát hiện tin ảo hoặc thu phí sai cam kết, hãy bấm 'Báo cáo' để Ban quản trị xử lý.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 320,
      },
    ],
  },
  "/saved": {
    title: "Danh sách Phòng Đã Lưu (/saved)",
    summary:
      "Quản lý tất cả các phòng bạn đã thả tim hoặc quẹt phải, hỗ trợ lọc nhanh theo Quận và sắp xếp theo Giá / Diện tích.",
    spots: [
      {
        selector: "[data-tour='saved-header-toolbar']",
        label: "Lọc theo Khu vực & Sắp xếp thông minh",
        description:
          "Lọc nhanh các phòng đã lưu theo từng Quận hoặc sắp xếp theo Giá từ thấp đến cao / Diện tích rộng nhất để chọn ra những phòng tốt nhất trước khi đi xem thực tế.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='saved-rooms-grid']",
        label: "Danh sách Thẻ phòng đã lưu",
        description:
          "Bấm vào bất kỳ phòng nào để xem chi tiết, đặt lịch hẹn xem phòng hoặc bấm lại biểu tượng trái tim để bỏ lưu.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 380,
      },
    ],
  },
  "/profile": {
    title: "Hồ sơ Cá nhân & Điểm Uy Tín (/profile)",
    summary:
      "Quản lý thông tin sinh hoạt, định danh CCCD (+20 TrustScore) và theo dõi điểm uy tín cộng đồng.",
    spots: [
      {
        selector: "[data-tour='profile-header-card']",
        label: "Thông tin Hồ sơ, Xác minh CCCD & Chỉnh sửa",
        description:
          "Hoàn thiện ảnh đại diện, giới thiệu bản thân, thói quen sinh hoạt và xác thực CCCD để tăng Điểm Uy Tín (TrustScore), giúp Chủ trọ ưu tiên duyệt yêu cầu thuê phòng của bạn nhanh hơn.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='profile-trustscore-card']",
        label: "Thẻ Điểm Uy Tín (TrustScore / 100)",
        description:
          "Hiển thị điểm uy tín hiện tại của bạn dựa trên 4 trụ cột: Xác thực CCCD, Độ hoàn thiện hồ sơ, Lịch sử nhận phòng thực tế và Đánh giá 2 chiều từ cộng đồng.",
        labelSide: "left",
        pad: 8,
      },
    ],
  },
};

/**
 * ============================================================================
 * 2. LUỒNG HƯỚNG DẪN CHỦ TRỌ (LANDLORD WORKFLOWS - 8 TAB QUẢN TRỊ)
 * ============================================================================
 */
export const LANDLORD_TOUR_FLOWS: TourFlowStep[] = [
  {
    id: "landlord-overview",
    shortTitle: "1. Tổng quan KPI",
    title: "Bảng Điều Khiển Tổng Quan Chủ Trọ (/landlord?tab=overview)",
    route: "/landlord?tab=overview",
    summary:
      "Theo dõi toàn diện hiệu quả cho thuê: tổng lượt xem tin, số lượt khách liên hệ/lưu phòng, tỷ lệ lấp đầy và biểu đồ tăng trưởng 7 ngày gần nhất.",
    spots: [
      {
        selector: "[data-tour='landlord-sidebar-nav']",
        label: "Menu 8 Phân hệ Quản trị của Chủ trọ",
        description:
          "Thanh điều hướng bên trái giúp bạn quản lý khép kín từ: (1) Tổng quan KPI, (2) Phòng của tôi, (3) Đăng phòng mới, (4) Duyệt Người thuê & Bàn giao, (5) Tin nhắn, (6) Duyệt Chuyển nhượng, (7) Đánh giá và (8) Gói dịch vụ đẩy tin.",
        tip: "Bạn có thể bấm trực tiếp vào từng mục trên thanh bên trái hoặc chuyển tiếp qua lại ngay trong hộp hướng dẫn này.",
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 420,
      },
      {
        selector: "[data-tour='landlord-header-actions']",
        label: "Chuông Thông báo Khách đặt lịch & Hồ sơ Chủ trọ",
        description:
          "Biểu tượng Vương miện mở nhanh Gói dịch vụ VIP. Biểu tượng Chuông báo hiệu ngay khi có khách gửi yêu cầu hẹn xem phòng hoặc nhắn tin. Bấm vào Avatar để xem Hồ sơ Chủ trọ, xác thực CCCD và kiểm tra điểm TrustScore.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='landlord-overview-kpis']",
        label: "4 Chỉ số Vận hành Thời gian thực (KPIs)",
        description:
          "Thống kê chính xác tổng Lượt xem tin, Lượt khách liên hệ & lưu phòng, Số lượng phòng đang mở trống và Tỷ lệ lấp đầy hiện tại của bạn.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-overview-chart']",
        label: "Biểu đồ Lượt xem 7 ngày & Nâng cấp Hội viên",
        description:
          "Biểu đồ miền (Area Chart) giúp bạn theo dõi sức hút của các tin đăng theo từng ngày. Khung bên phải dẫn nhanh tới trang mua lượt Đẩy tin để lấp phòng trống nhanh gấp 3 lần.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 340,
      },
    ],
  },
  {
    id: "landlord-post",
    shortTitle: "2. Đăng phòng 5 bước",
    title: "Đăng Tin Phòng Trọ Chuẩn Hóa 5 Bước (/landlord?tab=post)",
    route: "/landlord?tab=post",
    summary:
      "Quy trình đăng phòng 5 bước tích hợp gợi ý địa chỉ Goong Maps tự động gắn tọa độ GPS, 23 tiện nghi tiếng Việt đồng bộ với bộ lọc người thuê và chế độ xem trước trực quan.",
    spots: [
      {
        selector: "[data-tour='landlord-post-stepper']",
        label: "Thanh tiến trình 5 bước chuẩn hóa",
        description:
          "Bước 1 (Thông tin & 23 Tiện nghi) -> Bước 2 (Giá thuê, Tiền cọc & Phụ phí minh bạch) -> Bước 3 (Tải ảnh thực tế) -> Bước 4 (Địa chỉ & Định vị Goong Maps) -> Bước 5 (Xem trước & Xuất bản).",
        tip: "Điền đầy đủ phụ phí điện, nước, gửi xe ở Bước 2 sẽ giúp tin đăng của bạn được gắn nhãn Minh bạch chi phí.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-post-form']",
        label: "Biểu mẫu thông minh & Định vị Goong Maps",
        description:
          "Các tiện nghi bạn chọn tại đây (Máy lạnh, WC riêng, Giờ tự do, Khóa vân tay...) được đồng bộ 100% với bộ lọc của Người thuê. Ở bước Vị trí, chỉ cần gõ số nhà và tên đường, hệ thống sẽ gợi ý địa chỉ và tự động lấy tọa độ GPS chính xác lên bản đồ.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 380,
      },
    ],
  },
  {
    id: "landlord-rooms",
    shortTitle: "3. Quản lý & Đẩy tin",
    title: "Quản Lý Danh Sách Phòng & Đẩy Top (/landlord?tab=rooms)",
    route: "/landlord?tab=rooms",
    summary:
      "Quản lý toàn bộ phòng đã đăng: đẩy tin lên đầu kết quả tìm kiếm trong 7 ngày, chỉnh sửa giá/ảnh/tiện nghi, hoặc tạm ẩn/mở trống lại phòng chỉ với 1 cú nhấp.",
    spots: [
      {
        selector: "[data-tour='landlord-rooms-header']",
        label: "Tổng số tin đăng & Số lượt Đẩy tin còn lại",
        description:
          "Hiển thị số lượng phòng bạn đang quản lý cùng số lượt Đẩy tin (Boost) khả dụng trong tài khoản và nút tạo nhanh phòng mới.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-rooms-table']",
        label: "Bảng điều khiển Trạng thái, Đẩy tin & Chỉnh sửa",
        description:
          "Trên mỗi dòng phòng: (1) Nút 'Đẩy tin' (Tên lửa): đưa phòng lên vị trí ưu tiên đầu trang Khám phá trong 7 ngày; (2) Nút Con mắt (Eye/EyeOff): tạm ẩn phòng khi ngừng nhận khách hoặc mở về 'Còn trống'; (3) Nút Cây bút: chỉnh sửa toàn bộ thông tin, giá và hình ảnh.",
        tip: "Phòng đang có hợp đồng thuê hiệu lực ('Đã thuê') sẽ được khóa bảo vệ để tránh bấm ẩn nhầm cho đến khi thanh lý hợp đồng.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 340,
      },
    ],
  },
  {
    id: "landlord-tenants",
    shortTitle: "4. Duyệt khách & Bàn giao",
    title: "Phê Duyệt Yêu Cầu Xem Phòng & Quản Lý Hợp Đồng (/landlord?tab=tenants)",
    route: "/landlord?tab=tenants",
    summary:
      "Trái tim của quy trình cho thuê: xem hồ sơ & điểm uy tín của khách đặt lịch, bấm Duyệt yêu cầu hẹn xem phòng, xác nhận bàn giao phòng (+10 TrustScore) và lập biên bản thanh lý hợp đồng.",
    spots: [
      {
        selector: "[data-tour='landlord-tenants-kpis']",
        label: "4 Thẻ thống kê Phễu khách thuê",
        description:
          "Giúp bạn nắm bắt ngay: Số yêu cầu mới đang 'Chờ bạn duyệt', số khách 'Đã duyệt (Chờ nhận phòng)', số hợp đồng 'Đang thuê' hiệu lực và Điểm uy tín trung bình của khách thuê.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-tenants-tabs']",
        label: "Bộ lọc theo giai đoạn Hợp đồng",
        description:
          "Chuyển nhanh sang tab 'Chờ bạn duyệt' để xử lý ngay các yêu cầu đặt lịch mới từ khách thuê, hoặc tab 'Đang thuê' để quản lý các phòng đang có người ở.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='landlord-tenants-table']",
        label: "Thao tác Duyệt yêu cầu, Bàn giao & Thanh lý HĐ",
        description:
          "(1) Khi khách mới gửi yêu cầu: bấm 'Duyệt yêu cầu' để hệ thống báo cho khách vào mục Phòng của tôi kiểm tra, hoặc bấm 'Từ chối' kèm lý do. (2) Khi khách dọn vào: khách (hoặc bạn) bấm 'Bàn giao phòng' để kích hoạt hợp đồng và cộng +10 TrustScore. (3) Khi kết thúc: bấm 'Thanh lý' để lập biên bản hoàn cọc và tự động mở lại phòng về trạng thái Còn trống.",
        tip: "Bấm nút 'Chi tiết' trên dòng khách thuê để xem đầy đủ số điện thoại, trường học/nơi làm việc, lời nhắn và đánh giá thời điểm dọn vào của khách.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 340,
      },
    ],
  },
  {
    id: "landlord-swaps",
    shortTitle: "5. Duyệt chuyển nhượng",
    title: "Phê Duyệt Hoán Đổi & Chuyển Nhượng Hợp Đồng (/landlord?tab=swaps)",
    route: "/landlord?tab=swaps",
    summary:
      "Đối chiếu hồ sơ giữa Người thuê cũ (chuyển đi) và Ứng viên tiếp quản mới, phê duyệt chuyển giao hợp đồng 1 chạm và tải xuống Phụ lục chuyển nhượng 3 bên.",
    spots: [
      {
        selector: "[data-tour='landlord-swaps-header']",
        label: "Quy tắc Chuyển giao Hợp đồng 3 bên",
        description:
          "Khi người thuê hiện tại muốn nhượng lại hợp đồng trước hạn và đã tìm được ứng viên thế chỗ, yêu cầu sẽ được gửi về đây để bạn thẩm định.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-swaps-list']",
        label: "Đối chiếu Người đi - Người đến & Xuất Phụ lục HĐ",
        description:
          "Kiểm tra điểm TrustScore và trạng thái xác thực CCCD của Bên tiếp quản mới. Bấm 'Phê duyệt hoán đổi' để hệ thống tự động tất toán hợp đồng cũ và khởi tạo hợp đồng mới giữ nguyên giá thuê/tiền cọc. Bấm 'Tải dự thảo phụ lục HĐ' để xuất văn bản pháp lý 3 bên.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 340,
      },
    ],
  },
  {
    id: "landlord-chat",
    shortTitle: "6. Tin nhắn khách thuê",
    title: "Nhắn Tin Trực Tiếp Với Khách Thuê (/landlord?tab=chat)",
    route: "/landlord?tab=chat",
    summary:
      "Trao đổi lịch hẹn xem phòng, gửi thêm hình ảnh/video thực tế và giải đáp thắc mắc của khách thuê theo thời gian thực.",
    spots: [
      {
        selector: "[data-tour='landlord-chat-area']",
        label: "Trung tâm Tin nhắn Chủ trọ - Khách thuê",
        description:
          "Tất cả tin nhắn từ khách quan tâm phòng trọ đều tập trung tại đây. Phản hồi nhanh sẽ giúp tăng tỷ lệ chốt lịch hẹn xem phòng và nâng cao đánh giá giao tiếp của bạn.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 380,
      },
    ],
  },
  {
    id: "landlord-reviews",
    shortTitle: "7. Đánh giá & Khiếu nại",
    title: "Đánh Giá Khách Thuê & Bảo Vệ Uy Tín (/landlord?tab=reviews)",
    route: "/landlord?tab=reviews",
    summary:
      "Hệ thống đánh giá 2 chiều công bằng: viết nhận xét cho khách đã thuê phòng, phản hồi công khai đánh giá của khách hoặc gửi khiếu nại lên Admin nếu có đánh giá sai sự thật.",
    spots: [
      {
        selector: "[data-tour='landlord-reviews-tabs']",
        label: "Chuyển đổi: Viết đánh giá khách thuê & Lịch sử đánh giá",
        description:
          "Ở tab 'Viết đánh giá': bạn chọn khách thuê đã nhận phòng để chấm sao và gắn thẻ nhận xét (Đúng hẹn, Trả tiền đúng hạn, Giữ gìn tài sản). Ở tab 'Lịch sử đánh giá': bạn có thể bấm 'Phản hồi' dưới nhận xét của khách hoặc bấm 'Khiếu nại' (Flag) nếu nhận xét không đúng sự thật.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "landlord-packages",
    shortTitle: "8. Gói đẩy tin VIP",
    title: "Quản Lý Gói Dịch Vụ & Mua Lượt Đẩy Tin (/landlord?tab=packages)",
    route: "/landlord?tab=packages",
    summary:
      "Kiểm tra số dư lượt đẩy tin, xem gói dịch vụ đang hoạt động và mua thêm lượt đẩy tin nhanh chóng qua mã QR ngân hàng (PayOS).",
    spots: [
      {
        selector: "[data-tour='landlord-packages-summary']",
        label: "Số dư Lượt đẩy tin & Cơ chế ưu tiên 7 ngày",
        description:
          "Mỗi lượt đẩy tin sẽ đưa 1 phòng còn trống của bạn lên đầu kết quả tìm kiếm trong suốt 7 ngày. Lượt chưa sử dụng được bảo lưu vĩnh viễn trong tài khoản.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-packages-plans']",
        label: "Chọn gói & Thanh toán QR Ngân hàng",
        description:
          "Tích chọn đồng ý điều khoản rồi bấm 'Mua gói' để tạo mã QR thanh toán tự động. Ngay sau khi chuyển khoản thành công, số lượt đẩy tin sẽ được cộng tức thì vào tài khoản của bạn.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 340,
      },
    ],
  },
];

/**
 * Helper: Xác định bộ Spotlight Spots và Flow tương ứng với URL hiện tại và vai trò người dùng
 */
export function resolveTourForLocation(
  pathname: string,
  search: string,
  role: "tenant" | "landlord" = "tenant"
): {
  role: "tenant" | "landlord";
  flows: TourFlowStep[];
  activeFlowIndex: number;
  currentTitle: string;
  currentSummary: string;
  spots: TourSpot[];
} {
  const isLandlordRoute = pathname.startsWith("/landlord") || role === "landlord";

  if (isLandlordRoute) {
    const params = new URLSearchParams(search);
    const tab = params.get("tab") || "overview";
    const flowIdx = LANDLORD_TOUR_FLOWS.findIndex((f) => f.route.includes(`tab=${tab}`));
    const resolvedIdx = flowIdx >= 0 ? flowIdx : 0;
    const flow = LANDLORD_TOUR_FLOWS[resolvedIdx];
    return {
      role: "landlord",
      flows: LANDLORD_TOUR_FLOWS,
      activeFlowIndex: resolvedIdx,
      currentTitle: flow.title,
      currentSummary: flow.summary,
      spots: flow.spots,
    };
  }

  // Kiểm tra các trang phụ của Tenant trước (/rooms/:id, /saved, /profile)
  for (const [prefix, extra] of Object.entries(TENANT_EXTRA_PAGE_SPOTS)) {
    if (pathname.startsWith(prefix)) {
      return {
        role: "tenant",
        flows: TENANT_TOUR_FLOWS,
        activeFlowIndex: 0,
        currentTitle: extra.title,
        currentSummary: extra.summary,
        spots: extra.spots,
      };
    }
  }

  const flowIdx = TENANT_TOUR_FLOWS.findIndex(
    (f) => pathname === f.route || pathname.startsWith(f.route + "/")
  );
  const resolvedIdx = flowIdx >= 0 ? flowIdx : 0;
  const flow = TENANT_TOUR_FLOWS[resolvedIdx];

  return {
    role: "tenant",
    flows: TENANT_TOUR_FLOWS,
    activeFlowIndex: resolvedIdx,
    currentTitle: flow.title,
    currentSummary: flow.summary,
    spots: flow.spots,
  };
}
