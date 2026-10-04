import { useNavigate, Link } from "react-router";
import {
  Search, Users, ShieldCheck, WifiOff, ServerCrash, Home, ShieldAlert,
  RotateCw, ArrowRight, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layouts/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AmenityPill } from "@/components/shared/primitives-compat";
import { getInitials } from "@/lib/utils";
import { useProfile } from "@/features/account/hooks/useProfile";

import { AboutPage } from "./AboutPage";
export { AboutPage as About };


/* ---------- Public profile (read-only) ---------- */
export function PublicProfile() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const name = profile?.fullName || "Người dùng Phong Trọ Xanh";
  const school = profile?.school || profile?.job || "Chưa cập nhật trường/nơi làm việc";
  const bio = profile?.bio || "Chưa cập nhật giới thiệu bản thân.";
  const interests = profile?.interests?.length ? profile.interests : ["Nấu ăn", "Đọc sách", "Du lịch"];

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-4 rounded-xl bg-secondary/50 p-3 text-center text-sm text-muted-foreground">
        👁️ Đây là cách hồ sơ của bạn hiển thị với người khác
      </div>
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="h-28 bg-gradient-to-r from-primary to-emerald-500 relative">
          <div className="absolute -bottom-8 left-6">
            <Avatar className="size-20 ring-4 ring-card shadow-sm">
              {profile?.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-xl">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="pt-10 p-6">
          <h1 className="brand flex items-center gap-2 text-2xl text-foreground">
            {name} {profile?.kycStatus === "APPROVED" && <ShieldCheck className="size-5 text-primary" />}
          </h1>
          <p className="inline-flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <GraduationCap className="size-4" /> {school}
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {interests.map((i) => <AmenityPill key={i} label={i} />)}
          </div>
        </div>
      </div>
      <Button variant="outline" className="mt-4 w-full" onClick={() => navigate("/profile")}>Quay lại hồ sơ</Button>
    </div>
  );
}

/* ---------- Error states ---------- */
function StatePage({ icon: Icon, title, desc, action }: { icon: any; title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-6">
      <div className="text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-mint text-primary"><Icon className="size-9" /></div>
        <h1 className="brand mt-5 text-2xl text-foreground">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{desc}</p>
        <div className="mt-6">{action}</div>
      </div>
    </div>
  );
}

export function OfflineError() {
  return <StatePage icon={WifiOff} title="Mất kết nối mạng" desc="Có vẻ bạn đang ngoại tuyến. Kiểm tra kết nối và thử lại."
    action={<Button className="gap-2" onClick={() => location.reload()}><RotateCw className="size-4" /> Thử lại</Button>} />;
}

export function ServerError() {
  return <StatePage icon={ServerCrash} title="Đã xảy ra lỗi" desc="Hệ thống đang gặp sự cố. Chúng tôi đang khắc phục, vui lòng thử lại sau."
    action={<div className="flex justify-center gap-2"><Button className="gap-2" onClick={() => location.reload()}><RotateCw className="size-4" /> Thử lại</Button><Button variant="outline">Liên hệ hỗ trợ</Button></div>} />;
}

export function AccessDenied() {
  const navigate = useNavigate();
  return <StatePage icon={ShieldAlert} title="Bạn không có quyền truy cập" desc="Khu vực này yêu cầu quyền đặc biệt. Vui lòng quay lại trang chính."
    action={<Button onClick={() => navigate("/discover")}>Về trang chủ</Button>} />;
}

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-mint/20 px-6">
      <div className="text-center">
        <p className="brand text-7xl text-primary">404</p>
        <h1 className="brand mt-2 text-2xl text-foreground">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-muted-foreground">Trang bạn tìm có thể đã bị xóa hoặc không tồn tại.</p>
        <Button className="mt-6 gap-2" onClick={() => navigate("/discover")}><Home className="size-4" /> Về trang chủ</Button>
        <p className="mt-4 text-sm"><Link to="/" className="text-primary hover:underline">Quay lại trang giới thiệu</Link></p>
      </div>
    </div>
  );
}
