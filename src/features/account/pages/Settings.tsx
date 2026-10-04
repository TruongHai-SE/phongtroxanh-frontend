import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Lock, UserCog, Trash2, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/lib/api";

const sections = [
  { id: "noti", label: "Thông báo", icon: Bell },
  { id: "privacy", label: "Quyền riêng tư", icon: Lock },
  { id: "account", label: "Tài khoản", icon: UserCog },
];

const notificationsByRole: Record<string, { label: string; defaultOn: boolean }[]> = {
  tenant: [
    { label: "Lượt ghép mới", defaultOn: true },
    { label: "Tin nhắn", defaultOn: true },
    { label: "Phòng phù hợp mới", defaultOn: true },
    { label: "Cập nhật khuyến mãi", defaultOn: false },
  ],
  landlord: [
    { label: "Yêu cầu thuê phòng mới", defaultOn: true },
    { label: "Tin nhắn từ khách thuê", defaultOn: true },
    { label: "Đánh giá từ khách thuê", defaultOn: true },
    { label: "Lượt xem phòng trọ", defaultOn: true },
    { label: "Cập nhật trạng thái phòng", defaultOn: false },
  ],
  admin: [
    { label: "Báo cáo vi phạm mới", defaultOn: true },
    { label: "CCCD chờ duyệt", defaultOn: true },
    { label: "Người dùng đăng ký mới", defaultOn: true },
    { label: "Cảnh báo hệ thống", defaultOn: true },
  ],
};

function NotificationSection({ role }: { role: string | null }) {
  const items = notificationsByRole[role || "tenant"] || notificationsByRole.tenant;
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">Thông báo</h2>
      {items.map((item) => (
        <ToggleRow key={item.label} label={item.label} defaultOn={item.defaultOn} />
      ))}
    </div>
  );
}

function PrivacySection({ role }: { role: string | null }) {
  const [isPublic, setIsPublic] = useState(true);
  const [showSchool, setShowSchool] = useState(true);
  const [hideActiveStatus, setHideActiveStatus] = useState(false);

  useEffect(() => {
    api.get<any>("/users/me/settings")
      .then((data) => {
        if (data) {
          if (data.isPublic !== undefined) setIsPublic(data.isPublic);
          if (data.showSchool !== undefined) setShowSchool(data.showSchool);
          if (data.hideActiveStatus !== undefined) setHideActiveStatus(data.hideActiveStatus);
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
      // optimistic
    }
  };

  if (role === "admin") {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Quyền riêng tư</h2>
        <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
          <span className="text-sm">Ẩn trạng thái hoạt động</span>
          <Switch checked={hideActiveStatus} onCheckedChange={(v) => updateSetting("hideActiveStatus", v)} />
        </div>
        <p className="text-sm text-muted-foreground">Tài khoản quản trị không có hồ sơ công khai.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">Quyền riêng tư</h2>
      <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
        <span className="text-sm">Hiển thị hồ sơ công khai</span>
        <Switch checked={isPublic} onCheckedChange={(v) => updateSetting("isPublic", v)} />
      </div>
      <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
        <span className="text-sm">Cho phép người khác xem trường/nơi làm</span>
        <Switch checked={showSchool} onCheckedChange={(v) => updateSetting("showSchool", v)} />
      </div>
      <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
        <span className="text-sm">Ẩn trạng thái hoạt động</span>
        <Switch checked={hideActiveStatus} onCheckedChange={(v) => updateSetting("hideActiveStatus", v)} />
      </div>
    </div>
  );
}

function AccountSection({ navigate }: { navigate: (path: string) => void }) {
  const { user, logout } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState(user?.email || "hoaian@email.com");
  const [phone, setPhone] = useState(user?.phone || "+84 912 345 678");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<any>("/users/me")
      .then((u) => {
        if (u) {
          if (u.email) setEmail(u.email);
          if (u.phoneNumber) setPhone(u.phoneNumber);
        }
      })
      .catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete("/users/me");
      toast.success("Tài khoản của bạn đã được xóa thành công");
      logout();
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa tài khoản. Vui lòng kiểm tra hợp đồng còn hiệu lực.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-foreground">Tài khoản</h2>
      <div className="space-y-2 max-w-xs">
        <Label>Số điện thoại</Label>
        <Input value={phone} disabled />
      </div>
      <div className="space-y-2 max-w-xs">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Button onClick={() => toast.success("Đã lưu thay đổi")}>Lưu thay đổi</Button>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 mt-4">
        <h3 className="font-medium text-destructive">Vùng nguy hiểm</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Xóa tài khoản sẽ gỡ bỏ vĩnh viễn toàn bộ dữ liệu của bạn sau khi kiểm tra không có hợp đồng thuê còn hiệu lực.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-3 gap-2">
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
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Nhập XÓA" />
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirm !== "XÓA" || deleting}
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

  // Cross-fade: fade out current, swap content, fade in new.
  // Since we swap to the NEW content in one render (no AnimatePresence),
  // the card layout NEVER sees two simultaneous children.
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

  const backPath = role === "landlord" ? "/landlord" : role === "admin" ? "/admin" : null;
  const backLabel = role === "landlord" ? "Bảng quản lý" : role === "admin" ? "Bảng quản trị" : null;

  return (
    /*
     * FINAL CLS FIX ARCHITECTURE:
     *
     * The shift was caused by AnimatePresence rendering two motion.div children
     * simultaneously during exit/enter transition. The second child had different
     * intrinsic width, temporarily changing the card's layout width, causing
     * the grid container to shift.
     *
     * Solution: No AnimatePresence. Instead, we fade-out → swap (single render)
     * → fade-in. The card ALWAYS contains exactly one child at a time.
     *
     * Additionally:
     *   - Outer div: w-full ensures the max-w-5xl container always fills its maximum
     *   - Grid: grid-cols-[200px_1fr] — fr unit is immune to content width
     *   - Panel: h-[520px] — fixed height, no page reflow from tab switches
     */
    <div className="w-full px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="size-4" />
            {backLabel}
          </button>
        )}

        <h1 className="brand text-2xl text-foreground mb-7">Cài đặt</h1>

        <div className="grid grid-cols-[200px_1fr] gap-6 w-full items-start">
          {/* Sidebar — always 200px, no flex influence */}
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSwitch(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active === s.id
                    ? "bg-mint text-primary font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <s.icon className="size-4 shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>

          {/* Content panel — fixed size, SINGLE child at all times */}
          <div className="rounded-2xl bg-card ring-1 ring-border h-[520px] overflow-y-auto overflow-x-hidden">
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

function ToggleRow({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultOn} />
    </div>
  );
}
