import { Skeleton } from "@/app/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status">
      <span className="sr-only">Loading fixtures</span>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <Skeleton className="h-14 w-full max-w-3xl" />
        <Skeleton className="mt-6 h-5 w-full max-w-2xl" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-sm border border-line bg-surface" />
        ))}
      </div>
    </div>
  );
}
