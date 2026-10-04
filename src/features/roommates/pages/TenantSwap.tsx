import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { 
  ArrowLeftRight, Send, Clock, CheckCircle2, AlertTriangle, 
  MessageCircle, Home, Search, Sparkles,
  Calendar, Check, User, Info, FileText, ShieldCheck, X, ArrowRight, Plus, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { districts, roomTypes } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";
import { api } from "@/lib/api";
import { rentalsApi } from "@/features/rentals/api/rentalsApi";
import { roomsApi } from "@/features/rooms/api/roomsApi";
import type { RentalResponse } from "@/features/rentals/types/rental.types";

const HABIT_OPTIONS = [
  "Ngủ sớm (trước 23h)",
  "Sạch sẽ, gọn gàng",
  "Không hút thuốc",
  "Không nuôi thú cưng",
  "Giờ tự do",
  "Không tụ tập bạn bè",
  "Ít tiếng ồn"
];

export default function TenantSwap() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("explore");
  const [isLeaseholder, setIsLeaseholder] = useState(true);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [currentRoomSelect, setCurrentRoomSelect] = useState("");
  const [targetDistrict, setTargetDistrict] = useState("Quận 10");
  const [targetRoomType, setTargetRoomType] = useState("Studio");
  const [budgetLimit, setBudgetLimit] = useState("4000000");
  const [timelineDate, setTimelineDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [swapReason, setSwapReason] = useState("");
  
  type MyRequestItem = {
    id: string;
    roomTitle: string;
    status: "matching" | "pending_landlord" | "completed";
    date: string;
    isLeaseholder: boolean;
    targetNeeds: { district: string; budget: string; type: string };
    match: any;
  };

  const [myRequests, setMyRequests] = useState<MyRequestItem[]>([]);
  const [swapPosts, setSwapPosts] = useState<any[]>([]);
  const [userRentals, setUserRentals] = useState<RentalResponse[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterDistrict, setFilterDistrict] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load active rentals of the logged-in tenant
      const rentals = await rentalsApi.getMyTenantRentals();
      if (Array.isArray(rentals) && rentals.length > 0) {
        setUserRentals(rentals);
        const active = rentals.find(r => r.status === "CHECKED_IN" || r.status === "PENDING_CHECKIN") || rentals[0];
        if (active) {
          setCurrentRoomSelect(String(active.roomId));
        }
      }
    } catch (err) {
      console.warn("Could not load user rentals:", err);
    }

    try {
      // 2. Load platform rooms to enable selecting from existing system listings
      const roomsRes = await roomsApi.getRooms({ limit: 50 });
      const roomList = (roomsRes?.content || []) as any[];
      setAllRooms(roomList);
      if (roomList.length > 0) {
        setCurrentRoomSelect((prev) => prev || String(roomList[0].id));
      }
    } catch (err) {
      console.warn("Could not load platform rooms:", err);
    }

    try {
      // 2. Load public swap feed
      const data = await api.get<any>("/swaps");
      const list = Array.isArray(data) ? data : data?.content;
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((item: any, i: number) => ({
          id: String(item.id || `swap-${i + 1}`),
          userId: item.userId || item.requesterId,
          user: {
            name: item.authorName || item.user?.name || "Người thuê trọ",
            avatar: item.authorAvatar || "",
            school: item.authorSchool || item.schoolOrCompany || "Đang thuê phòng",
          },
          currentRoom: {
            title: item.currentRoomTitle || item.title || "Phòng trọ đang cần pass",
            image: item.currentRoomImages?.[0] || item.roomImages?.[0] || "",
            district: item.currentRoomDistrict || "Chưa cập nhật",
            area: item.currentRoomArea || 0,
            rent: item.currentRoomPrice != null ? Number(item.currentRoomPrice) : 0,
            amenities: item.amenities || [],
          },
          targetNeeds: {
            districts: Array.isArray(item.targetDistricts) && item.targetDistricts.length > 0 
              ? item.targetDistricts 
              : (item.desiredDistricts || ["Linh hoạt"]),
            budgetMax: item.targetBudgetMax ? Number(item.targetBudgetMax) : 0,
            roomType: item.targetRoomType || "Tùy chọn",
          },
          habits: item.habits || [],
          reason: item.description || item.reason || "",
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "",
        }));
        setSwapPosts(mapped);
      } else {
        setSwapPosts([]);
      }
    } catch (err) {
      console.warn("Could not load /swaps feed:", err);
      setSwapPosts([]);
    }

    try {
      // 3. Load my own swap requests
      const myData = await api.get<any>("/swaps/me");
      const myList = Array.isArray(myData) ? myData : myData?.content;
      if (Array.isArray(myList) && myList.length > 0) {
        setMyRequests(
          myList.map((r: any, idx: number) => ({
            id: String(r.id || `my-${idx + 1}`),
            roomTitle: r.title || "Yêu cầu hoán đổi phòng của tôi",
            status: (r.status?.toLowerCase() === "approved" || r.status?.toLowerCase() === "completed"
              ? "completed"
              : r.status?.toLowerCase() === "pending_landlord"
              ? "pending_landlord"
              : "matching") as "matching" | "pending_landlord" | "completed",
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "Hôm nay",
            isLeaseholder: Boolean(r.isLeaseholder),
            targetNeeds: {
              district: r.targetDistricts?.[0] || "Quận 10",
              budget: r.targetBudgetMax ? `${(Number(r.targetBudgetMax) / 1e6).toFixed(1)}M` : "Thỏa thuận",
              type: r.targetRoomType || "Phòng trọ",
            },
            match: null,
          }))
        );
      } else {
        setMyRequests([]);
      }
    } catch (err) {
      console.warn("Could not load /swaps/me:", err);
      setMyRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleHabit = (h: string) => {
    setSelectedHabits(prev => 
      prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]
    );
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapReason.trim()) {
      toast.error("Vui lòng nhập lý do và mô tả nhu cầu hoán đổi phòng.");
      return;
    }

    if (!currentRoomSelect) {
      toast.error("Vui lòng chọn phòng trọ bạn đang thuê để làm căn cứ chuyển nhượng.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedRental = userRentals.find(r => String(r.roomId) === currentRoomSelect);
      const payload = {
        title: `Hoán đổi / Pass phòng: ${targetRoomType} tại ${targetDistrict}`,
        description: swapReason.trim(),
        currentRoomId: currentRoomSelect,
        isLeaseholder,
        targetDistricts: [targetDistrict],
        desiredDistricts: [targetDistrict],
        targetRoomType,
        targetBudgetMax: Number(budgetLimit) || 4000000,
        desiredPriceMax: Number(budgetLimit) || 4000000,
        habits: selectedHabits,
        reason: swapReason.trim(),
        targetMoveInDate: timelineDate,
        moveInDate: timelineDate,
      };

      await api.post("/swaps", payload);
      toast.success("Đăng tin hoán đổi phòng thành công! Hệ thống đang quét ghép đôi tự động.");
      setSwapReason("");
      setSelectedHabits([]);
      await loadData();
      setTab("status");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể đăng tin hoán đổi. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPosts = swapPosts.filter(post => {
    const matchesSearch = 
      post.currentRoom.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = filterDistrict === "Tất cả" || post.currentRoom.district === filterDistrict;
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      
      {/* Premium minimal header */}
      <div className="border-b border-border pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="brand text-2xl text-foreground flex items-center gap-2 font-bold tracking-tight">
              <ArrowLeftRight className="size-6 text-primary" /> Hoán đổi phòng thuê
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Giải pháp chuyển nhượng hợp đồng thuê phòng minh bạch, bảo toàn cọc và tìm người thay thế nhanh chóng.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tab !== "create" && (
              <Button 
                onClick={() => setTab("create")} 
                size="sm" 
                className="gap-1.5 text-xs h-9 font-medium"
              >
                <Plus className="size-3.5" /> Đăng tin swap mới
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="mt-5 flex border-b border-border gap-2">
        {[
          { id: "explore", label: `Khám phá tin (${swapPosts.length})` },
          { id: "create", label: "Đăng tin swap" },
          { id: "status", label: `Yêu cầu của tôi (${myRequests.length})` }
        ].map((t) => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "pb-3 px-4 text-xs font-semibold transition-all relative",
              tab === t.id 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main layout grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_310px] items-start">
        
        {/* Left Side Content Area */}
        <div className="space-y-4">

          {/* TAB 1: DISCOVER/EXPLORE FEED */}
          {tab === "explore" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Search & Filter Bar */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-card p-3 rounded-2xl border border-border shadow-xs">
                <Search className="size-4 text-muted-foreground ml-1 shrink-0" />
                <Input 
                  type="text"
                  placeholder="Tìm khu vực, tên người thuê, tiêu đề..."
                  className="h-9 border-none bg-transparent px-2 focus-visible:ring-0 text-xs shadow-none flex-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                  <SelectTrigger className="w-[140px] h-9 text-xs shrink-0">
                    <SelectValue placeholder="Khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tất cả">Tất cả quận</SelectItem>
                    {districts.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Feed Items */}
              <div className="space-y-3">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="group flex flex-col md:flex-row items-start md:items-center justify-between rounded-2xl bg-card p-4 sm:p-5 border border-border hover:border-primary/40 hover:shadow-sm transition-all gap-4"
                    >
                      {/* Left: User and Current Room */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar className="size-11 ring-2 ring-border shrink-0">
                          <AvatarImage src={post.user.avatar || undefined} alt="avatar" className="object-cover" />
                          <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-bold">
                            {getInitials(post.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-foreground truncate">{post.user.name}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{post.user.school}</p>
                          <p className="text-xs font-medium text-foreground mt-1 truncate">
                            📍 {post.currentRoom.title} ({post.currentRoom.district})
                          </p>
                          {(post.currentRoomId || (post as any).currentRoom?.id) && (
                            <Link
                              to={`/rooms/${post.currentRoomId || (post as any).currentRoom?.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Xem chi tiết phòng <ExternalLink className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Middle: Swap Target & Cost */}
                      <div className="flex items-center gap-3 text-xs bg-secondary/35 px-3.5 py-2.5 rounded-xl border border-border/40 shrink-0">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-medium">Đang ở</span>
                          <span className="font-bold text-foreground">
                            {post.currentRoom.rent > 0 ? `${(post.currentRoom.rent/1e6).toFixed(1)}Mđ` : "Thỏa thuận"}
                          </span>
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground/80 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-medium">Đổi sang</span>
                          <span className="font-bold text-primary">
                            {post.targetNeeds.roomType} • {post.targetNeeds.districts[0] || "Linh hoạt"} {post.targetNeeds.budgetMax > 0 ? `(≤${(post.targetNeeds.budgetMax/1e6).toFixed(1)}M)` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        <Button 
                          onClick={() => setSelectedPost(post)}
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs flex-1 md:flex-initial"
                        >
                          Chi tiết
                        </Button>
                        <Button 
                          onClick={() => {
                            if (post.userId) {
                              navigate(`/chat?partnerId=${post.userId}`);
                            } else {
                              navigate("/chat");
                            }
                          }}
                          size="sm" 
                          className="h-8 text-xs gap-1.5 flex-1 md:flex-initial"
                        >
                          <MessageCircle className="size-3.5" /> Trao đổi
                        </Button>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center space-y-3">
                    <div className="mx-auto size-12 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground">
                      <Search className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-foreground">Chưa có bài đăng hoán đổi nào</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Hãy là người đầu tiên đăng tin hoán đổi phòng hoặc điều chỉnh bộ lọc tìm kiếm để xem kết quả.
                      </p>
                    </div>
                    <Button onClick={() => setTab("create")} size="sm" className="gap-1.5 text-xs mt-2">
                      <Plus className="size-3.5" /> Đăng tin swap ngay
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE SWAP REQUEST */}
          {tab === "create" && (
            <form onSubmit={handleCreateRequest} className="space-y-4 animate-in fade-in duration-150">
              
              {userRentals.length === 0 && (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs text-amber-900 flex items-start gap-3">
                  <Info className="size-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-950">Lưu ý về hợp đồng thuê phòng</p>
                    <p className="text-amber-800 leading-relaxed">
                      Để hệ thống bảo vệ quyền lợi tiền cọc và xác thực chuyển nhượng với chủ trọ, bạn cần có hợp đồng thuê phòng đang hoạt động. Bạn vẫn có thể nhập thông tin phòng để tìm kiếm trước.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-card p-5 sm:p-6 border border-border shadow-xs space-y-5">
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="room-select" className="text-xs font-semibold">Phòng hiện tại của bạn</Label>
                    <Select value={currentRoomSelect} onValueChange={setCurrentRoomSelect}>
                      <SelectTrigger id="room-select" className="h-9 text-xs">
                        <SelectValue placeholder="Chọn phòng của bạn trên hệ thống" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRentals.length > 0 && (
                          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                            Hợp đồng thuê đang hiệu lực của bạn
                          </div>
                        )}
                        {userRentals.map(r => (
                          <SelectItem key={String(r.roomId)} value={String(r.roomId)}>
                            {r.roomTitle || r.roomAddress || "Phòng trọ đang thuê"} {r.monthlyRent ? `(${(Number(r.monthlyRent)/1e6).toFixed(1)}Mđ)` : ""}
                          </SelectItem>
                        ))}
                        {allRooms.length > 0 && (
                          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase border-t border-border mt-1">
                            Phòng trọ trên hệ thống
                          </div>
                        )}
                        {allRooms.map((r: any) => (
                          <SelectItem key={String(r.id)} value={String(r.id)}>
                            {r.title} ({r.district}) {r.price ? ` - ${(Number(r.price)/1e6).toFixed(1)}M` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentRoomSelect && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span className="truncate">Đã liên kết dữ liệu phòng trọ</span>
                        <Link 
                          to={`/rooms/${currentRoomSelect}`} 
                          target="_blank" 
                          className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
                        >
                          Xem chi tiết phòng <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Vai trò trên hợp đồng</Label>
                    <div className="grid grid-cols-2 gap-2 h-9">
                      <button 
                        type="button"
                        onClick={() => setIsLeaseholder(true)}
                        className={cn(
                          "rounded-lg border text-xs font-semibold transition",
                          isLeaseholder 
                            ? "border-primary bg-mint/20 text-primary shadow-xs" 
                            : "border-border text-muted-foreground hover:bg-secondary/40"
                        )}
                      >
                        Đứng tên chính
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsLeaseholder(false)}
                        className={cn(
                          "rounded-lg border text-xs font-semibold transition",
                          !isLeaseholder 
                            ? "border-primary bg-mint/20 text-primary shadow-xs" 
                            : "border-border text-muted-foreground hover:bg-secondary/40"
                        )}
                      >
                        Thành viên ở ghép
                      </button>
                    </div>
                  </div>
                </div>

                {!isLeaseholder && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-xs text-sky-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div>
                      <p className="font-semibold flex items-center gap-1.5">
                        <Info className="size-3.5 text-sky-600 shrink-0" />
                        Bạn là thành viên ở ghép muốn tìm người ở thay (Pass slot)?
                      </p>
                      <p className="mt-0.5 text-sky-700 text-[11px] leading-relaxed">
                        Thành viên ở ghép không cần hủy hợp đồng chính với chủ trọ. Bạn có thể sang mục <strong>Ghép bạn</strong> để tìm người vào ở thế chỗ bạn nhanh chóng.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/roommates")}
                      className="shrink-0 text-xs h-7 border-sky-300 text-sky-700 bg-white hover:bg-sky-100"
                    >
                      Sang mục Ghép bạn
                    </Button>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="target-district" className="text-xs font-semibold">Khu vực cần đổi sang</Label>
                    <Select value={targetDistrict} onValueChange={setTargetDistrict}>
                      <SelectTrigger id="target-district" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="target-roomtype" className="text-xs font-semibold">Loại phòng</Label>
                    <Select value={targetRoomType} onValueChange={setTargetRoomType}>
                      <SelectTrigger id="target-roomtype" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="budget" className="text-xs font-semibold">Ngân sách tối đa (VNĐ)</Label>
                    <Input 
                      id="budget" 
                      type="number" 
                      value={budgetLimit} 
                      onChange={(e) => setBudgetLimit(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="timeline" className="text-xs font-semibold">Ngày dự kiến chuyển</Label>
                    <DatePicker 
                      value={timelineDate} 
                      onChange={setTimelineDate} 
                      minDate={new Date()} 
                      placeholder="dd/mm/yyyy" 
                    />
                  </div>
                </div>

                {/* Habits Selecting */}
                <div className="space-y-2 pt-1">
                  <Label className="text-xs font-semibold">Thói quen người mới cần có</Label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_OPTIONS.map((h) => {
                      const active = selectedHabits.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHabit(h)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs transition-all",
                            active 
                              ? "border-primary bg-mint text-primary font-semibold shadow-xs" 
                              : "border-border text-muted-foreground hover:border-primary/40 bg-card hover:bg-secondary/40"
                          )}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reason" className="text-xs font-semibold">Lý do & mô tả phòng hiện tại</Label>
                  <Textarea 
                    id="reason"
                    placeholder="Mô tả ưu nhược điểm của phòng hiện tại, lý do muốn đổi (gần trường, gần chỗ làm...) và các đồ đạc để lại..." 
                    rows={4} 
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    className="text-xs resize-none"
                  />
                </div>

              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-11 text-xs font-bold gap-2 shadow-xs"
              >
                <ArrowLeftRight className="size-4" /> 
                {isSubmitting ? "Đang xử lý đăng tin..." : "Đăng tin hoán đổi phòng"}
              </Button>
            </form>
          )}

          {/* TAB 3: USER REQUESTS & ACTIVE STATUS */}
          {tab === "status" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {myRequests.length > 0 ? (
                myRequests.map((req) => (
                  <div key={req.id} className="rounded-2xl bg-card p-5 sm:p-6 border border-border shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-3.5">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{req.roomTitle}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Khởi tạo: {req.date} • {req.isLeaseholder ? "Đứng tên hợp đồng" : "Thành viên ở ghép"}
                        </p>
                      </div>
                      <Badge className={cn(
                        "text-[10px] font-semibold px-2.5 py-0.5 border-none",
                        req.status === "completed" 
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "pending_landlord"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      )}>
                        {req.status === "completed" 
                          ? "Đã hoàn tất hoán đổi" 
                          : req.status === "pending_landlord" 
                          ? "Chờ chủ trọ duyệt" 
                          : "Đang tự động khớp nhu cầu"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-secondary/30 p-3.5 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Khu vực muốn đổi</span>
                        <span className="font-bold text-foreground mt-0.5 block">{req.targetNeeds.district}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Loại phòng</span>
                        <span className="font-bold text-foreground mt-0.5 block">{req.targetNeeds.type}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Ngân sách tối đa</span>
                        <span className="font-bold text-primary mt-0.5 block">{req.targetNeeds.budget}</span>
                      </div>
                    </div>

                    {/* Flow tracker */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between px-2 py-2 relative">
                        <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-border -translate-y-1/2 z-0" />
                        {[
                          { step: 1, label: "Đăng tin", done: true },
                          { step: 2, label: "Khớp nhu cầu", done: req.status !== "matching" },
                          { step: 3, label: "Thương lượng", done: req.status === "pending_landlord" || req.status === "completed" },
                          { step: 4, label: "Chủ trọ ký duyệt", done: req.status === "completed" }
                        ].map((s) => (
                          <div key={s.step} className="relative z-10 flex flex-col items-center">
                            <div className={cn(
                              "size-7 rounded-full grid place-items-center text-xs font-bold border-2 bg-card transition-all",
                              s.done ? "border-primary bg-primary text-white shadow-xs" : "border-border text-muted-foreground"
                            )}>
                              {s.done ? "✓" : s.step}
                            </div>
                            <span className="text-[10px] font-medium mt-1.5 text-muted-foreground">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Rich Empty State for Tab 3 - Eliminates Empty Left Side */
                <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 sm:p-10 text-center space-y-5 shadow-xs">
                  <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <ArrowLeftRight className="size-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="font-bold text-base text-foreground">Bạn chưa có yêu cầu hoán đổi nào</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Bạn muốn chuyển phòng sớm mà không mất cọc? Hãy đăng yêu cầu để tìm người thuê phù hợp nhận chuyển nhượng hợp đồng một cách an toàn và tiện lợi.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <Button 
                      onClick={() => setTab("create")} 
                      size="sm" 
                      className="gap-2 text-xs font-semibold shadow-xs h-9 px-4"
                    >
                      <Plus className="size-4" /> Tạo tin hoán đổi ngay
                    </Button>
                    <Button 
                      onClick={() => setTab("explore")} 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-xs h-9 px-4"
                    >
                      <Search className="size-3.5" /> Khám phá tin swap
                    </Button>
                  </div>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-6 border-t border-border">
                    <div className="p-3.5 rounded-xl bg-secondary/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <ShieldCheck className="size-4 text-emerald-600 shrink-0" /> Bảo toàn tiền cọc
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Người thuê mới nhận phòng và hoàn lại tiền cọc hợp đồng minh bạch, không mất tiền phạt.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-secondary/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Sparkles className="size-4 text-blue-600 shrink-0" /> Khớp chéo thông minh
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Hệ thống tự động so khớp phòng có vị trí và ngân sách tương thích trong bán kính yêu cầu.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-secondary/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <CheckCircle2 className="size-4 text-primary shrink-0" /> Chủ trọ đồng thuận
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Hợp đồng điện tử được chuyển giao có sự xác nhận chính thức từ chủ trọ trực tiếp trên web.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side Sticky Sidebar Widget */}
        <div className="space-y-4 sticky top-24">
          <div className="rounded-2xl bg-mint/10 p-5 border border-primary/20 space-y-3.5">
            <h3 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Home className="size-4 text-primary" /> Hướng dẫn hoán đổi phòng
            </h3>
            <ul className="space-y-2 text-[11px] text-muted-foreground list-decimal pl-4">
              <li className="leading-relaxed">Đăng tin với đầy đủ tiêu chí ngân sách và khu vực bạn cần chuyển.</li>
              <li className="leading-relaxed">Hệ thống tự động so khớp tiêu chí phòng giữa các người thuê trọ.</li>
              <li className="leading-relaxed">Hai bên trao đổi qua hệ thống Chat, hẹn xem phòng thực tế.</li>
              <li className="leading-relaxed">Gửi yêu cầu và ký hợp đồng mới có sự duyệt của chủ trọ.</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-card p-5 border border-border shadow-xs space-y-2 text-[11px] text-muted-foreground">
            <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" /> Lưu ý an toàn pháp lý
            </h4>
            <p className="leading-relaxed">
              Mọi giao dịch đổi phòng cần có sự chấp thuận chính thức từ chủ trọ trên hệ thống để kích hoạt hợp đồng thuê mới hợp lệ và bảo toàn tiền cọc ban đầu.
            </p>
          </div>
        </div>

      </div>

      {/* DETAIL DIALOG PREVIEW & COMPARATIVE ANALYSIS */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-card p-6 border border-border shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            <button 
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3.5">
              <Avatar className="size-12 ring-2 ring-border shrink-0">
                <AvatarImage src={selectedPost.user.avatar || undefined} alt="avatar" className="object-cover" />
                <AvatarFallback className="bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {getInitials(selectedPost.user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {selectedPost.user.name}
                </h3>
                <p className="text-[11px] text-muted-foreground">{selectedPost.user.school}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              
              <div className="grid gap-3 sm:grid-cols-2 bg-secondary/30 p-3.5 rounded-xl border border-border/40">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Phòng hiện tại của họ</span>
                  <span className="font-bold text-xs text-foreground block mt-0.5">{selectedPost.currentRoom.title}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    📍 {selectedPost.currentRoom.district} • Giá: {selectedPost.currentRoom.rent > 0 ? `${(selectedPost.currentRoom.rent/1e6).toFixed(1)}Mđ/tháng` : "Thỏa thuận"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">Nhu cầu đổi sang</span>
                  <span className="font-bold text-xs text-primary block mt-0.5">
                    {selectedPost.targetNeeds.roomType} tại {selectedPost.targetNeeds.districts.join("/")}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    Ngân sách: {selectedPost.targetNeeds.budgetMax > 0 ? `≤ ${(selectedPost.targetNeeds.budgetMax/1e6).toFixed(1)} triệu/tháng` : "Thỏa thuận"}
                  </span>
                </div>
              </div>

              {/* Real Lifestyle Habits of Author */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Thói quen sinh hoạt của người đăng</span>
                {Array.isArray(selectedPost.habits) && selectedPost.habits.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-card">
                    {selectedPost.habits.map((h: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                        {h}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-2 rounded-lg bg-secondary/30">
                    Người đăng chưa cập nhật danh sách thói quen sinh hoạt.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Ghi chú & Lý do</span>
                <p className="text-xs leading-relaxed text-muted-foreground italic bg-secondary/20 rounded-xl p-3 border-l-2 border-primary">
                  &ldquo;{selectedPost.reason}&rdquo;
                </p>
              </div>

              <div className="pt-3 flex gap-2.5">
                <Button 
                  onClick={() => setSelectedPost(null)}
                  variant="outline" 
                  className="flex-1 h-9 text-xs"
                >
                  Đóng
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      if (selectedPost && !selectedPost.id.startsWith("swap-")) {
                        await api.post(`/swaps/${selectedPost.id}/request`, {
                          message: "Tôi quan tâm đến tin hoán đổi phòng của bạn, hãy kết nối nhé!",
                        });
                        toast.success("Đã gửi đề xuất hoán đổi phòng thành công!");
                      } else {
                        toast.success("Đã gửi đề xuất thành công!");
                      }
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || "Không thể gửi đề xuất. Vui lòng thử lại.");
                    }
                    setSelectedPost(null);
                  }}
                  className="flex-1 h-9 text-xs gap-1.5 font-semibold"
                >
                  <ArrowLeftRight className="size-3.5" /> Gửi đề xuất hoán đổi
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
