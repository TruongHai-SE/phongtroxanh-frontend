import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Lock,
  UserCog,
  Trash2,
  ChevronLeft,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/lib/api";
import { accountApi } from "../api/accountApi";
import { authApi } from "@/features/auth/api/authApi";

const sections = [
  { id: "noti", label: "Thông báo", icon: Bell },
  { id: "privacy", label: "Quyền riêng tư", icon: Lock },
  { id: "account", label: "Tài khoản & Mật khẩu", icon: UserCog },
];

const notificationsByRole: Record<
  string,
  { key: string; label: string; desc: string; defaultOn: boolean }[]
> = {
  tenant: [
    {
      key: "match_new",
      label: "Lượt ghép bạn mới",
      desc: "Thông báo khi có bạn cùng phòng tương hợp 2 chiều với bạn",
      defaultOn: true,
    },
    {
      key: "chat_msg",
      label: "Tin nhắn mới",
      desc: "Thông báo khi chủ trọ hoặc bạn cùng phòng nhắn tin",
      defaultOn: true,
    },
    {
      key: "rental_status",
      label: "Cập nhật lịch hẹn & Hợp đồng",
      desc: "Thông báo khi chủ trọ duyệt lịch hẹn xem phòng hoặc bàn giao phòng",
      defaultOn: true,
    },
    {
      key: "room_recommend",
      label: "Phòng phù hợp mới",
      desc: "Gợi ý khi có phòng mới đăng hoặc đẩy tin khớp với khu vực và ngân sách của bạn",
      defaultOn: true,
    },
  ],
  landlord: [
    {
      key: "rental_request",
      label: "Yêu cầu xem & thuê phòng mới",
      desc: "Thông báo ngay khi khách gửi đơn hẹn xem phòng",
      defaultOn: true,
    },
    {
      key: "chat_msg",
      label: "Tin nhắn từ khách thuê",
      desc: "Thông báo khi có khách nhắn tin hỏi thông tin phòng",
      defaultOn: true,
    },
    {
      key: "review_new",
      label: "Đánh giá mới từ khách thuê",
      desc: "Thông báo khi khách thuê viết nhận xét về phòng của bạn",
      defaultOn: true,
    },
  ],
  admin: [
    {
      key: "report_new",
      label: "Báo cáo vi phạm mới",
      desc: "Thông báo khi người dùng gửi báo cáo phòng hoặc tài khoản vi phạm",
      defaultOn: true,
    },
    {
      key: "kyc_queue",
      label: "Hồ sơ CCCD chờ duyệt",
      desc: "Thông báo khi có người dùng nộp ảnh xác thực Căn cước mới",
      defaultOn: true,
    },
  ],
};

function NotificationSection({ role }: { role: string | null }) {
  const roleKey = role || "tenant";
  const storageKey = `ptx_notification_prefs_${roleKey}`;
  const items = notificationsByRole[roleKey] || notificationsByRole.tenant;

  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    items.forEach((i) => {
      defaults[i.key] = i.defaultOn;
    });
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return defaults;
  });

  const handleToggle = (key: string, val: boolean) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
    toast.success("Đã lưu tùy chọn thông báo");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Tùy chọn thông báo</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Chọn các loại thông báo bạn muốn nhận trên thanh công cụ
        </p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-xl bg-secondary/40 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <Switch
              checked={Boolean(prefs[item.key])}
              onCheckedChange={(v) => handleToggle(item.key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacySection({ role }: { role: string | null }) {
  const [isPublic, setIsPublic] = useState(true);
  const [showSchool, setShowSchool] = useState(true);
  const [hideActiveStatus, setHideActiveStatus] = useState(false);

  useEffect(() => {
    api
      .get<any>("/users/me/settings")
      .then((data) => {
        if (data) {
          if (data.isPublic !== undefined) setIsPublic(data.isPublic);
          if (data.showSchool !== undefined) setShowSchool(data.showSchool);
          if (data.hideActiveStatus !== undefined)
            setHideActiveStatus(data.hideActiveStatus);
        }
      })
      .catch(() => {});
  }, []);

  const updateSetting = async (key: string, val: boolean) => {
    const updated = {
      isPublic: key === "isPublic" ? val : isPublic,
      showSchool: key === "showSchool" ? val : showSchool,
      hideActiveStatus: key === "hideActiveStatus" ? val : hideActiveStatus,
    };
    if (key === "isPublic") setIsPublic(val);
    if (key === "showSchool") setShowSchool(val);
    if (key === "hideActiveStatus") setHideActiveStatus(val);

    try {
      await api.put("/users/me/settings", updated);
      toast.success("Đã cập nhật cài đặt quyền riêng tư");
    } catch {
      toast.error("Không thể lưu cài đặt quyền riêng tư");
    }
  };

  if (role === "admin") {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Quyền riêng tư</h2>
        <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
          <span className="text-sm">Ẩn trạng thái hoạt động</span>
          <Switch
            checked={hideActiveStatus}
            onCheckedChange={(v) => updateSetting("hideActiveStatus", v)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Tài khoản quản trị không hiển thị hồ sơ công khai.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Quyền riêng tư</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kiểm soát thông tin cá nhân hiển thị với người dùng khác trên hệ thống
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/40 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Hiển thị hồ sơ công khai</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cho phép hồ sơ của bạn xuất hiện trên trang Ghép bạn ở ghép
            </p>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={(v) => updateSetting("isPublic", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/40 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Cho phép người khác xem trường học / nơi làm việc
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hiển thị trường ĐH hoặc công ty trên thẻ hồ sơ công khai của bạn
            </p>
          </div>
          <Switch
            checked={showSchool}
            onCheckedChange={(v) => updateSetting("showSchool", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary/40 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Ẩn trạng thái hoạt động</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Không hiển thị thời điểm truy cập gần nhất của bạn với người khác
            </p>
          </div>
          <Switch
            checked={hideActiveStatus}
            onCheckedChange={(v) => updateSetting("hideActiveStatus", v)}
          />
        </div>
      </div>
    </div>
  );
}

function AccountSection({ navigate }: { navigate: (path: string) => void }) {
  const { user, logout, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Delete account states
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get<any>("/users/me")
      .then((u) => {
        if (u) {
          if (u.fullName) setFullName(u.fullName);
          if (u.email) setEmail(u.email);
          if (u.phoneNumber) setPhone(u.phoneNumber);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveBasicInfo = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Họ và tên phải có ít nhất 2 ký tự");
      return;
    }
    setSavingProfile(true);
    try {
      await accountApi.updateProfile({ fullName: fullName.trim() });
      await refreshProfile?.();
      toast.success("Đã cập nhật họ tên tài khoản");
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật thông tin");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới nhập lại không khớp");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    setChangingPw(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đổi mật khẩu thành công!");
    } catch (err: any) {
      toast.error(err?.message || "Mật khẩu hiện tại không đúng hoặc không thể đổi mật khẩu");
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/users/me");
      toast.success("Tài khoản của bạn đã được xóa thành công");
      logout();
      navigate("/");
    } catch (err: any) {
      toast.error(
        err?.message ||
          "Không thể xóa tài khoản. Vui lòng kiểm tra hợp đồng còn hiệu lực."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* 1. Basic Account Info */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Thông tin tài khoản</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý tên hiển thị và thông tin đăng nhập của bạn
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="settings-fullname">Họ và tên hiển thị</Label>
            <div className="flex gap-2">
              <Input
                id="settings-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="max-w-xs"
              />
              <Button
                type="button"
                onClick={handleSaveBasicInfo}
                disabled={savingProfile}
                className="gap-1.5 cursor-pointer"
              >
                {savingProfile ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Lưu tên
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email đăng nhập</Label>
            <Input value={email || "Chưa cập nhật"} disabled className="bg-slate-50" />
          </div>

          <div className="space-y-1.5">
            <Label>Số điện thoại</Label>
            <Input value={phone || "Chưa cập nhật"} disabled className="bg-slate-50" />
          </div>
        </div>
      </div>

      {/* 2. Change Password Section */}
      <form
        onSubmit={handleChangePassword}
        className="space-y-4 border-t border-border pt-6"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Đổi mật khẩu</h3>
        </div>

        <div className="grid gap-3.5 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrentPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang dùng"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Hiện hoặc ẩn mật khẩu"
              >
                {showCurrentPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pw">Mật khẩu mới (tối thiểu 6 ký tự)</Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Hiện hoặc ẩn mật khẩu mới"
              >
                {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Nhập lại mật khẩu mới</Label>
            <Input
              id="confirm-pw"
              type={showNewPw ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận lại mật khẩu mới"
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={changingPw}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {changingPw && <Loader2 className="size-4 animate-spin" />}
              Cập nhật mật khẩu mới
            </Button>
          </div>
        </div>
      </form>

      {/* 3. Danger Zone */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <h3 className="font-medium text-destructive">Vùng nguy hiểm</h3>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Xóa tài khoản sẽ gỡ bỏ vĩnh viễn toàn bộ dữ liệu của bạn sau khi kiểm tra không còn hợp đồng thuê đang hiệu lực.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="mt-3 gap-2 cursor-pointer">
              <Trash2 className="size-4" /> Xóa tài khoản
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa tài khoản vĩnh viễn?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác. Nhập <b>XÓA</b> để xác nhận.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="Nhập XÓA"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirmDelete !== "XÓA" || deleting}
                onClick={handleDeleteAccount}
                className="bg-destructive text-white hover:bg-destructive/90 gap-1.5"
              >
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Xóa tài khoản
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [active, setActive] = useState("noti");
  const prevActive = useRef(active);
  const [fading, setFading] = useState(false);
  const [displayed, setDisplayed] = useState(active);

  const handleSwitch = (id: string) => {
    if (id === active) return;
    prevActive.current = active;
    setFading(true);
    setTimeout(() => {
      setDisplayed(id);
      setActive(id);
      setFading(false);
    }, 120);
  };

  const backPath =
    role === "landlord" ? "/landlord" : role === "admin" ? "/admin" : null;
  const backLabel =
    role === "landlord"
      ? "Bảng quản lý"
      : role === "admin"
      ? "Bảng quản trị"
      : null;

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-5xl">
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            {backLabel}
          </button>
        )}

        <h1 className="brand text-2xl text-foreground mb-6">Cài đặt</h1>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 w-full items-start">
          <nav data-tour="settings-sidebar" className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSwitch(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors cursor-pointer",
                  active === s.id
                    ? "bg-mint text-primary font-semibold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <s.icon className="size-4 shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>

          <div
            data-tour="settings-content"
            className="rounded-2xl bg-card ring-1 ring-border min-h-[520px]"
          >
            <div
              className="p-6 transition-opacity duration-[120ms]"
              style={{ opacity: fading ? 0 : 1 }}
            >
              {displayed === "noti" && <NotificationSection role={role} />}
              {displayed === "privacy" && <PrivacySection role={role} />}
              {displayed === "account" && <AccountSection navigate={navigate} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
