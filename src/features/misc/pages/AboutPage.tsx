import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { PageTransition } from "@/components/layouts/PageTransition";
import {
  Search,
  Users,
  ShieldCheck,
  FileText,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  UserCheck,
  ChevronDown,
  Building2,
  CalendarCheck,
  SlidersHorizontal,
  Repeat,
} from "lucide-react";
import { Footer } from "@/components/layouts/MainLayout";

const TENANT_STEPS = [
  {
    step: "01",
    title: "Tìm phòng theo khu vực & sức chứa",
    desc: "Tra cứu phòng theo Quận, cụm trường ĐH, ngân sách và số người ở tối đa. Xem rõ giá thuê, tiền cọc và bảng phí điện, nước niêm yết.",
  },
  {
    step: "02",
    title: "So sánh & ghép bạn hợp lối sống",
    desc: "Đặt tối đa 4 phòng cạnh nhau để đối chiếu chi phí, hoặc bật hồ sơ ghép bạn theo 5 tiêu chí sinh hoạt để chia sẻ tiền phòng.",
  },
  {
    step: "03",
    title: "Hẹn xem phòng & giữ nguyên mức giá",
    desc: "Gửi lịch hẹn xem phòng trực tuyến. Hệ thống cố định mức giá thuê và tiền cọc tại thời điểm đặt lịch để tránh phát sinh chi phí.",
  },
  {
    step: "04",
    title: "Nhận bàn giao & đánh giá thực tế",
    desc: "Xác nhận nhận phòng để kích hoạt quyền đánh giá hai chiều và cộng Điểm Uy Tín cho cả người thuê lẫn chủ trọ.",
  },
];

const LANDLORD_STEPS = [
  {
    step: "01",
    title: "Đăng tin kèm số người ở tối đa",
    desc: "Nhập diện tích, sức chứa tối đa (1–20 người), ảnh thực tế và bảng giá điện nước. Chỉ nhập phí cho những dịch vụ thực sự có thu.",
  },
  {
    step: "02",
    title: "Duy trì hiển thị, không tự ẩn sau 30 ngày",
    desc: "Tin phòng Còn trống luôn hiển thị ổn định mà không bắt gia hạn thủ công. Chủ trọ toàn quyền bấm Tạm ẩn hoặc Mở lại bất cứ lúc nào.",
  },
  {
    step: "03",
    title: "Kiểm tra Điểm Uy Tín khách trước khi duyệt",
    desc: "Xem rõ Điểm Uy Tín, trạng thái xác minh CCCD, trường học/nơi làm việc và lời nhắn của người thuê trước khi đồng ý lịch hẹn.",
  },
  {
    step: "04",
    title: "Tự động đóng tin khi bàn giao phòng",
    desc: "Ngay khi hai bên xác nhận bàn giao phòng, tin đăng tự động chuyển sang Đã thuê và ẩn khỏi trang tìm kiếm để không bị làm phiền.",
  },
];

const TRUST_METRICS = [
  {
    score: "35 điểm",
    title: "Định danh CCCD & SĐT",
    detail: "Xác thực Email/SĐT (+10đ) và duyệt CCCD 2 mặt bởi Quản trị viên (+25đ).",
  },
  {
    score: "35 điểm",
    title: "Hồ sơ & Tiêu chí thật",
    detail: "Ảnh đại diện (+5đ), giới thiệu (+10đ), trường/nơi làm việc (+10đ), tiêu chí (+10đ).",
  },
  {
    score: "15 điểm",
    title: "Đánh giá hai chiều",
    detail: "Quy đổi từ điểm sao trung bình của các hợp đồng đã nhận phòng thực tế.",
  },
  {
    score: "15 điểm",
    title: "Lịch sử nhận phòng",
    detail: "Cộng điểm khi hoàn tất bàn giao phòng và tuân thủ đúng thỏa thuận thuê.",
  },
];

const FAQS = [
  {
    q: "Tại sao nên xác minh CCCD trên hệ thống?",
    a: "Xác minh CCCD giúp tài khoản được cộng +25 điểm Uy tín và gắn huy hiệu Đã xác minh CCCD công khai. Chủ trọ sẽ yên tâm duyệt lịch hẹn nhanh hơn, đồng thời người tìm phòng hoặc tìm bạn ở ghép cũng tin tưởng hơn khi kết nối.",
  },
  {
    q: "Chủ trọ đăng tin phòng có bị tự động hết hạn sau 30 ngày không?",
    a: "Không. Phòng Trọ Xanh không giới hạn 30 ngày tự ẩn tin. Tin phòng sẽ hiển thị liên tục cho đến khi có khách xác nhận nhận phòng (tự động chuyển sang Đã thuê) hoặc khi chủ trọ chủ động bấm Tạm ẩn.",
  },
  {
    q: "Làm sao biết một phòng cho phép ở tối đa bao nhiêu người?",
    a: "Khi đăng phòng, chủ trọ nhập rõ Số người ở tối đa (ví dụ: Tối đa 2 người, Tối đa 3 người). Thông số này hiển thị trực tiếp trên thẻ phòng ở trang chủ, trang Khám phá, bảng So sánh phòng và trang Chi tiết phòng.",
  },
  {
    q: "Phòng ở được 2–3 người nhưng tôi mới ở 1 mình thì tìm thêm bạn ghép thế nào?",
    a: "Bạn chỉ cần vào mục Ghép bạn để bật hồ sơ tìm người ở cùng. Hệ thống sẽ đối chiếu 5 tiêu chí sinh hoạt (ngân sách, khu vực, giờ giấc, mức độ ngăn nắp, thói quen tiếp khách) để gợi ý người hợp lối sống nhất.",
  },
  {
    q: "Chủ nhà có mất phí khi đăng phòng cho thuê không?",
    a: "Chủ nhà được đăng tin phòng trọ cơ bản hoàn toàn miễn phí. Hệ thống chỉ thu phí khi chủ nhà chủ động mua gói Đẩy tin nổi bật (hiển thị đầu trang trong 7 ngày) hoặc nâng cấp gói VIP.",
  },
];

export function AboutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab") || "how";
  const [roleView, setRoleView] = useState<"tenant" | "landlord">("tenant");

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const tabs = [
    { id: "how", label: "Cách hoạt động", icon: Search },
    { id: "trust", label: "Cam kết tin cậy", icon: ShieldCheck },
    { id: "privacy", label: "Chính sách & Bảo mật", icon: FileText },
    { id: "faq", label: "Hỏi đáp (FAQ)", icon: HelpCircle },
  ];

  const activeSteps = roleView === "tenant" ? TENANT_STEPS : LANDLORD_STEPS;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col justify-between">
        {/* STICKY TOP NAVBAR — Matches LandingNavbar container (max-w-7xl px-5 sm:px-8) */}
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-[0_6px_16px_-6px_rgba(5,150,105,0.65)] transition-transform duration-150 group-hover:scale-105">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 6l10 7.5V26h-6.5v-7.5h-7V26H6V13.5L16 6z" />
                </svg>
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-emerald-950 sm:text-xl">
                Phòng Trọ Xanh
              </span>
            </Link>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all duration-150 hover:border-emerald-500/40 hover:bg-emerald-50/60 hover:text-emerald-800 active:scale-[0.97] cursor-pointer sm:text-sm"
              >
                <ArrowLeft className="size-4 text-emerald-600" />
                Về trang chủ
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-all duration-150 hover:bg-emerald-700 active:scale-[0.97] cursor-pointer sm:px-5 sm:text-sm"
              >
                Đăng nhập
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </nav>
        </header>

        {/* CLEAN HEADER + FULL-WIDTH 4-TAB GRID (Aligned to max-w-7xl) */}
        <section className="border-b border-slate-200/80 bg-white pt-8 pb-6">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  Về nền tảng Phòng Trọ Xanh
                </h1>
                <p className="mt-2 text-sm text-slate-600 sm:text-base">
                  Cơ chế vận hành, cấu trúc Điểm Uy Tín và quy định minh bạch dành cho người thuê trọ lẫn chủ nhà.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-800">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  100% niêm yết rõ giá điện, nước & sức chứa
                </span>
              </div>
            </div>

            {/* 4-Column Tab Bar — Never scrolls horizontally */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/90 bg-[#f8faf9] p-1.5 sm:grid-cols-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-white hover:text-emerald-800"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* MAIN CONTENT CONTAINER (Aligned to max-w-7xl) */}
        <main className="flex-1 mx-auto max-w-7xl w-full px-5 sm:px-8 py-8 sm:py-10">
          {/* TAB 1: CÁCH HOẠT ĐỘNG */}
          {activeTab === "how" && (
            <div className="space-y-8">
              {/* Role Switcher Header */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    Quy trình 4 bước khép kín
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Chọn vai trò của bạn để xem luồng thao tác trên hệ thống
                  </p>
                </div>

                <div className="inline-grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setRoleView("tenant")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      roleView === "tenant"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users className="size-4" />
                    Người đi thuê
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleView("landlord")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      roleView === "landlord"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Building2 className="size-4" />
                    Chủ nhà trọ
                  </button>
                </div>
              </div>

              {/* Clean 4-Step Grid (Single-level cards, zero nested boxes) */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {activeSteps.map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-flex items-center justify-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700">
                        Bước {item.step}
                      </span>
                      <h3 className="mt-3.5 text-base font-extrabold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Single Unified Strip for Core Capabilities */}
              <div className="rounded-2xl border border-slate-200/90 bg-white divide-y sm:divide-y-0 sm:divide-x divide-slate-200 grid sm:grid-cols-3">
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <SlidersHorizontal className="size-4 text-emerald-600 shrink-0" />
                    So sánh trực diện 4 phòng
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Đối chiếu cùng lúc giá thuê, tiền cọc, diện tích, sức chứa tối đa và bảng phí điện nước.
                  </p>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <CalendarCheck className="size-4 text-emerald-600 shrink-0" />
                    Thông báo trạng thái tức thì
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Nhận thông báo ngay khi chủ trọ duyệt lịch hẹn, xác nhận bàn giao hoặc có tin nhắn trao đổi mới.
                  </p>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <Repeat className="size-4 text-emerald-600 shrink-0" />
                    Ghép thêm người khi chưa đủ chỗ
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Phòng ở tối đa 2–4 người mới có 1 người thuê có thể bật hồ sơ tìm bạn ở ghép để chia sẻ chi phí.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAM KẾT TIN CẬY */}
          {activeTab === "trust" && (
            <div className="space-y-8">
              {/* 100-Point Trust Score Bar */}
              <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden">
                <div className="flex flex-col gap-2 border-b border-slate-200/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Cấu trúc Điểm Uy Tín (Thang 100 điểm)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Quy đổi trực tiếp thành điểm sao (tối đa 5.0 sao) trên hồ sơ chủ trọ và người thuê
                    </p>
                  </div>
                  <span className="self-start sm:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-extrabold text-emerald-800">
                    Tối đa 100 / 100 điểm
                  </span>
                </div>

                <div className="grid divide-y sm:divide-y-0 sm:divide-x divide-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                  {TRUST_METRICS.map((m) => (
                    <div key={m.title} className="p-5">
                      <span className="text-lg font-extrabold text-emerald-700">
                        {m.score}
                      </span>
                      <h3 className="mt-1 text-sm font-extrabold text-slate-900">
                        {m.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                        {m.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Core Protection Mechanisms */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
                  <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
                    <UserCheck className="size-5" />
                  </div>
                  <h3 className="mt-3.5 text-base font-extrabold text-slate-900">
                    Duyệt CCCD hai mặt thủ công
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Quản trị viên đối soát ảnh CCCD 2 mặt trước khi cấp huy hiệu <strong>Đã xác minh CCCD</strong>, ngăn chặn tài khoản ẩn danh đăng phòng ảo.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
                  <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
                    <CalendarCheck className="size-5" />
                  </div>
                  <h3 className="mt-3.5 text-base font-extrabold text-slate-900">
                    Cố định giá khi gửi lịch hẹn
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Mức giá thuê và tiền cọc được lưu cố định vào yêu cầu ngay lúc người thuê đặt lịch, không bị ảnh hưởng nếu chủ trọ đổi giá tin đăng sau đó.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-5">
                  <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h3 className="mt-3.5 text-base font-extrabold text-slate-900">
                    Đánh giá từ hợp đồng thực tế
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Chỉ người thuê đã hoàn tất xác nhận nhận bàn giao phòng trên hệ thống mới có quyền chấm sao và viết đánh giá công khai.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHÍNH SÁCH & BẢO MẬT */}
          {activeTab === "privacy" && (
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Section 1 */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7">
                  <div className="flex items-center gap-2.5 text-base font-extrabold text-slate-900">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Lock className="size-4.5" />
                    </span>
                    1. Bảo mật giấy tờ định danh & Dữ liệu cá nhân
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Hình ảnh Căn cước công dân (CCCD) chỉ được sử dụng duy nhất cho mục đích đối soát xác thực tài khoản bởi Quản trị viên. Hệ thống tuyệt đối không hiển thị công khai số CCCD trên trang cá nhân và không chia sẻ cho bên thứ ba.
                  </p>
                </div>

                {/* Section 2 */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7">
                  <div className="flex items-center gap-2.5 text-base font-extrabold text-slate-900">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Building2 className="size-4.5" />
                    </span>
                    2. Quy định minh bạch giá phí & Trạng thái tin phòng
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Chủ trọ niêm yết rõ giá thuê, tiền cọc, số người ở tối đa và đơn giá điện, nước, dịch vụ. Tin phòng không bị giới hạn 30 ngày tự hết hạn, nhưng sẽ tự động chuyển sang <strong>Đã thuê</strong> ngay khi có khách xác nhận nhận bàn giao phòng.
                  </p>
                </div>
              </div>

              {/* Section 3 */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 space-y-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 sm:text-lg">
                      3. Quy tắc xử lý vi phạm 3 cấp độ & Chính sách gói trả phí
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600">
                      Áp dụng đối với các báo cáo sai phạm có bằng chứng thực tế được Quản trị viên xác minh:
                    </p>
                  </div>
                  <span className="self-start sm:self-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    Bảo vệ cộng đồng minh bạch
                  </span>
                </div>

                <div className="grid divide-y sm:divide-y-0 sm:divide-x divide-slate-200 rounded-xl border border-slate-200 bg-[#f8faf9] sm:grid-cols-3">
                  <div className="p-5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                      Vi phạm lần 1
                    </span>
                    <p className="mt-1.5 text-sm font-extrabold text-slate-900 sm:text-base tabular-nums">
                      Nhắc nhở & Trừ 15 điểm
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Gỡ nội dung sai quy định, trừ 15 điểm Uy tín và gửi thông báo nhắc nhở.
                    </p>
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-orange-700">
                      Vi phạm lần 2
                    </span>
                    <p className="mt-1.5 text-sm font-extrabold text-slate-900 sm:text-base tabular-nums">
                      Cảnh báo & Trừ 25 điểm
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Gỡ nội dung vi phạm, trừ 25 điểm Uy tín và hạn chế quyền ưu tiên hiển thị.
                    </p>
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-red-700">
                      Vi phạm lần 3
                    </span>
                    <p className="mt-1.5 text-sm font-extrabold text-slate-900 sm:text-base tabular-nums">
                      Khóa tài khoản (0 điểm)
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Ngừng cung cấp dịch vụ vĩnh viễn và ẩn toàn bộ tin đăng đang hoạt động.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Căn cứ Điều 423, Điều 428 Bộ luật Dân sự 2015 và Nghị định 52/2013/NĐ-CP (sửa đổi bởi Nghị định 85/2021/NĐ-CP), trường hợp tài khoản bị khóa do vi phạm lần 3 (đăng phòng ảo, thu sai phí cam kết hoặc thông tin sai sự thật), hệ thống không hoàn lại phí các gói Đẩy tin/VIP đã mua. Thành viên có quyền gửi phản hồi kèm minh chứng trong vòng 07 ngày.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: HỎI ĐÁP (FAQ) */}
          {activeTab === "faq" && (
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white p-6 space-y-4">
                <div className="size-10 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center">
                  <HelpCircle className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Giải đáp thắc mắc thường gặp
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Tổng hợp các câu hỏi về xác minh CCCD, quy định hiển thị tin phòng, sức chứa tối đa và cách ghép bạn cùng phòng.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/discover")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-[0.97] cursor-pointer"
                  >
                    Khám phá phòng ngay
                    <ArrowRight className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("how")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-all duration-150 hover:border-emerald-500/40 hover:text-emerald-800 active:scale-[0.97] cursor-pointer"
                  >
                    Xem quy trình 4 bước
                  </button>
                </div>
              </div>

              <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 bg-white divide-y divide-slate-200 overflow-hidden">
                {FAQS.map((item, idx) => (
                  <FAQRow key={item.q} q={item.q} a={item.a} defaultOpen={idx < 2} />
                ))}
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
}

function FAQRow({
  q,
  a,
  defaultOpen = false,
}: {
  q: string;
  a: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:bg-slate-50/80 transition-colors cursor-pointer"
      >
        <span>{q}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-emerald-700" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}
