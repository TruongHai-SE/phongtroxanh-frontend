export function AmenityPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-xs text-mint-foreground">
      <span className="size-1.5 rounded-full bg-primary" />
      {label}
    </span>
  );
}
