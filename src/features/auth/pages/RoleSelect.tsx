import { useState } from "react";
import { useNavigate } from "react-router";
import { Home, KeyRound, Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "./Login";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/context/AuthContext";

export default function RoleSelect() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [role, setRole] = useState<"tenant" | "landlord" | null>("tenant");

  const cards = [
    { id: "tenant", icon: Home, title: "Người thuê", desc: "Tìm phòng trọ và bạn ở ghép phù hợp" },
    { id: "landlord", icon: KeyRound, title: "Chủ trọ", desc: "Đăng tin và quản lý phòng cho thuê" },
  ] as const;

  return (
    <AuthShell>
      <h1 className="brand text-2xl">Bạn là ai?</h1>
      <p className="mt-1 text-sm text-muted-foreground">Chọn vai trò để cá nhân hoá trải nghiệm</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setRole(c.id)}
            className={cn(
              "relative rounded-2xl border-2 p-5 text-left transition",
              role === c.id ? "border-primary bg-mint/50" : "border-border hover:border-primary/40",
            )}
          >
            {role === c.id && (
              <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
            <div className="grid size-12 place-items-center rounded-xl bg-mint text-primary">
              <c.icon className="size-6" />
            </div>
            <p className="mt-3">{c.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
          </button>
        ))}
      </div>
      <Button
        className="mt-6 w-full"
        disabled={!role}
        onClick={() => navigate(role === "landlord" ? "/onboarding/landlord" : "/onboarding")}
      >
        Tiếp tục
      </Button>

      <div className="mt-5 flex justify-center border-t border-border/50 pt-4">
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-red-600"
        >
          <LogOut className="size-3.5" />
          <span>Đăng xuất / Đổi tài khoản khác</span>
        </button>
      </div>
    </AuthShell>
  );
}
