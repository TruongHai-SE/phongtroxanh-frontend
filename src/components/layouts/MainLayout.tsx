import { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { TopNav } from "@/components/layouts/TopNav";
import { useAuth } from "@/app/context/AuthContext";
import { AnimatePresence } from "motion/react";
import { PageTransition } from "./PageTransition";

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    // If user is logged in (not guest) and is not admin and has not completed onboarding, force onboarding
    if (user && role !== "admin" && user.isOnboarded === false) {
      navigate(role === "landlord" ? "/onboarding/landlord" : "/onboarding/role", { replace: true });
    }
  }, [user, role, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />
      <main className="flex-1 flex flex-col min-h-[70vh]">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export function Footer() {
  const { user, role } = useAuth();

  // Define footer columns dynamically based on role/auth status
  let columns = [
    {
      title: "Khám phá",
      items: [
        ["Cách hoạt động", "/about?tab=how"],
        ["Hệ thống cam kết", "/about?tab=trust"],
      ] as [string, string][],
    },
    {
      title: "Chính sách & Pháp lý",
      items: [
        ["Chính sách bảo mật", "/about?tab=privacy"],
        ["Điều khoản sử dụng", "/about?tab=privacy"],
      ] as [string, string][],
    },
    {
      title: "Hỗ trợ & Tài khoản",
      items: [
        ["Câu hỏi thường gặp (FAQ)", "/about?tab=faq"],
        ["Đăng nhập hệ thống", "/login"],
        ["Đăng ký thành viên", "/login?mode=register"],
      ] as [string, string][],
    },
  ];

  if (!user) {
    // Keep guest columns as defined above
  } else if (role === "landlord") {
    columns = [
      {
        title: "Công cụ chủ trọ",
        items: [
          ["Tổng quan", "/landlord"],
          ["Phòng của tôi", "/landlord?tab=rooms"],
          ["Đăng phòng", "/landlord?tab=post"],
          ["Gói dịch vụ VIP", "/landlord?tab=packages"],
        ] as [string, string][],
      },
      {
        title: "Người thuê & Yêu cầu",
        items: [
          ["Người thuê trọ", "/landlord?tab=tenants"],
          ["Đánh giá người thuê", "/landlord?tab=reviews"],
          ["Duyệt đổi phòng", "/landlord?tab=swaps"],
        ] as [string, string][],
      },
      {
        title: "Dịch vụ",
        items: [
          ["Trợ giúp (FAQ)", "/about?tab=faq"],
          ["Hệ thống cam kết", "/about?tab=trust"],
        ] as [string, string][],
      },
    ];
  } else if (role === "admin") {
    columns = [
      {
        title: "Quản trị hệ thống",
        items: [
          ["Tổng quan quản trị", "/admin"],
          ["Duyệt CCCD", "/admin/cccd"],
          ["Người dùng", "/admin/users"],
          ["Báo cáo / Tố cáo", "/admin/reports"],
        ] as [string, string][],
      },
      {
        title: "Dịch vụ hệ thống",
        items: [
          ["Tìm phòng", "/discover"],
          ["Bản đồ phòng", "/map"],
          ["Hệ thống cam kết", "/about?tab=trust"],
        ] as [string, string][],
      },
      {
        title: "Hỗ trợ",
        items: [
          ["Cài đặt hệ thống", "/settings"],
          ["Điều khoản", "/about?tab=privacy"],
          ["Câu hỏi thường gặp", "/about?tab=faq"],
        ] as [string, string][],
      },
    ];
  } else if (role === "tenant") {
    columns = [
      {
        title: "Khám phá",
        items: [
          ["Tìm phòng", "/discover"],
          ["Ghép bạn ở", "/roommates"],
          ["Bản đồ phòng", "/map"],
          ["Cách hoạt động", "/about?tab=how"],
        ] as [string, string][],
      },
      {
        title: "Tiện ích của tôi",
        items: [
          ["Phòng của tôi", "/rentals/me"],
          ["Yêu cầu Đổi phòng", "/swap"],
          ["Điểm uy tín", "/trustscore"],
          ["Lượt ghép", "/matches"],
        ] as [string, string][],
      },
      {
        title: "Cá nhân & Hỗ trợ",
        items: [
          ["Cài đặt", "/settings"],
          ["Điều khoản & Bảo mật", "/about?tab=privacy"],
          ["Câu hỏi thường gặp", "/about?tab=faq"],
        ] as [string, string][],
      },
    ];
  }


  return (
    <footer className="relative mt-24 border-t border-slate-900/5 bg-mint/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-brand text-mint">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16 6l8 6v12h-5v-7h-6v7H8V12l8-6z" />
              </svg>
            </span>
            <span className="font-display text-xl font-semibold text-emerald-deep">
              Phòng Trọ Xanh
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm italic text-slate-soft">
            Tìm trọ đúng — Ở đúng người.
          </p>
          <p className="mt-4 text-sm text-slate-soft">
            Nền tảng tìm phòng & ghép bạn ở ghép cho sinh viên và người đi làm trẻ tại TP.HCM.
          </p>
        </div>

        {columns.map((col, idx) => (
          <FooterCol key={idx} title={col.title} items={col.items} />
        ))}
      </div>
      <div className="border-t border-slate-900/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-slate-soft sm:flex-row sm:px-8">
          <span>© 2026 Phòng Trọ Xanh. Made in Vietnam 🇻🇳</span>
          <span className="font-semibold text-emerald-brand">
            Tìm trọ đúng — Ở đúng người
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-charcoal">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {items.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-slate-soft transition-colors hover:text-emerald-brand">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

