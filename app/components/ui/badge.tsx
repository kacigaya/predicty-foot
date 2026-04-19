import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
  {
    variants: {
      variant: {
        default: "border-amber-600/30 bg-amber-500/10 text-amber-400",
        muted: "border-[#252d3a] bg-[#1e2430] text-[#7c8494]",
        warning: "border-orange-600/30 bg-orange-500/10 text-orange-400",
        danger: "border-red-600/30 bg-red-500/10 text-red-400",
        info: "border-sky-600/30 bg-sky-500/10 text-sky-400",
        success: "border-green-600/30 bg-green-500/10 text-green-400",
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
