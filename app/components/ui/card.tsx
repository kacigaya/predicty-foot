import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/app/lib/utils";

export function Card({
  className,
  as: Component = "div",
  ...props
}: ComponentPropsWithoutRef<"div"> & { as?: "div" | "article" | "section" }) {
  return (
    <Component
      className={cn(
        "relative flex flex-col rounded-2xl border border-border bg-card not-dark:bg-clip-padding text-card-foreground shadow-xs/5 before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
        className,
      )}
      data-slot="card"
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-5 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pb-4 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className,
      )}
      data-slot="card-header"
      {...props}
    />
  );
}

export function CardTitle({
  className,
  as: Component = "div",
  ...props
}: ComponentPropsWithoutRef<"div"> & { as?: "div" | "h2" | "h3" | "h4" }) {
  return (
    <Component
      className={cn(
        "font-heading font-semibold text-base leading-none text-foreground",
        className,
      )}
      data-slot="card-title"
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("text-muted-foreground text-xs leading-normal", className)}
      data-slot="card-description"
      {...props}
    />
  );
}

export function CardAction({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "col-start-2 row-span-2 row-start-1 inline-flex self-start justify-self-end",
        className,
      )}
      data-slot="card-action"
      {...props}
    />
  );
}

export function CardPanel({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex-1 p-5 in-[[data-slot=card]:has(>[data-slot=card-header]:not(.border-b))]:pt-0 in-[[data-slot=card]:has(>[data-slot=card-footer]:not(.border-t))]:pb-0",
        className,
      )}
      data-slot="card-panel"
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex items-center p-5 in-[[data-slot=card]:has(>[data-slot=card-panel])]:pt-3",
        className,
      )}
      data-slot="card-footer"
      {...props}
    />
  );
}
