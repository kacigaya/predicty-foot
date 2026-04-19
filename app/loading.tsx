import { Skeleton } from "@/app/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="mx-auto mt-4 h-12 w-96" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
