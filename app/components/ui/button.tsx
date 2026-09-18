"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-sm outline-none transition-colors before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-9 px-3.5 sm:h-8 sm:px-3 text-xs sm:text-xs",
        icon: "size-9 sm:size-8",
        "icon-sm": "size-8 sm:size-7",
        lg: "h-10 px-4 sm:h-9 text-sm sm:text-sm",
        sm: "h-8 gap-1.5 px-2.5 sm:h-7 text-xs",
        xs: "h-7 gap-1 rounded-md px-2 text-xs before:rounded-[calc(var(--radius-md)-1px)] sm:h-6 [&_svg:not([class*='size-'])]:size-3.5",
      },
      variant: {
        default:
          "not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-primary bg-primary text-primary-foreground shadow-primary/24 shadow-xs hover:bg-primary/90 [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none",
        destructive:
          "not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-destructive bg-destructive text-white shadow-destructive/24 shadow-xs hover:bg-destructive/90 [:disabled,:active,[data-pressed]]:shadow-none",
        ghost:
          "border-transparent text-foreground hover:bg-accent data-pressed:bg-accent",
        outline:
          "border-input bg-popover not-dark:bg-clip-padding text-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-accent/50 data-pressed:bg-accent/50 dark:bg-input/32 dark:data-pressed:bg-input/64 dark:hover:bg-input/64 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 data-pressed:bg-secondary/90 [:active,[data-pressed]]:bg-secondary/80",
        link: "border-transparent text-foreground underline-offset-4 hover:underline",
      },
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  render?: React.ReactElement<{ className?: string; children?: React.ReactNode }>;
  "data-slot"?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      render,
      type,
      "data-slot": dataSlot,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }), render?.props.className);

    if (render) {
      return React.cloneElement(render, {
        ...props,
        className: classes,
        "data-slot": dataSlot ?? "button",
        children: props.children,
      } as typeof render.props);
    }

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={classes}
          data-slot={dataSlot ?? "button"}
          {...props}
        />
      );
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={classes}
        data-slot={dataSlot ?? "button"}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
