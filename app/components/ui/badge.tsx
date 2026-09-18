import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

export const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: { variant: "default", size: "default" },
    variants: {
      size: {
        default: "h-5.5 min-w-5.5 px-2 text-xs sm:h-4.5 sm:min-w-4.5 sm:text-[11px]",
        lg: "h-6 min-w-6 px-2.5 text-xs",
        sm: "h-4.5 min-w-4.5 rounded-[0.25rem] px-1.5 text-[10px]",
      },
      variant: {
        default: "bg-primary text-primary-foreground [button&,a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [button&,a&]:hover:bg-secondary/90",
        outline: "border-border bg-card text-foreground hover:bg-accent",
        success: "border border-success/20 bg-success/10 text-success-foreground dark:text-success",
        warning: "border border-warning/20 bg-warning/10 text-warning-foreground dark:text-warning",
        destructive: "border border-destructive/20 bg-destructive/10 text-destructive-foreground dark:text-destructive",
        muted: "border-border bg-muted text-muted-foreground",
      },
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      data-slot="badge"
      {...props}
    />
  );
}
