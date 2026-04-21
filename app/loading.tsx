import { Skeleton } from "@/app/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="mt-6 h-24 w-full max-w-3xl" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-px border border-[#2a2a25] bg-[#2a2a25] px-0 py-0 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 bg-[#131311]" />
        ))}
      </div>
    </div>
  );
}
