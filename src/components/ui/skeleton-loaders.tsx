import { Skeleton } from "./skeleton";

export function RoomCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border">
      {/* Gallery placeholder matching BigRoomCard grid (height: 230px) */}
      <div className="relative grid w-full gap-1 overflow-hidden shrink-0 grid-cols-3 grid-rows-2" style={{ height: 230 }}>
        <Skeleton className="size-full rounded-none col-span-2 row-span-2" />
        <Skeleton className="size-full rounded-none" />
        <Skeleton className="size-full rounded-none" />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {/* Room type label placeholder */}
            <Skeleton className="h-4 w-16 rounded-full" />
            {/* Rating placeholder */}
            <Skeleton className="h-4 w-10" />
          </div>

          <div className="space-y-1.5">
            {/* Title placeholders */}
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-2/3" />
          </div>

          {/* Location placeholder */}
          <Skeleton className="h-4 w-1/2" />

          {/* Area & Floor info row */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Footer price & amenities row */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoommateCardSkeleton() {
  return (
    <div className="relative h-full flex flex-col overflow-hidden rounded-3xl bg-card shadow-xl ring-1 ring-border">
      {/* Avatar block placeholder */}
      <div className="relative w-full overflow-hidden shrink-0" style={{ height: 230 }}>
        <Skeleton className="size-full rounded-none" />
      </div>

      {/* Match badge circular placeholder */}
      <div className="absolute right-4 top-4">
        <Skeleton className="size-10 rounded-full" />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-3">
          <div>
            {/* Name, Age placeholder */}
            <Skeleton className="h-6 w-2/3" />
            {/* School placeholder */}
            <Skeleton className="h-4 w-1/2 mt-2" />
          </div>

          {/* Bio lines placeholders */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        {/* Interests pills placeholder */}
        <div className="flex gap-1.5 mt-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function RoomDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6 animate-fade-in">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-4 w-20" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Gallery skeleton */}
      <div className="relative grid gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2" style={{ height: 420 }}>
        <Skeleton className="size-full rounded-none md:col-span-2 md:row-span-2" />
        <Skeleton className="size-full rounded-none md:col-span-2" />
        <Skeleton className="size-full rounded-none" />
        <Skeleton className="size-full rounded-none" />
      </div>

      {/* Columns */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="size-10 rounded-xl" />
            </div>
          </div>

          {/* Quick Info bar */}
          <div className="flex gap-6 rounded-xl bg-muted/20 p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>

          {/* Amenities Section */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-28" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-8 w-1/2 mx-auto" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-4 w-16" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-[1px] w-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SwipeStageSkeleton({ variant = "room" }: { variant?: "room" | "roommate" }) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Swipes left banner placeholder */}
      <div className="mb-2 md:mb-3 flex justify-center w-full">
        <Skeleton className="h-7 w-64 rounded-full" />
      </div>

      {/* Card deck placeholder */}
      <div className="relative h-[530px] md:h-[490px] w-full max-w-[380px] sm:max-w-[440px] md:max-w-[680px]">
        {variant === "room" ? <RoomCardSkeleton /> : <RoommateCardSkeleton />}
      </div>

      {/* Swipe direction indicators skeleton */}
      <div className="flex items-center justify-between gap-2 w-full max-w-[380px] sm:max-w-[440px] md:max-w-[680px] px-2">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-3.5 w-16 rounded-full" />
      </div>

      {/* Control buttons skeleton */}
      <div className="flex items-center gap-5">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="size-12 rounded-full" />
      </div>

      {/* Helper hint skeleton */}
      <Skeleton className="h-3 w-72 rounded-full" />
    </div>
  );
}
