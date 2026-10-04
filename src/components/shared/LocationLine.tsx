import { MapPin } from "lucide-react";

export function LocationLine({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
      <MapPin className="size-3.5 text-primary" />
      {text}
    </span>
  );
}
