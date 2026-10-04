import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { PageTransition } from "@/components/layouts/PageTransition";
import {
  Search,
  Users,
  ShieldCheck,
  Map,
  FileText,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
  UserCheck,
  ChevronDown,
  Building,
  KeyRound,
  HeartHandshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layouts/MainLayout";

export function AboutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab") || "how";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Auto scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const tabs = [
    { id: "how", label: "Cách hoạt động", icon: Search },
    { id: "trust", label: "Cam kết tin cậy", icon: ShieldCheck },
    { id: "privacy", label: "Chính sách & Bảo mật", icon: FileText },
    { id: "faq", label: "Hỏi đáp (FAQ)", icon: HelpCircle },
  ];

  // Smooth scroll handler
  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* HEADER BANNER */}
      <section className="relative bg-emerald-deep text-white py-16 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-20%] left-[-10%] w-72 h-72 rounded-full bg-emerald-brand/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[5%] w-96 h-96 rounded-full bg-mint/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-5">
          {/* Back Button */}
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
            className="group mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-mint backdrop-blur hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transition-transform group-hover:-translate-x-0.5"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Quay lại
          </button>

          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-mint backdrop-blur">
              Thông tin hệ thống
            </span>
            <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Về Phòng Trọ Xanh
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-emerald-100 text-base leading-relaxed sm:text-lg">
              Giải pháp tìm phòng trọ thông minh, ghép bạn ở cùng phong cách sống và đảm bảo an toàn giao dịch tại Việt Nam.
            </p>
          </div>
        </div>
      </section>

      {/* TABS CONTAINER */}
      <section className="relative bg-white border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto max-w-4xl px-5 py-3">
          <div className="flex items-center justify-start sm:justify-center gap-1 overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap active:scale-95 ${
                    isActive
                      ? "bg-emerald-brand text-white shadow-md shadow-emerald-500/10"
                      : "text-slate-600 hover:text-emerald-brand hover:bg-slate-50"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>


      {/* TAB CONTENT PANEL */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-5 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-100 border border-slate-100/50">
          
          {/* TAB 1: HOW IT WORKS */}
          {activeTab === "how" && (
            <div className="space-y-12">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">Cách hoạt động</h2>
                <p className="text-sm text-slate-500">Quy trình khép kín giúp bạn dễ dàng tìm được phòng và bạn cùng phòng ưng ý nhất.</p>
              </div>

              <div className="grid gap-8 sm:grid-cols-3">
                <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-100/80 transition-all hover:shadow-lg hover:shadow-slate-100">
                  <div className="grid size-12 place-items-center rounded-xl bg-mint text-emerald-brand mb-4">
                    <Search className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">1. Lọc và Tìm phòng</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Sử dụng các bộ lọc thông minh về giá, vị trí, tiện ích bắt buộc và tìm kiếm trực tiếp trên bản đồ giá trực quan.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-100/80 transition-all hover:shadow-lg hover:shadow-slate-100">
                  <div className="grid size-12 place-items-center rounded-xl bg-mint text-emerald-brand mb-4">
                    <Users className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">2. So khớp lối sống</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Thuật toán tự động đo đạc mức độ tương thích về giờ giấc, thói quen vệ sinh và sở thích cá nhân giữa các thành viên.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-100/80 transition-all hover:shadow-lg hover:shadow-slate-100">
                  <div className="grid size-12 place-items-center rounded-xl bg-mint text-emerald-brand mb-4">
                    <Building className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">3. Nhận trọ an toàn</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Kết nối trực tiếp, quét mã nhận phòng và thực hiện hợp đồng điện tử tiện lợi để đảm bảo quyền lợi pháp lý đầy đủ.
                  </p>
                </div>
              </div>

              {/* Detail Sections */}
              <div className="space-y-8 border-t border-slate-100 pt-10">
                <div className="grid gap-6 md:grid-cols-2 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-semibold text-emerald-brand uppercase tracking-wider">So khớp bạn ở ghép</span>
                    <h4 className="text-xl font-bold text-slate-800">Tính năng ghép cặp phong cách sống</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Thông qua bộ câu hỏi Onboarding ngắn gọn, hệ thống sẽ chấm điểm tương thích (Match Score) giữa bạn và hàng ngàn thành viên khác. Bạn có thể dễ dàng vuốt chọn tìm kiếm người bạn cùng phòng thích hợp nhất mà không lo bất đồng sinh hoạt.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-emerald-deep">
                      <span className="bg-mint px-2.5 py-1 rounded-full font-medium">Lịch sinh hoạt</span>
                      <span className="bg-mint px-2.5 py-1 rounded-full font-medium">Mức độ vệ sinh</span>
                      <span className="bg-mint px-2.5 py-1 rounded-full font-medium">Nuôi thú cưng</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-xs border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-emerald-brand/10 text-emerald-brand grid place-items-center font-semibold text-xs">HA</div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Hoài An</p>
                          <p className="text-[10px] text-slate-500">ĐH Kinh tế TP.HCM</p>
                        </div>
                      </div>
                      <span className="bg-emerald-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">94% phù hợp</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-xs border border-slate-100 opacity-80">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-slate-100 text-slate-500 grid place-items-center font-semibold text-xs">VM</div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Văn Minh</p>
                          <p className="text-[10px] text-slate-500">Lập trình viên</p>
                        </div>
                      </div>
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">88% phù hợp</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 items-center border-t border-slate-100 pt-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[160px] text-center">
                    <Map className="size-10 text-emerald-brand mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Bản đồ giá trực quan</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[240px]">Hiển thị ghim giá trị trực quan theo khu vực địa lý, trạm xe buýt và trường đại học gần nhất</p>
                  </div>
                  <div className="space-y-4 md:order-first">
                    <span className="text-xs font-semibold text-emerald-brand uppercase tracking-wider">Tìm trọ trực quan</span>
                    <h4 className="text-xl font-bold text-slate-800">Bản đồ xanh thông minh</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Tìm kiếm và so sánh giá thuê trọ dễ dàng theo bản đồ tích hợp. Các ghim giá hiển thị rõ ràng trên sơ đồ địa lý, giúp bạn lọc nhanh những phòng trọ nằm trong bán kính đi lại hợp lý tới giảng đường hay văn phòng làm việc.
                    </p>
                    <Button onClick={() => navigate("/login")} size="sm" className="bg-emerald-brand hover:bg-emerald-deep text-white font-medium rounded-xl gap-1.5 mt-2">
                      Khám phá Bản đồ <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRUST GUARANTEE */}
          {activeTab === "trust" && (
            <div className="space-y-10">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">Hệ thống cam kết tin cậy</h2>
                <p className="text-sm text-slate-500">Phòng Trọ Xanh hoạt động với tiêu chí loại bỏ rủi ro, bảo vệ tối đa người thuê và chủ nhà.</p>
              </div>

              <div className="space-y-8">
                {/* Assurance 1 */}
                <div className="flex gap-4 p-5 rounded-2xl bg-emerald-brand/5 border border-emerald-500/10">
                  <div className="size-10 rounded-xl bg-emerald-brand text-white flex items-center justify-center shrink-0">
                    <UserCheck className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      Xác minh CCCD 3 lớp
                      <span className="text-[10px] bg-emerald-brand/10 text-emerald-brand px-2 py-0.5 rounded-full font-bold">Quan trọng</span>
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Mọi thành viên tìm phòng hoặc cho thuê phòng trên hệ thống đều phải tải ảnh CCCD và chụp ảnh selfie xác thực khuôn mặt. Đội ngũ admin của Phòng Trọ Xanh đối soát thủ công để duyệt trạng thái xác thực, hạn chế triệt để lừa đảo trực tuyến.
                    </p>
                  </div>
                </div>

                {/* Assurance 2 */}
                <div className="flex gap-4 p-5 rounded-2xl bg-emerald-brand/5 border border-emerald-500/10">
                  <div className="size-10 rounded-xl bg-emerald-brand text-white flex items-center justify-center shrink-0">
                    <Building className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      Kiểm duyệt thực tế phòng trọ
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Phòng trọ được đăng tải kèm giấy tờ chứng minh sở hữu hoặc ủy quyền của chủ nhà. Hệ thống ưu tiên đánh dấu tích xanh xác thực đối với những phòng trọ đã được nhân viên Phòng Trọ Xanh đến chụp ảnh, xác nhận trực tiếp hiện trạng thực tế.
                    </p>
                  </div>
                </div>

                {/* Assurance 3 */}
                <div className="flex gap-4 p-5 rounded-2xl bg-emerald-brand/5 border border-emerald-500/10">
                  <div className="size-10 rounded-xl bg-emerald-brand text-white flex items-center justify-center shrink-0">
                    <KeyRound className="size-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      Bảo vệ tiền đặt cọc an toàn
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Khi thực hiện giữ chỗ hoặc đặt cọc qua nền tảng, khoản cọc sẽ được bảo vệ an toàn trên hệ thống. Khoản tiền này chỉ được giải ngân sau khi hai bên xác nhận bàn giao nhận phòng thành công, kèm đánh giá minh bạch trên hệ thống, tránh nguy cơ lừa đảo chiếm đoạt cọc.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom statistics to show trustworthiness */}
              <div className="border-t border-slate-100 pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-emerald-brand">100%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Thành viên xác minh</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-emerald-brand">0%</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Rủi ro mất cọc giữ chỗ</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-emerald-brand">✓ Đã ở</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Nhãn đánh giá tin cậy</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-2xl font-bold text-emerald-brand">24/7</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Hỗ trợ khẩn cấp</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & POLICIES */}
          {activeTab === "privacy" && (
            <div className="space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">Chính sách & Bảo mật</h2>
                <p className="text-sm text-slate-500">Chúng tôi cam kết bảo vệ dữ liệu thông tin cá nhân và tạo lập môi trường lành mạnh.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Lock className="size-4 text-emerald-brand" /> 1. Bảo mật thông tin định danh
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hình ảnh CCCD và chân dung selfie của bạn chỉ được mã hóa và sử dụng phục vụ mục đích kiểm duyệt tài khoản của đội ngũ admin. Chúng tôi cam kết không tiết lộ, mua bán hay chia sẻ dữ liệu định danh cho bất cứ bên thứ ba nào ngoại trừ cơ quan pháp luật có thẩm quyền khi được yêu cầu.
                  </p>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-6">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-brand" /> 2. Quy tắc cộng đồng về tìm ghép bạn ở
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hồ sơ cá nhân và sở thích của thành viên ghép phòng trọ cần trung thực. Các hành vi quấy rối, kỳ thị, phát ngôn không chuẩn mực sẽ bị khóa tài khoản vĩnh viễn nhằm duy trì cộng đồng sinh viên, người đi làm trẻ lịch sự, tiến bộ.
                  </p>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-6">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <HeartHandshake className="size-4 text-emerald-brand" /> 3. Chính sách hoàn cọc giữ phòng
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Khoản tiền đặt cọc giữ chỗ phòng trọ sẽ được tự động hoàn lại 100% về tài khoản ví của bạn nếu chủ nhà từ chối hoặc hủy giao dịch trước ngày nhận phòng cam kết. Nếu có tranh chấp phát sinh trong quá trình nhận phòng thực tế, bộ phận hỗ trợ khách hàng sẽ làm trọng tài xử lý công bằng.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAQS */}
          {activeTab === "faq" && (
            <div className="space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-3">
                <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">Câu hỏi thường gặp</h2>
                <p className="text-sm text-slate-500">Giải đáp nhanh các thắc mắc phổ biến từ người thuê phòng và chủ nhà.</p>
              </div>

              <div className="space-y-4">
                <FAQItem
                  q="Tại sao tôi bắt buộc phải xác minh CCCD?"
                  a="Để tạo ra một cộng đồng trọ văn minh và loại bỏ tình trạng tin đăng giả, đặt cọc ảo nhằm lừa đảo chiếm đoạt tài sản. Xác minh CCCD đảm bảo mỗi tài khoản trên hệ thống tương ứng với một người dùng thật có trách nhiệm pháp lý rõ ràng."
                />
                <FAQItem
                  q="Làm thế nào để chấm điểm phù hợp bạn ở ghép?"
                  a="Khi đăng ký tài khoản, bạn sẽ thực hiện một bảng khảo sát ngắn về phong cách sống (thời gian thức/ngủ, nuôi thú cưng, mức độ ngăn nắp, hút thuốc, tần suất tiếp khách). Thuật toán của chúng tôi sẽ phân tích dữ liệu này và chấm điểm tương đồng phần trăm giữa các tài khoản."
                />
                <FAQItem
                  q="Tiền cọc giữ chỗ của tôi được giữ như thế nào?"
                  a="Khi bạn thanh toán cọc giữ phòng thông qua ví ứng dụng Phòng Trọ Xanh, tiền sẽ được tạm giữ an toàn trong ví đảm bảo của hệ thống. Chỉ khi bạn và chủ trọ xác nhận bàn giao nhận phòng thành công trên hệ thống, tiền mới được giải ngân đến ví của chủ nhà."
                />
                <FAQItem
                  q="Quy trình đổi phòng giữa các thành viên diễn ra như thế nào?"
                  a="Người thuê đang ở phòng có thể tạo yêu cầu đổi phòng (swap) với một người thuê khác cùng hệ thống hoặc gửi đề xuất xin chuyển phòng khác của cùng chủ nhà. Đề xuất chỉ được thực hiện khi có sự đồng ý của cả hai bên thuê và xác nhận chấp thuận của chủ nhà."
                />
                <FAQItem
                  q="Chủ nhà có mất phí đăng tin phòng trọ không?"
                  a="Phòng Trọ Xanh cho phép chủ nhà đăng tin phòng trọ cơ bản miễn phí hoàn toàn. Chúng tôi chỉ cung cấp các gói dịch vụ bổ trợ nâng cấp (như đẩy tin nổi bật, nhãn xác thực đối soát thực tế, công cụ quản lý hóa đơn) với mức phí nhỏ để gia tăng hiệu quả tìm khách."
                />
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
      </div>
    </PageTransition>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-2xl bg-slate-50 overflow-hidden transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 text-left flex items-center justify-between font-bold text-slate-800 text-sm hover:bg-slate-100/50"
      >
        <span>{q}</span>
        <ChevronDown className={`size-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/30">
          {a}
        </div>
      )}
    </div>
  );
}
