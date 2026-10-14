import { LocalTime } from "@/app/components/LocalTime";

export function CachedOddsNotice({ fetchedAt }: { fetchedAt: string }) {
  return (
    <p role="status" className="mb-4 rounded-xl border border-border bg-muted/30 p-4 text-pretty text-sm text-foreground">
      Live odds are unavailable. Showing cached odds from{" "}
      <LocalTime iso={fetchedAt} format="kickoffLong" />. Prices and fixtures may have changed.
    </p>
  );
}
