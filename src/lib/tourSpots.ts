export type LabelSide = "top" | "bottom" | "left" | "right";

export interface TourSpot {
  /** CSS selector, e.g. "[data-tour='discover-swipe-card']" */
  selector: string;
  /** Short title shown in step header */
  label: string;
  /** Short, plain-Vietnamese explanation (1-2 sentences, zero tech jargon) */
  description: string;
  /** Optional 2-3 short sub-items for quick scanning */
  bullets?: string[];
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
  /** Route path */
  route: string;
  /** High-level summary of this screen's role */
  summary: string;
  /** Ordered list of spotlight targets on this screen */
  spots: TourSpot[];
}

/**
 * ============================================================================
 * 1. LUỒNG HƯỚNG DẪN NGƯỜI THUÊ (TRỌN BỘ 12 MÀN HÌNH NỐI TIẾP)
 * Bước cuối của TẤT CẢ 12 màn hình đều khoanh sáng trực tiếp vào đúng nút/biểu tượng
 * trên giao diện web giúp chuyển sang màn hình kế tiếp.
 * ============================================================================
 */
export const TENANT_TOUR_FLOWS: TourFlowStep[] = [
  {
    id: "tenant-discover",
    shortTitle: "1. Tìm & Quẹt phòng",
    title: "Tìm kiếm & Lướt chọn phòng trọ",
    route: "/discover",
    summary:
      "Lọc phòng theo khu vực và mức giá, quẹt phải để lưu lại những căn bạn ưng ý.",
    spots: [
      {
        selector: "[data-tour='discover-filter-sidebar']",
        label: "Bộ lọc Khu vực, Mức giá & Tiện nghi",
        description:
          "Chọn Quận, kéo mức giá mong muốn hoặc gõ tên trường Đại học để tìm các phòng ở gần bạn nhất.",
        bullets: [
          "Tích chọn các tiện nghi cần thiết như Máy lạnh, WC riêng, Giờ tự do...",
          "Chọn xong hãy bấm nút 'Áp dụng bộ lọc' ở cuối cột.",
        ],
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 430,
      },
      {
        selector: "[data-tour='discover-swipe-card'], [data-tour='discover-center-stage']",
        label: "Thẻ thông tin phòng trọ",
        description:
          "Hiển thị ảnh thực tế, giá thuê, tiền cọc và mức độ phù hợp với nhu cầu của bạn. Bạn có thể bấm trực tiếp vào ảnh để mở xem chi tiết phòng.",
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 420,
      },
      {
        selector: "[data-tour='discover-swipe-actions']",
        label: "4 nút chọn nhanh dưới thẻ phòng",
        description:
          "Bạn có thể kéo thẻ sang trái/phải hoặc bấm trực tiếp 4 nút tròn này:",
        bullets: [
          "Nút ✕ (Đỏ): Bỏ qua phòng chưa ưng ý.",
          "Nút ↶ (Vàng): Xem lại phòng vừa lỡ tay bỏ qua.",
          "Nút i (Xanh dương): Mở trang Xem chi tiết phòng.",
          "Nút ♥ (Xanh lá): Thích và lưu vào Phòng đã thích.",
        ],
        labelSide: "top",
        pad: 10,
      },
      {
        selector: "[data-tour='discover-btn-map'], [data-tour='discover-view-switcher']",
        label: "Bấm vào đây để chuyển sang trang Bản đồ",
        description:
          "Để xem vị trí phòng trên bản đồ đường phố và đo khoảng cách tới trường học hoặc nơi làm việc, bạn bấm vào nút 'Xem bản đồ' đang khoanh sáng này.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-map",
    shortTitle: "2. Bản đồ tìm phòng",
    title: "Tìm phòng trên Bản đồ & Trường Đại học",
    route: "/map",
    summary:
      "Xem trực quan giá phòng trên bản đồ và đo khoảng cách tới trường học hoặc nơi làm việc.",
    spots: [
      {
        selector: "[data-tour='map-landmark-search']",
        label: "Tìm phòng quanh Trường ĐH & Công ty",
        description:
          "Gõ tên trường hoặc bấm vào các nút tên trường gợi ý sẵn để bản đồ bay tới khu vực đó và tính khoảng cách từ từng phòng tới trường.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='map-room-list']",
        label: "Danh sách phòng đồng bộ với Bản đồ",
        description:
          "Bấm lần 1 vào thẻ phòng để xem vị trí ghim giá trên bản đồ; bấm lần 2 vào thẻ đang chọn để mở trang Xem chi tiết phòng.",
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 380,
      },
      {
        selector: "[data-tour='nav-icon-saved'], [data-tour='tenant-nav-actions']",
        label: "Bấm vào đây để mở trang Phòng đã thích",
        description:
          "Sau khi thả tim lưu các phòng ưng ý, bạn bấm vào biểu tượng Trái tim (♥) ở góc phải thanh menu trên cùng này để mở danh sách Phòng đã thích.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-saved",
    shortTitle: "3. Phòng đã thích",
    title: "Danh sách Phòng đã thích",
    route: "/saved",
    summary:
      "Nơi cất giữ các phòng bạn đã thả tim để lọc lại và chọn căn ưng ý nhất đi xem thực tế.",
    spots: [
      {
        selector: "[data-tour='saved-filter-bar'], [data-tour='saved-header-toolbar']",
        label: "Lọc theo Quận & Sắp xếp theo Giá",
        description:
          "Khi đã lưu nhiều phòng, bạn có thể bấm chọn từng Quận hoặc sắp xếp theo 'Giá thấp đến cao' để dễ chọn lựa.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='saved-rooms-grid']",
        label: "Bấm vào thẻ phòng này để mở trang Chi tiết phòng",
        description:
          "Để kiểm tra tiền điện, nước và đặt lịch hẹn xem phòng, bạn bấm trực tiếp vào ảnh hoặc tên của một căn phòng trong danh sách đang khoanh sáng này.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 360,
      },
    ],
  },
  {
    id: "tenant-room-detail",
    shortTitle: "4. Xem chi tiết phòng",
    title: "Chi tiết phòng & Đặt lịch hẹn xem",
    route: "/rooms/__sample__",
    summary:
      "Kiểm tra ảnh phòng, bảng giá điện/nước, độ uy tín của chủ trọ và gửi yêu cầu hẹn xem phòng.",
    spots: [
      {
        selector: "[data-tour='room-detail-gallery']",
        label: "Ảnh phòng thực tế & Vị trí bản đồ",
        description:
          "Bấm vào bất kỳ bức ảnh nào để phóng to toàn màn hình. Ngay bên dưới tiêu đề phòng có dòng chữ '(Xem bản đồ)' để bạn kiểm tra đường đi.",
        labelSide: "bottom",
        pad: 8,
        maxSpotHeight: 340,
      },
      {
        selector: "[data-tour='room-detail-fees']",
        label: "Bảng chi phí hàng tháng rõ ràng",
        description:
          "Ghi rõ tiền thuê, tiền cọc và giá Điện, Nước, Wi-Fi, Gửi xe do chủ trọ cam kết để bạn tính trước tổng chi phí mỗi tháng.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 300,
      },
      {
        selector: "[data-tour='room-detail-btn-rent'], [data-tour='room-detail-booking-box']",
        label: "Gửi yêu cầu xem phòng & Liên hệ chủ trọ",
        description:
          "Khung bên phải là nơi bạn thao tác chính với căn phòng này:",
        bullets: [
          "Yêu cầu xem & thuê phòng: Chọn ngày vào ở và gửi đơn hẹn.",
          "Liên hệ chủ trọ: Mở khung nhắn tin trao đổi trực tiếp.",
          "Báo cáo phòng này: Phản ánh nếu thông tin sai sự thật.",
        ],
        labelSide: "left",
        pad: 8,
      },
      {
        selector: "[data-tour='room-detail-review-btn'], [data-tour='room-detail-review-report']",
        label: "Xem nhận xét & Đánh giá chủ trọ",
        description:
          "Đọc nhận xét từ những người đã ở trước. Nếu bạn thuê căn này và đã nhận phòng, nút 'Viết đánh giá' tại đây sẽ mở khóa để bạn chấm sao chủ trọ.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 280,
      },
      {
        selector: "[data-tour='room-detail-btn-compare'], [data-tour='room-detail-btn-save-compare']",
        label: "Bấm vào đây để chuyển sang bảng So sánh phòng",
        description:
          "Nếu muốn đặt căn phòng này cạnh các phòng khác để so sánh giá và diện tích, bạn bấm vào nút 'So sánh với phòng khác' đang khoanh sáng này.",
        labelSide: "left",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-compare",
    shortTitle: "5. So sánh phòng",
    title: "Bảng so sánh trực diện 4 phòng",
    route: "/compare",
    summary:
      "Đặt tối đa 4 phòng cạnh nhau để so sánh giá thuê, tiền cọc, diện tích và tiện nghi.",
    spots: [
      {
        selector: "[data-tour='compare-header-actions']",
        label: "Thêm phòng vào bảng đối chiếu",
        description:
          "Bấm nút '+ Thêm phòng so sánh' để chọn thêm phòng từ danh sách bạn đã thích (tối đa 4 phòng cùng lúc).",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='compare-room-cards'], [data-tour='compare-table-area']",
        label: "Nhận diện nhanh phòng Tiết kiệm nhất & Rộng nhất",
        description:
          "Hệ thống tự động gắn nhãn cho phòng có giá rẻ nhất và diện tích rộng nhất. Ưng căn nào, bạn bấm nút 'Chi tiết' hoặc 'Thuê' ngay dưới căn đó.",
        labelSide: "bottom",
        pad: 8,
        maxSpotHeight: 300,
      },
      {
        selector: "[data-tour='nav-tab-rentals-me'], [data-tour='tenant-nav-tabs']",
        label: "Bấm vào đây để mở mục Phòng của tôi",
        description:
          "Sau khi chọn được phòng và gửi yêu cầu hẹn xem phòng, bạn bấm vào mục 'Phòng của tôi' trên thanh menu trên cùng này để theo dõi chủ trọ duyệt đơn.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-rentals",
    shortTitle: "6. Phòng của tôi",
    title: "Theo dõi đơn hẹn xem phòng & Hợp đồng",
    route: "/rentals/me",
    summary:
      "Kiểm tra tình trạng đơn xem phòng, bấm xác nhận khi dọn vào ở và quản lý hợp đồng.",
    spots: [
      {
        selector: "[data-tour='rentals-progress-bar'], [data-tour='rentals-list-area']",
        label: "3 bước từ lúc gửi đơn đến khi nhận phòng",
        description:
          "Mỗi đơn đăng ký của bạn sẽ đi qua 3 bước rõ ràng:",
        bullets: [
          "1. Chờ chủ trọ duyệt: Đơn hẹn đã gửi, chờ chủ trọ phản hồi.",
          "2. Chờ nhận phòng: Bấm 'Xác nhận đã nhận phòng' khi nhận chìa khóa.",
          "3. Đang thuê: Mở khóa quyền đánh giá phòng & chủ trọ.",
        ],
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 320,
      },
      {
        selector: "[data-tour='nav-tab-chat'], [data-tour='tenant-nav-tabs']",
        label: "Bấm vào đây để mở mục Tin nhắn",
        description:
          "Để nhắn tin hỏi giờ xem phòng hoặc trao đổi trực tiếp với chủ trọ, bạn bấm vào mục 'Tin nhắn' đang khoanh sáng trên thanh menu trên cùng.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-chat",
    shortTitle: "7. Tin nhắn",
    title: "Trò chuyện với Chủ trọ & Bạn cùng phòng",
    route: "/chat",
    summary:
      "Nhắn tin trao đổi giờ hẹn xem phòng, gửi hình ảnh và trò chuyện với bạn ở ghép.",
    spots: [
      {
        selector: "[data-tour='chat-Workspace']",
        label: "Phân loại Tin nhắn Chủ trọ & Bạn cùng phòng",
        description:
          "Cột bên trái chia rõ 2 mục để bạn dễ quản lý:",
        bullets: [
          "Tab Chủ trọ: Tin nhắn hỏi thông tin từng phòng trọ bạn quan tâm.",
          "Tab Bạn cùng phòng: Tin nhắn với các bạn trọ đã ghép đôi 2 chiều.",
        ],
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 360,
      },
      {
        selector: "[data-tour='nav-tab-roommates'], [data-tour='tenant-nav-tabs']",
        label: "Bấm vào đây để chuyển sang mục Ghép bạn",
        description:
          "Nếu muốn tìm người hợp tính cách để ở ghép chia tiền phòng, bạn bấm vào mục 'Ghép bạn' đang khoanh sáng trên thanh menu trên cùng.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-roommates",
    shortTitle: "8. Ghép bạn",
    title: "Tìm bạn cùng phòng hợp lối sống",
    route: "/roommates",
    summary:
      "Gợi ý bạn cùng phòng có chung ngân sách, khu vực muốn ở và thói quen sinh hoạt hàng ngày.",
    spots: [
      {
        selector: "[data-tour='roommates-swipe-card']",
        label: "Thẻ hồ sơ bạn cùng phòng",
        description:
          "Hiển thị trường học/nơi làm việc, ngân sách và thói quen sinh hoạt (giờ giấc, vệ sinh). Bấm nút Tim xanh bên dưới để gửi lời mời làm quen.",
        labelSide: "right",
        pad: 8,
        maxSpotHeight: 400,
      },
      {
        selector: "[data-tour='roommates-btn-matches'], [data-tour='nav-icon-matches']",
        label: "Bấm vào đây để xem danh sách Bạn đã ghép đôi",
        description:
          "Khi bạn và một người bạn trọ cùng bấm Thích nhau, hãy bấm vào nút 'Đã ghép' đang khoanh sáng này (hoặc biểu tượng 👥 Lượt ghép bạn ở trên thanh menu trên cùng) để mở danh sách và nhắn tin.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-matches",
    shortTitle: "9. Bạn đã ghép đôi",
    title: "Danh sách bạn cùng phòng đã ghép đôi",
    route: "/matches",
    summary:
      "Quản lý những người bạn trọ đã đồng ý kết nối 2 chiều với bạn.",
    spots: [
      {
        selector: "[data-tour='matches-main-list']",
        label: "Nhắn tin làm quen & Bàn kế hoạch thuê phòng",
        description:
          "Bấm nút 'Nhắn tin ngay' trên thẻ của bạn trọ để mở hộp thoại trao đổi về ngân sách và hẹn nhau cùng đi xem phòng.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 350,
      },
      {
        selector: "[data-tour='nav-icon-bell'], [data-tour='tenant-nav-actions']",
        label: "Bấm vào đây để mở mục Thông báo",
        description:
          "Để kiểm tra thông báo khi chủ trọ duyệt lịch hẹn, xác nhận bàn giao hoặc có tin nhắn mới, bạn bấm vào biểu tượng Chuông đang khoanh sáng ở góc phải trên cùng.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-notifications",
    shortTitle: "10. Thông báo",
    title: "Trung tâm Thông báo",
    route: "/notifications",
    summary:
      "Theo dõi mọi phản hồi từ chủ trọ và lời mời ghép bạn.",
    spots: [
      {
        selector: "[data-tour='notifications-list'], [data-tour='notifications-header']",
        label: "Bấm vào thông báo để mở thẳng trang liên quan",
        description:
          "Khi chủ trọ duyệt lịch hẹn xem phòng hoặc nhắn tin mới, bạn chỉ cần bấm vào dòng thông báo đó để chuyển thẳng tới trang Hợp đồng hoặc Tin nhắn.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 350,
      },
      {
        selector: "[data-tour='nav-icon-avatar'], [data-tour='tenant-nav-actions']",
        label: "Bấm vào đây để mở Hồ sơ cá nhân & Đánh giá ứng dụng",
        description:
          "Để cập nhật thông tin cá nhân, xác minh CCCD hoặc gửi 'Đánh giá ứng dụng', bạn bấm vào Ảnh đại diện (Avatar) ở góc phải trên cùng rồi chọn 'Hồ sơ của tôi'.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-profile",
    shortTitle: "11. Hồ sơ cá nhân",
    title: "Hồ sơ cá nhân & Xác thực CCCD",
    route: "/profile",
    summary:
      "Cập nhật thông tin sinh hoạt và xác minh CCCD để tăng độ tin cậy khi đặt lịch thuê phòng.",
    spots: [
      {
        selector: "[data-tour='profile-header-card']",
        label: "Chỉnh sửa hồ sơ & Xác thực CCCD",
        description:
          "Bấm 'Xác thực CCCD' (+25\u00A0điểm uy tín) và cập nhật trường học, nơi làm việc để chủ trọ yên tâm ưu tiên duyệt yêu cầu xem phòng của bạn.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='profile-btn-trustscore'], [data-tour='profile-trustscore-card']",
        label: "Bấm vào đây để xem Chi tiết Điểm uy tín",
        description:
          "Để xem 4 tiêu chí chấm điểm tin cậy và mẹo tăng điểm nhanh nhất, bạn bấm vào nút 'Xem chi tiết 4 trụ cột điểm số' đang khoanh sáng này.",
        labelSide: "left",
        pad: 8,
      },
    ],
  },
  {
    id: "tenant-trustscore",
    shortTitle: "12. Điểm uy tín",
    title: "Chi tiết 4 trụ cột Điểm uy tín",
    route: "/trustscore",
    summary:
      "Xem chi tiết điểm số từng hạng mục và các bước đơn giản để đạt mốc Uy tín cao.",
    spots: [
      {
        selector: "[data-tour='trustscore-donut-card']",
        label: "Tổng điểm & Hạng uy tín của bạn",
        description:
          "Điểm đạt từ 70/100 trở lên sẽ nhận huy hiệu 'Uy tín cao', giúp hồ sơ của bạn nổi bật khi gửi yêu cầu hẹn xem phòng hoặc tìm bạn ở ghép.",
        labelSide: "right",
        pad: 8,
      },
      {
        selector: "[data-tour='trustscore-breakdown-card']",
        label: "4 tiêu chí cộng điểm & Mẹo tăng điểm nhanh",
        description:
          "Tổng 100\u00A0điểm gồm: Xác thực tài khoản (35đ), Thông tin hồ sơ (35đ), Đánh giá & Tuân thủ (15đ) và Hoạt động thuê phòng (15đ). Bạn có thể bấm nút '? Hướng dẫn' trên thanh menu bất kỳ lúc nào nếu cần xem lại!",
        labelSide: "left",
        pad: 8,
        maxSpotHeight: 360,
      },
    ],
  },
];

/**
 * ============================================================================
 * 2. LUỒNG HƯỚNG DẪN CHỦ TRỌ (10 MÀN HÌNH NỐI TIẾP)
 * Bước cuối của mỗi màn luôn khoanh sáng vào đúng nút trên giao diện để chuyển mục.
 * ============================================================================
 */
export const LANDLORD_TOUR_FLOWS: TourFlowStep[] = [
  {
    id: "landlord-overview",
    shortTitle: "1. Tổng quan",
    title: "Bảng theo dõi tổng quan của Chủ trọ",
    route: "/landlord?tab=overview",
    summary:
      "Nắm bắt nhanh số lượt khách xem phòng, số người liên hệ và tỷ lệ phòng đã cho thuê.",
    spots: [
      {
        selector: "[data-tour='landlord-overview-kpis']",
        label: "Thống kê lượt xem & Số phòng đang mở",
        description:
          "Hiển thị tổng lượt khách đã xem tin, số người liên hệ/lưu phòng và số lượng phòng đang còn trống của bạn.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-header-actions']",
        label: "Chuông báo khách đặt lịch & Menu tài khoản",
        description:
          "Biểu tượng Chuông góc phải sẽ báo đỏ ngay khi có khách gửi yêu cầu hẹn xem phòng. Bấm vào Ảnh đại diện để mở Hồ sơ, Điểm uy tín hoặc Đánh giá ứng dụng.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-tab-post'], [data-tour='landlord-sidebar-nav']",
        label: "Bấm vào đây để chuyển sang mục Đăng phòng mới",
        description:
          "Để đăng tin cho thuê phòng mới, bạn bấm vào mục 'Đăng phòng' đang khoanh sáng trên thanh menu bên trái này.",
        labelSide: "right",
        pad: 6,
      },
    ],
  },
  {
    id: "landlord-post",
    shortTitle: "2. Đăng phòng",
    title: "Đăng tin phòng trọ theo 5 bước",
    route: "/landlord?tab=post",
    summary:
      "Điền thông tin phòng, giá điện nước, tải ảnh thực tế và ghim vị trí bản đồ.",
    spots: [
      {
        selector: "[data-tour='landlord-post-stepper']",
        label: "5 bước tạo tin đăng nhanh gọn",
        description:
          "Điền lần lượt: Thông tin & Tiện nghi → Giá thuê & Chi phí điện/nước → Tải ảnh phòng → Nhập địa chỉ định vị bản đồ → Xem trước & Đăng tin.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-tab-rooms'], [data-tour='landlord-sidebar-nav']",
        label: "Bấm vào đây để mở danh sách Phòng của tôi",
        description:
          "Sau khi đăng tin xong, bạn bấm vào mục 'Phòng của tôi' đang khoanh sáng trên menu bên trái để chỉnh sửa, tạm ẩn hoặc đẩy phòng lên đầu trang.",
        labelSide: "right",
        pad: 6,
      },
    ],
  },
  {
    id: "landlord-rooms",
    shortTitle: "3. Phòng của tôi",
    title: "Quản lý danh sách phòng & Đẩy tin",
    route: "/landlord?tab=rooms",
    summary:
      "Cập nhật trạng thái phòng còn trống/tạm ẩn, chỉnh sửa thông tin và kích hoạt Đẩy tin.",
    spots: [
      {
        selector: "[data-tour='landlord-rooms-table']",
        label: "Đẩy tin lên đầu, Ẩn/Hiện & Chỉnh sửa phòng",
        description:
          "Trên mỗi dòng phòng, bạn có 3 nút thao tác nhanh:",
        bullets: [
          "Nút Đẩy tin: Đưa phòng lên đầu trang tìm kiếm (7\u00A0ngày).",
          "Nút Con mắt: Tạm ẩn phòng hoặc mở lại trạng thái Còn trống.",
          "Nút Cây bút: Chỉnh sửa giá thuê, hình ảnh và tiện nghi.",
        ],
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 330,
      },
      {
        selector: "[data-tour='landlord-tab-tenants'], [data-tour='landlord-sidebar-nav']",
        label: "Bấm vào đây để mở mục Người thuê",
        description:
          "Khi có khách gửi yêu cầu hẹn xem hoặc thuê phòng, bạn bấm vào mục 'Người thuê' đang khoanh sáng trên menu bên trái này để phê duyệt.",
        labelSide: "right",
        pad: 6,
      },
    ],
  },
  {
    id: "landlord-tenants",
    shortTitle: "4. Người thuê",
    title: "Duyệt lịch hẹn xem phòng & Quản lý người thuê",
    route: "/landlord?tab=tenants",
    summary:
      "Xem hồ sơ khách đặt lịch, bấm duyệt yêu cầu hẹn xem phòng, xác nhận bàn giao và thanh lý hợp đồng.",
    spots: [
      {
        selector: "[data-tour='landlord-tenants-tabs']",
        label: "Lọc danh sách đơn Chờ bạn duyệt",
        description:
          "Bấm vào tab 'Chờ bạn duyệt' để xem ngay các khách vừa gửi yêu cầu hẹn xem phòng mới nhất.",
        labelSide: "bottom",
        pad: 6,
      },
      {
        selector: "[data-tour='landlord-tenants-table']",
        label: "Duyệt yêu cầu, Bàn giao & Thanh lý hợp đồng",
        description:
          "Bấm 'Chi tiết' để xem số điện thoại và điểm uy tín của khách, sau đó bấm 'Duyệt yêu cầu'. Khi khách hết hạn thuê, bạn bấm 'Thanh lý' để phòng tự động mở trống trở lại.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 320,
      },
      {
        selector: "[data-tour='landlord-tab-chat'], [data-tour='landlord-sidebar-nav']",
        label: "Bấm vào đây để mở mục Tin nhắn",
        description:
          "Để nhắn tin chốt giờ hẹn xem phòng với khách, bạn bấm vào mục 'Tin nhắn' đang khoanh sáng trên menu bên trái này.",
        labelSide: "right",
        pad: 6,
      },
    ],
  },
  {
    id: "landlord-chat",
    shortTitle: "5. Tin nhắn",
    title: "Nhắn tin trực tiếp với Khách thuê",
    route: "/landlord?tab=chat",
    summary:
      "Trao đổi lịch hẹn xem phòng, gửi thêm hình ảnh và giải đáp thắc mắc của khách.",
    spots: [
      {
        selector: "[data-tour='landlord-chat-area']",
        label: "Phân loại Tin nhắn Hỏi thuê phòng & Trực tiếp",
        description:
          "Hộp thoại bên trái chia sẵn 2 nhóm để bạn dễ theo dõi:",
        bullets: [
          "Tab Hỏi thuê phòng: Khách nhắn từ trang Chi tiết phòng (kèm tên phòng).",
          "Tab Trực tiếp: Nhắn tin trao đổi chung với người thuê trong danh sách.",
        ],
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 360,
      },
      {
        selector: "[data-tour='landlord-tab-reviews'], [data-tour='landlord-sidebar-nav']",
        label: "Bấm vào đây để mở mục Đánh giá",
        description:
          "Để chấm sao nhận xét khách đã thuê hoặc trả lời đánh giá của khách, bạn bấm vào mục 'Đánh giá' đang khoanh sáng trên menu bên trái này.",
        labelSide: "right",
        pad: 6,
      },
    ],
  },
  {
    id: "landlord-reviews",
    shortTitle: "6. Đánh giá",
    title: "Đánh giá khách thuê & Phản hồi nhận xét",
    route: "/landlord?tab=reviews",
    summary:
      "Chấm sao cho khách thuê của bạn và phản hồi hoặc khiếu nại các đánh giá không đúng sự thật.",
    spots: [
      {
        selector: "[data-tour='landlord-reviews-tabs']",
        label: "Viết đánh giá & Phản hồi công khai",
        description:
          "Chọn 'Viết đánh giá' để nhận xét khách đã ở; hoặc chọn 'Lịch sử đánh giá' để trả lời nhận xét của khách và bấm 'Khiếu nại' nếu có đánh giá sai sự thật.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-tab-packages'], [data-tour='landlord-sidebar-nav']",
        label: "Bấm vào đây để mở mục Gói dịch vụ",
        description:
          "Để mua thêm lượt đẩy phòng lên đầu trang tìm kiếm, bạn bấm vào mục 'Gói dịch vụ' đang khoanh sáng trên menu bên trái này.",
        labelSide: "right",
        pad: 6,
      },
    ],
  },
  {
    id: "landlord-packages",
    shortTitle: "7. Gói dịch vụ",
    title: "Quản lý lượt Đẩy tin & Gói dịch vụ",
    route: "/landlord?tab=packages",
    summary:
      "Kiểm tra số lượt đẩy tin còn lại và mua thêm gói dịch vụ qua cổng thanh toán PayOS.",
    spots: [
      {
        selector: "[data-tour='landlord-packages-summary']",
        label: "Số dư lượt Đẩy tin của bạn",
        description:
          "Mỗi lượt đẩy tin sẽ đưa 1 phòng còn trống lên đầu trang tìm kiếm trong 7\u00A0ngày. Lượt chưa dùng sẽ được giữ lại lâu dài.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='landlord-packages-plans']",
        label: "Chọn gói & Thanh toán qua PayOS",
        description:
          "Tích đồng ý điều khoản rồi bấm 'Mua gói' để chuyển tới cổng thanh toán PayOS. Ngay khi thanh toán xong, lượt đẩy tin sẽ tự động cộng vào tài khoản của bạn.",
        labelSide: "top",
        pad: 8,
        maxSpotHeight: 330,
      },
      {
        selector: "[data-tour='landlord-header-actions']",
        label: "Bấm vào đây để mở Hồ sơ Chủ trọ & Điểm uy tín",
        description:
          "Để xác minh CCCD chủ trọ (+25\u00A0điểm uy tín) và quản lý thông tin liên hệ, bạn bấm vào Ảnh đại diện (Avatar) ở góc phải trên cùng rồi chọn 'Hồ sơ của tôi'.",
        labelSide: "bottom",
        pad: 8,
      },
    ],
  },
  {
    id: "landlord-profile",
    shortTitle: "8. Hồ sơ Chủ trọ",
    title: "Hồ sơ Chủ trọ & Xác thực CCCD",
    route: "/profile",
    summary:
      "Xác minh CCCD để gắn nhãn 'Chủ trọ đã xác thực' trên mọi tin đăng phòng của bạn.",
    spots: [
      {
        selector: "[data-tour='profile-header-card']",
        label: "Xác thực CCCD Chủ trọ (+25\u00A0điểm uy tín)",
        description:
          "Bấm 'Xác thực CCCD' để tin đăng phòng của bạn được gắn huy hiệu 'Đã xác minh', giúp khách thuê tin tưởng đặt lịch xem phòng nhanh hơn.",
        labelSide: "bottom",
        pad: 8,
      },
      {
        selector: "[data-tour='profile-btn-trustscore'], [data-tour='profile-trustscore-card']",
        label: "Bấm vào đây để xem Chi tiết Điểm uy tín",
        description:
          "Để kiểm tra chi tiết 4 tiêu chí chấm điểm uy tín của Chủ trọ, bạn bấm vào nút 'Xem chi tiết 4 trụ cột điểm số' đang khoanh sáng này.",
        labelSide: "left",
        pad: 8,
      },
    ],
  },
  {
    id: "landlord-trustscore",
    shortTitle: "9. Điểm uy tín",
    title: "Chi tiết 4 trụ cột Điểm uy tín Chủ trọ",
    route: "/trustscore",
    summary:
      "Theo dõi điểm tin cậy từ xác thực danh tính, số phòng đã bàn giao và đánh giá từ khách thuê.",
    spots: [
      {
        selector: "[data-tour='trustscore-donut-card']",
        label: "Tổng điểm & Huy hiệu Chủ trọ uy tín",
        description:
          "Điểm uy tín cao sẽ hiển thị công khai trên từng trang Chi tiết phòng của bạn, giúp tăng tỷ lệ khách liên hệ xem phòng.",
        labelSide: "right",
        pad: 8,
      },
      {
        selector: "[data-tour='trustscore-breakdown-card']",
        label: "4 tiêu chí tính điểm Chủ trọ",
        description:
          "Tổng 100\u00A0điểm gồm: Xác thực tài khoản (35đ), Thông tin hồ sơ (35đ), Đánh giá & Tuân thủ (15đ) và Bàn giao phòng thực tế (15đ). Bấm nút '? Hướng dẫn' mỗi khi bạn cần xem lại!",
        labelSide: "left",
        pad: 8,
        maxSpotHeight: 360,
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
    if (
      pathname.startsWith("/profile") ||
      pathname.startsWith("/edit-profile") ||
      pathname.startsWith("/settings")
    ) {
      const idx = LANDLORD_TOUR_FLOWS.findIndex((f) => f.id === "landlord-profile");
      const resolvedIdx = idx >= 0 ? idx : 8;
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

    if (pathname.startsWith("/trustscore")) {
      const idx = LANDLORD_TOUR_FLOWS.findIndex((f) => f.id === "landlord-trustscore");
      const resolvedIdx = idx >= 0 ? idx : 9;
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

  // Nếu đang ở trang Chi tiết phòng (/rooms/:id), ánh xạ trực tiếp vào Flow #4 (tenant-room-detail)
  if (pathname.startsWith("/rooms/")) {
    const roomDetailIdx = TENANT_TOUR_FLOWS.findIndex((f) => f.id === "tenant-room-detail");
    const resolvedIdx = roomDetailIdx >= 0 ? roomDetailIdx : 3;
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

  if (pathname.startsWith("/edit-profile") || pathname.startsWith("/settings")) {
    const profileIdx = TENANT_TOUR_FLOWS.findIndex((f) => f.id === "tenant-profile");
    const resolvedIdx = profileIdx >= 0 ? profileIdx : 11;
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
