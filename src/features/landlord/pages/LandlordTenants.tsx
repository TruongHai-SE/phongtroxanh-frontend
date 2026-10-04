import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MessageCircle, Star, ShieldCheck, Clock, Loader2, Users, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rentalsApi } from "@/features/rentals/api/rentalsApi";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface TenantItem {
  id: string;
  name: string;
  avatar: string;
  room: string;
  trust: number;
  verified: boolean;
  checkedIn: boolean;
  since: string;
  phone?: string;
}

export default function LandlordTenants() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTenants() {
      setIsLoading(true);
      try {
        const data = await rentalsApi.getMyLandlordRentals();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: TenantItem[] = data.map((r: any, idx: number) => ({
            id: r.id,
            name: r.tenantName || `Khách thuê #${idx + 1}`,
            avatar: r.tenantAvatar || "",
            room: r.roomTitle || r.roomAddress || "Phòng trọ",
            trust: r.tenantTrustScore ?? 50,
            verified: Boolean(r.tenantVerified),
            checkedIn: r.status === "CHECKED_IN",
            since: r.startDate
              ? new Date(r.startDate).toLocaleDateString("vi-VN")
              : "01/03/2026",
            phone: r.tenantPhone,
          }));
          setTenants(mapped);
        } else {
          setTenants([]);
        }
      } catch (err) {
        console.warn("Could not load /rentals/landlord/me:", err);
        setTenants([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadTenants();
  }, []);

  const checkedInCount = tenants.filter((t) => t.checkedIn).length;
  const avgTrust =
    tenants.length > 0
      ? Math.round(tenants.reduce((a, t) => a + t.trust, 0) / tenants.length)
      : 0;

  const handleConfirmHandover = async (rentalId: string) => {
    try {
      await rentalsApi.verifyCheckIn(rentalId, { checkInCode: "HANDOVER" });
      toast.success("Bàn giao phòng thành công! Đã cộng +10 TrustScore.");
      setTenants((prev) =>
        prev.map((t) => (t.id === rentalId ? { ...t, checkedIn: true } : t))
      );
    } catch (err: any) {
      toast.error(err.message || "Không thể xác nhận bàn giao phòng.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="brand text-2xl text-foreground flex items-center gap-2">
            Người thuê của tôi
          </h1>
          <p className="text-sm text-muted-foreground">
            {tenants.length} người thuê • {checkedInCount} đang ở thực tế
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <p className="text-sm text-muted-foreground">Đang thuê (Đã nhận phòng)</p>
          <p className="text-2xl font-bold text-foreground mt-1">{checkedInCount}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <p className="text-sm text-muted-foreground">TrustScore TB</p>
          <p className="text-2xl font-bold text-primary mt-1">{tenants.length > 0 ? avgTrust : "—"}</p>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <p className="text-sm text-muted-foreground">Đã xác minh CCCD</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {tenants.filter((t) => t.verified).length}/{tenants.length}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Đang tải danh sách người thuê từ hệ thống...</span>
        </div>
      ) : tenants.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card ring-1 ring-border border-dashed border-border">
          <Users className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-foreground">Chưa có người thuê nào</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Các hợp đồng thuê khi có khách thuê nhận phòng sẽ hiển thị đầy đủ tại đây.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Người thuê</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>TrustScore</TableHead>
                <TableHead>Thuê từ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 ring-1 ring-border">
                        <AvatarImage src={t.avatar || undefined} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          {getInitials(t.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        {t.verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                            <ShieldCheck className="size-3" /> Đã xác minh CCCD
                          </span>
                        )}
                        {t.phone && (
                          <p className="text-xs text-muted-foreground">{t.phone}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{t.room}</TableCell>
                  <TableCell>
                    {t.checkedIn ? (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-800 border-emerald-200">
                        <Clock className="size-3" /> Đang thuê
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        Chờ bàn giao
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" /> {t.trust}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.since}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {!t.checkedIn && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmHandover(t.id)}
                          className="text-xs font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Bàn giao phòng
                        </Button>
                      )}
                      {t.checkedIn && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate("/landlord?tab=reviews")}
                          className="text-xs font-semibold cursor-pointer"
                        >
                          Đánh giá
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate("/landlord?tab=chat")}
                        className="cursor-pointer"
                      >
                        <MessageCircle className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
