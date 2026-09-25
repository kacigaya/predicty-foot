import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status">
      <span className="sr-only">Loading fixtures</span>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Skeleton className="h-6 w-36 mb-4" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 pb-16">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
