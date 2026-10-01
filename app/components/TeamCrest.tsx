import Image from "next/image";
import { cn } from "@/lib/utils";
import { teamInitials } from "@/app/lib/utils";

// `src` comes from crestFor on the server; teams without a bundled crest show
// their initials. No hooks, so it renders in server and client components.
export function TeamCrest({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = {
    sm: "size-7",
    md: "size-10",
    lg: "size-14",
  }[size];

  const pixelSize = {
    sm: 28,
    md: 40,
    lg: 56,
  }[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={`${name} crest`}
        width={pixelSize}
        height={pixelSize}
        className={cn(dims, "object-contain", className)}
      />
    );
  }

  const textSize =
    size === "sm" ? "text-[10px]" : size === "lg" ? "text-lg" : "text-xs";

  return (
    <div
      role="img"
      aria-label={`${name} crest`}
      className={cn(
        "flex items-center justify-center rounded-full border border-border bg-muted font-mono font-semibold text-foreground",
        dims,
        textSize,
        className,
      )}
    >
      {teamInitials(name)}
    </div>
  );
}
