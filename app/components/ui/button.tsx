"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.18em] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#d8ff3e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a09] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-3.5 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#d8ff3e] text-[#0a0a09] hover:bg-[#e4ff66] active:bg-[#c2e82c] shadow-[0_0_0_1px_#d8ff3e]",
        secondary:
          "bg-transparent text-[#f4efe2] border border-[#2a2a25] hover:border-[#d8ff3e] hover:text-[#d8ff3e]",
        outline:
          "border border-[#f4efe2]/30 bg-transparent text-[#f4efe2] hover:bg-[#f4efe2] hover:text-[#0a0a09]",
        ghost: "text-[#7b7a70] hover:text-[#f4efe2]",
        destructive:
          "bg-[#ff5b36] text-[#0a0a09] hover:bg-[#ff7558]",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-[10px]",
        lg: "h-12 px-7 text-xs",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
