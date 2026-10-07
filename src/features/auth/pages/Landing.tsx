import { Link, useNavigate, NavLink, useLocation } from "react-router";
import { useState, useEffect } from "react";
import HeroCanvas from "@/features/auth/components/HeroCanvas";
import { Footer } from "@/components/layouts/MainLayout";
import { useReveal } from "@/hooks/useReveal";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { useAuth } from "@/app/context/AuthContext";
import { AuthPromptModal } from "@/features/auth/components/AuthPromptModal";
import { PageTransition } from "@/components/layouts/PageTransition";
import { TopNav } from "@/components/layouts/TopNav";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import { roomImages } from "@/lib/constants";
import { api } from "@/lib/api";

interface LandingStats {
  availableRoomsCount: number;
  matchedPairsCount: number;
  activeUsersCount: number;
  positiveReviewRate: number;
}

/* ── Data ── */

const steps = [
  { n: "01", title: "Chọn nhu cầu", desc: "Điền ngân sách, khu vực, tiện ích bắt buộc. Lọc trước khi vuốt.", icon: "filter" as const },
  { n: "02", title: "Vuốt để chọn", desc: "Lướt thẻ phòng & bạn ở ghép kiểu Tinder. Thích → phải, bỏ qua → trái.", icon: "swipe" as const },
  { n: "03", title: "Ghép & dọn vào", desc: "Phù hợp thì nhắn tin, hẹn xem phòng, xác minh CCCD rồi chốt.", icon: "home" as const },
];

const features = [
  { title: "Ghép theo độ phù hợp", desc: "Thuật toán so khớp lịch sinh hoạt, ngân sách, mức sạch sẽ, sở thích — hiện badge \"XX% phù hợp\".", icon: "spark" as const },
  { title: "Xác minh CCCD", desc: "Định danh thật bằng CCCD + TrustScore, giảm rủi ro lừa đảo khi tìm trọ và bạn ở ghép.", icon: "shield" as const },
  { title: "Bản đồ giá trực quan", desc: "Xem phòng theo bản đồ với ghim giá xanh, lọc theo quận và khoảng cách tới trường/chỗ làm.", icon: "map" as const },
  { title: "Đánh giá công khai & minh bạch", desc: "Người xem phòng và người thuê đều có thể đánh giá, gắn nhãn rõ ràng, cảnh báo phòng trọ và chủ nhà kém chất lượng.", icon: "star" as const },
];

const testimonials = [
  { name: "Nguyễn Thị Lan", role: "Sinh viên ĐH Sư phạm Kỹ thuật", quote: "Mình tìm được phòng gần trường và bạn ở ghép hợp gu chỉ sau 2 ngày vuốt. Badge phù hợp đúng thật!", match: 94 },
  { name: "Trần Văn Minh", role: "Lập trình viên, Quận 1", quote: "Xác minh CCCD làm mình yên tâm hẳn. Không còn cảnh đặt cọc rồi lo bị lừa như trước.", match: 88 },
  { name: "Lê Hoàng Anh", role: "Sinh viên ĐH Kinh tế", quote: "Giao diện sạch, vuốt phòng vui như chơi game mà lại tìm được chỗ ở ưng ý thật.", match: 90 },
];

const FALLBACK_FEATURED_ROOMS = [
  {
    id: "33333333-0000-0000-0000-000000000001",
    title: "Phòng Studio Ban Công Thoáng Mát, Full Nội Thất",
    price: 4500000,
    district: "Bình Thạnh",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "33333333-0000-0000-0000-000000000002",
    title: "Căn Hộ Mini Gác Lửng Cao Cấp Gần ĐH Tôn Đức Thắng",
    price: 3800000,
    district: "Quận 7",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "33333333-0000-0000-0000-000000000003",
    title: "Phòng Trọ Khép Kín An Ninh, Gần ĐH Sư Phạm Kỹ Thuật",
    price: 4200000,
    district: "Thủ Đức",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    ],
  },
];

/* ── Icon helpers (inline SVG, no external deps) ── */

function StepIcon({ name }: { name: "filter" | "swipe" | "home" }) {
  const common = { width: 24, height: 24, fill: "none", stroke: "currentColor", strokeWidth: 1.7, viewBox: "0 0 24 24", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "filter") return <svg {...common}><path d="M3 5h18M6 12h12M10 19h4" /></svg>;
  if (name === "swipe") return <svg {...common}><rect x="6" y="3" width="12" height="18" rx="3" /><path d="m9 9 3 3 3-3" /></svg>;
  return <svg {...common}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>;
}

function FeatureIcon({ name }: { name: "spark" | "shield" | "map" | "star" }) {
  const common = { width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "spark") return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === "map") return <svg {...common}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>;
  return <svg {...common}><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.6l1-5.8L3.5 9.2l5.9-.9L12 3z" /></svg>;
}

/* ── Page ── */

export default function Landing() {
  useReveal();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { rooms, isLoading } = useRooms();
  const displayRooms = rooms.length > 0 ? rooms.slice(0, 3) : FALLBACK_FEATURED_ROOMS;
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    api
      .get<LandingStats>("/misc/landing-stats")
      .then((data) => setStats(data))
      .catch((err) => console.warn("Could not fetch landing stats", err));
  }, []);

  const statItems = [
    {
      num: stats ? `${stats.availableRoomsCount}` : "20+",
      label: "Phòng đang cho thuê",
    },
    {
      num: stats ? `${stats.matchedPairsCount}` : "0+",
      label: "Bạn ở ghép đã khớp",
    },
    {
      num: stats ? `${stats.activeUsersCount}` : "25+",
      label: "Người dùng hoạt động",
    },
    {
      num: stats ? `${stats.positiveReviewRate}%` : "100%",
      label: "Đánh giá tích cực",
    },
  ];

  const handleRoomClick = (roomId: string) => {
    if (user) {
      navigate(`/rooms/${roomId}`);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const getStartLink = () => {
    if (!user) return "/login?mode=register";
    if (role !== "admin" && user.isOnboarded === false) {
      return role === "landlord" ? "/onboarding/landlord" : "/onboarding/role";
    }
    if (role === "landlord") return "/landlord";
    if (role === "admin") return "/admin";
    return "/discover";
  };

  return (
    <PageTransition>
      <main className="overflow-x-hidden">
      {/* ===== NAVBAR ===== */}
      <LandingNavbar user={user} role={role} />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen overflow-hidden">
        {/* aurora blobs */}
        <div className="aurora left-[-10%] top-[-5%] h-[420px] w-[420px] bg-sage" />
        <div className="aurora right-[-8%] top-[20%] h-[360px] w-[360px] bg-emerald-200" />
        {/* 3D background */}
        <div className="absolute inset-0">
          <HeroCanvas />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-5 pt-20 text-center sm:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-sage bg-white/70 px-4 py-1.5 text-sm font-medium text-emerald-deep backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-brand" />
            Nền tảng tìm trọ & ghép bạn ở ghép #1 cho người trẻ
          </span>

          <h1 className="font-display mt-6 max-w-4xl text-5xl font-semibold leading-[1.05] text-ink sm:text-7xl">
            Tìm trọ đúng,
            <br />
            <span className="text-emerald-brand">Ở đúng người.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-slate-soft">
            Vuốt chọn phòng và bạn ở ghép kiểu Tinder — lọc theo ngân sách, khu vực,
            lối sống. Khớp đúng độ phù hợp, định danh CCCD an toàn.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={getStartLink()}
              className="btn btn-primary px-7 py-3.5 text-base"
            >
              {user ? "Vào ứng dụng" : "Đăng ký ngay"}
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <a
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("how");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn btn-ghost px-7 py-3.5 text-base"
            >
              Cách hoạt động
            </a>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-center">
            {statItems.map((item) => (
              <div key={item.label} className="min-w-[100px]">
                <div className="font-display text-3xl font-semibold text-emerald-deep">{item.num}</div>
                <div className="text-sm text-slate-soft">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-soft/70">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" className="animate-bounce"><path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-brand">Cách hoạt động</p>
          <h2 className="font-display mt-3 text-4xl font-semibold text-ink sm:text-5xl">Ba bước đến chỗ ở mơ ước</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="reveal card-surface rounded-3xl p-8" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-emerald-brand"><StepIcon name={s.icon} /></span>
                <span className="font-display text-3xl font-semibold text-sage">{s.n}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-charcoal">{s.title}</h3>
              <p className="mt-2 text-slate-soft">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="bg-mint/40 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="reveal grid items-end justify-between gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-brand">Tính năng nổi bật</p>
              <h2 className="font-display mt-3 text-4xl font-semibold text-ink sm:text-5xl">An toàn, đúng người, đúng giá</h2>
            </div>
            <p className="max-w-md text-slate-soft md:text-right">
              Mọi thứ bạn cần để tìm chỗ ở yên tâm — từ khớp độ phù hợp tới xác minh danh tính thật.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={f.title} className="reveal card-surface group rounded-3xl p-7 transition-transform hover:-translate-y-1.5" style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-brand text-white shadow-[0_10px_22px_-10px_rgba(5,150,105,0.8)] transition-transform group-hover:scale-110">
                  <FeatureIcon name={f.icon} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-charcoal">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-soft">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROOM PREVIEW ===== */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-brand">Phòng nổi bật</p>
            <h2 className="font-display mt-3 text-4xl font-semibold text-ink sm:text-5xl">Gợi ý hôm nay cho bạn</h2>
          </div>
          <Link to={user ? "/discover" : "/login"} className="btn btn-ghost px-5 py-2.5">Xem tất cả →</Link>
        </div>
        {isLoading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="overflow-hidden rounded-3xl card-surface animate-pulse">
                <div className="aspect-[4/3] w-full bg-slate-200" />
                <div className="space-y-2.5 p-5">
                  <div className="h-5 w-3/4 rounded-lg bg-slate-200" />
                  <div className="h-5 w-1/3 rounded-lg bg-slate-200" />
                  <div className="h-4 w-1/2 rounded-lg bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayRooms.map((r, i) => {
              const img = r.images?.[0] || (r as any).primaryImageUrl || roomImages[i % roomImages.length];
              const priceFormatted = (Number(r.price || 0) / 1_000_000).toFixed(1);
              return (
                <div
                  key={r.id}
                  className="reveal group cursor-pointer overflow-hidden rounded-3xl card-surface transition-transform hover:-translate-y-1"
                  style={{ transitionDelay: `${i * 90}ms` }}
                  onClick={() => handleRoomClick(r.id)}
                >
                  <ImageWithFallback src={img} alt={r.title} className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
                  <div className="space-y-1 p-5">
                    <h3 className="line-clamp-1 text-lg font-semibold text-charcoal">{r.title}</h3>
                    <p className="text-emerald-brand text-lg font-semibold">{priceFormatted} triệu<span className="text-sm font-normal text-slate-soft">/tháng</span></p>
                    <p className="text-sm text-slate-soft">{r.district || "TP.HCM"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="bg-mint/40 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-brand">Người dùng nói gì</p>
            <h2 className="font-display mt-3 text-4xl font-semibold text-ink sm:text-5xl">Hàng nghìn người trẻ đã tin dùng</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure key={t.name} className="reveal card-surface rounded-3xl p-7" style={{ transitionDelay: `${i * 90}ms` }}>
                <div className="flex gap-1 text-emerald-brand">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <svg key={k} width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.6l1-5.8L3.5 9.2l5.9-.9L12 3z" /></svg>
                  ))}
                </div>
                <blockquote className="mt-4 text-charcoal">"{t.quote}"</blockquote>
                <figcaption className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-charcoal">{t.name}</div>
                    <div className="text-sm text-slate-soft">{t.role}</div>
                  </div>
                  <span className="pill">{t.match}% phù hợp</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="reveal relative overflow-hidden rounded-[2.5rem] bg-emerald-deep px-8 py-16 text-center sm:px-16">
          <div className="aurora left-[10%] top-[-20%] h-[300px] w-[300px] bg-emerald-400/40" />
          <div className="aurora right-[5%] bottom-[-30%] h-[320px] w-[320px] bg-emerald-300/30" />
          <div className="relative">
            <h2 className="font-display text-4xl font-semibold text-white sm:text-5xl">Sẵn sàng tìm trọ đúng?</h2>
            <p className="mx-auto mt-4 max-w-lg text-emerald-100">
              Tạo hồ sơ miễn phí, chọn nhu cầu và bắt đầu vuốt chỉ trong 2 phút.
            </p>
            <Link
              to={getStartLink()}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-emerald-deep transition-transform hover:-translate-y-0.5"
            >
              Bắt đầu ngay
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <AuthPromptModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    </PageTransition>
  );
}

/* ── Landing Navbar (ported from phong-tro-xanh with scroll blur effect) ── */

interface LandingNavbarProps {
  user: any;
  role: string | null;
}

function LandingNavbar({ user, role }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const links = !user 
    ? [
        { label: "Cách hoạt động", to: "/about?tab=how" },
        { label: "Cam kết tin cậy", to: "/about?tab=trust" },
        { label: "Chính sách & Bảo mật", to: "/about?tab=privacy" },
        { label: "Hỏi đáp (FAQ)", to: "/about?tab=faq" },
      ]
    : role === "landlord"
    ? [
        { label: "Bảng quản lý", to: "/landlord" },
        { label: "Phòng trọ", to: "/landlord?tab=rooms" },
        { label: "Đăng phòng", to: "/landlord?tab=post" },
        { label: "Khách thuê", to: "/landlord?tab=tenants" },
        { label: "Tin nhắn", to: "/landlord?tab=chat" },
      ]
    : role === "admin"
    ? [
        { label: "Bảng quản trị", to: "/admin" },
        { label: "Duyệt CCCD", to: "/admin/cccd" },
        { label: "Người dùng", to: "/admin/users" },
        { label: "Báo cáo", to: "/admin/reports" },
      ]
    : role === "tenant"
    ? [
        { label: "Tìm phòng", to: "/discover" },
        { label: "Ghép bạn", to: "/roommates" },
        { label: "Phòng của tôi", to: "/rentals/me" },
        { label: "Đổi phòng", to: "/swap" },
        { label: "Tin nhắn", to: "/chat" },
      ]
    : [
        { label: "Tìm phòng", to: "/discover" },
        { label: "Ghép bạn", to: "/roommates" },
        { label: "Phòng của tôi", to: "/rentals/me" },
        { label: "Đổi phòng", to: "/swap" },
        { label: "Tin nhắn", to: "/chat" },
      ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-slate-900/5 shadow-[0_4px_24px_-16px_rgba(6,95,70,0.4)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-brand text-mint shadow-[0_8px_20px_-8px_rgba(5,150,105,0.7)]">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 6l8 6v12h-5v-7h-6v7H8V12l8-6z" />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold text-emerald-deep">
            Phòng Trọ Xanh
          </span>
        </Link>

        {/* Links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            return (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive && loc.pathname === l.to
                      ? "text-emerald-brand font-semibold"
                      : "text-charcoal/70 hover:text-emerald-brand hover:bg-slate-100/50"
                  }`
                }
              >
                {l.label}
              </NavLink>
            );
          })}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (role !== "admin" && user.isOnboarded === false) {
                    navigate(role === "landlord" ? "/onboarding/landlord" : "/onboarding/role");
                  } else {
                    navigate(role === "landlord" ? "/landlord" : role === "admin" ? "/admin" : "/discover");
                  }
                }}
                className="btn btn-primary px-4 py-2 text-sm"
              >
                Vào ứng dụng
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                title="Đăng xuất / Đổi tài khoản"
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="rounded-full px-4 py-2 text-sm font-medium text-charcoal/70 transition-colors hover:text-emerald-brand"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/login?mode=register")}
                className="btn btn-primary px-5 py-2 text-sm"
              >
                Đăng ký ngay
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
