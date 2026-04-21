import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 border",
  {
    variants: {
      variant: {
        default: "border-[#d8ff3e]/40 bg-[#d8ff3e]/10 text-[#d8ff3e]",
        muted: "border-[#2a2a25] bg-[#1c1c19] text-[#7b7a70]",
        warning: "border-[#ff5b36]/40 bg-[#ff5b36]/10 text-[#ff5b36]",
        danger: "border-[#ff5b36]/40 bg-[#ff5b36]/10 text-[#ff5b36]",
        info: "border-[#7dc4ff]/40 bg-[#7dc4ff]/10 text-[#7dc4ff]",
        success: "border-[#d8ff3e]/40 bg-[#d8ff3e]/10 text-[#d8ff3e]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
