import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ChevronRight, GraduationCap, MessageCircle, Heart, Wallet, MapPin, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { AmenityPill, MatchBadge } from "@/components/shared/primitives-compat";
import type { Roommate } from "../types/roommate.types";
import { api } from "@/lib/api";

export default function RoommateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Roommate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [profile, compat] = await Promise.allSettled([
          api.get<any>(`/users/${id}/public`),
          api.get<any>(`/matching/compatibility/${id}`),
        ]);

        const pData = profile.status === "fulfilled" ? profile.value : null;
        const cData = compat.status === "fulfilled" ? compat.value : null;

        if (pData) {
          const compatList = cData
            ? [
                { label: "Ngân sách", value: cData.budgetScore ?? 0 },
                { label: "Địa điểm", value: cData.locationScore ?? 0 },
                { label: "Ngủ sớm", value: cData.sleepScore ?? 0 },
                { label: "Gọn gàng", value: cData.neatScore ?? 0 },
                { label: "Tiếp khách", value: cData.guestScore ?? 0 },
                { label: "Sở thích", value: cData.interestScore ?? 0 },
              ]
            : [];

          const age = pData.birthDate 
            ? Math.max(18, new Date().getFullYear() - new Date(pData.birthDate).getFullYear())
            : 20;

          setPerson({
            id: String(pData.id || id),
            name: pData.fullName || "Người dùng",
            age: age,
            avatar: pData.avatarUrl || "",
            bio: pData.bio || "Chưa có lời giới thiệu.",
            school: pData.schoolOrCompany || "Đang tìm bạn ở ghép",
            budget: pData.budgetMax 
              ? (pData.budgetMin 
                  ? `${(Number(pData.budgetMin) / 1e6).toFixed(1)} - ${(Number(pData.budgetMax) / 1e6).toFixed(1)} tr/tháng` 
                  : `≤ ${(Number(pData.budgetMax) / 1e6).toFixed(1)} tr/tháng`)
              : "Thỏa thuận",
            areas: pData.preferredDistricts && pData.preferredDistricts.length > 0 ? pData.preferredDistricts : ["Chưa cập nhật"],
            interests: pData.interests && pData.interests.length > 0 ? pData.interests : [],
            lifestyle: [
              { label: "Ngủ sớm", value: pData.earlySleeper ? "Có" : "Không" },
              { label: "Gọn gàng", value: pData.isNeat ? "Có" : "Bình thường" },
              { label: "Hút thuốc", value: pData.nonSmoking ? "Không" : "Có" },
              { label: "Tiếp khách", value: pData.allowGuests ? "Được phép" : "Hạn chế" },
            ],
            match: cData?.totalScore ?? 80,
            compatibility: compatList.length > 0 ? compatList : [
              { label: "Ngân sách", value: 80 },
              { label: "Địa điểm", value: 80 },
              { label: "Lối sống", value: 80 },
            ],
            nonSmoking: pData.nonSmoking ?? true,
            earlySleeper: pData.earlySleeper ?? false,
            isNeat: pData.isNeat ?? true,
            allowGuests: pData.allowGuests ?? false,
          });
        } else {
          setError("Không tìm thấy thông tin bạn ở ghép.");
        }
      } catch (err) {
        console.warn("Could not load user public profile:", err);
        setError("Không thể tải thông tin hồ sơ.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <RefreshCw className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải hồ sơ bạn ở ghép...</p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <AlertCircle className="mx-auto size-12 text-rose-500" />
        <h2 className="mt-4 text-lg font-bold text-foreground">{error || "Không tìm thấy hồ sơ"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Hồ sơ người dùng này không tồn tại hoặc đã ngừng hoạt động.</p>
        <Button className="mt-6" onClick={() => navigate("/roommates")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const p = person;
  const chartData = p.compatibility.map((c) => ({ subject: c.label, value: c.value }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/roommates" className="hover:text-primary">Ghép bạn</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-border">
            <ImageWithFallback src={p.avatar} alt={p.name} className="aspect-[3/4] w-full object-cover" />
            <MatchBadge value={p.match} className="absolute right-4 top-4" />
          </div>
          <Button className="w-full gap-2" onClick={() => navigate("/chat")}><MessageCircle className="size-4" /> Nhắn tin</Button>
          <Button variant="outline" className="w-full gap-2"><Heart className="size-4" /> Thích hồ sơ</Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="brand text-3xl text-foreground">{p.name}, {p.age}</h1>
            <p className="mt-1 inline-flex items-center gap-1 text-muted-foreground">
              <GraduationCap className="size-4 text-primary" /> {p.school}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 rounded-xl bg-secondary/40 p-4 text-sm">
            <span className="inline-flex items-center gap-2"><Wallet className="size-4 text-primary" /> {p.budget}</span>
            <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-primary" /> {p.areas.join(", ")}</span>
          </div>

          <Section title="Giới thiệu"><p className="text-muted-foreground">{p.bio}</p></Section>

          <Section title="Sở thích">
            <div className="flex flex-wrap gap-2">{p.interests.map((i) => <AmenityPill key={i} label={i} />)}</div>
          </Section>

          <Section title="Lối sống">
            <div className="grid gap-3 sm:grid-cols-2">
              {p.lifestyle.map((l) => (
                <div key={l.label} className="rounded-xl ring-1 ring-border p-3">
                  <p className="text-xs text-muted-foreground">{l.label}</p>
                  <p className="text-sm">{l.value}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Độ tương thích">
            <div className="grid gap-6 rounded-2xl bg-card p-5 ring-1 ring-border sm:grid-cols-2">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} outerRadius="75%">
                    <PolarGrid stroke="#d1fadf" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64746c" }} />
                    <Radar dataKey="value" stroke="#15803d" fill="#15803d" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 self-center">
                {p.compatibility.map((c) => (
                  <div key={c.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">{c.label}</span><span>{c.value}%</span>
                    </div>
                    <Progress value={c.value} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="mb-3 text-lg">{title}</h2>{children}</div>;
}
