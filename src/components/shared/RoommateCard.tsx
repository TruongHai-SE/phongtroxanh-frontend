import { Heart, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { MatchBadge } from "@/components/shared/MatchBadge";
import { AmenityPill } from "@/components/shared/AmenityPill";
import type { Roommate } from "@/types/roommate";
import { cn } from "@/lib/utils";

export function RoommateCard({ person, className }: { person: Roommate; className?: string }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/roommates/${person.id}`)}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <ImageWithFallback
          src={person.avatar}
          alt={person.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <MatchBadge value={person.match} className="absolute right-3 top-3" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <p className="text-lg text-white">
            {person.name}, {person.age}
          </p>
          <p className="inline-flex items-center gap-1 text-sm text-white/85">
            <GraduationCap className="size-3.5" /> {person.school}
          </p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {person.interests.slice(0, 4).map((i) => (
            <AmenityPill key={i} label={i} />
          ))}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{person.bio}</p>
      </div>
    </div>
  );
}
