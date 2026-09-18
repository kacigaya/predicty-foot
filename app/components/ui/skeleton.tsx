import { cn } from "@/app/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-xl bg-muted/60 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
