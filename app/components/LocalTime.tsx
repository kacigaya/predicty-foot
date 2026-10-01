"use client";

import { useSyncExternalStore } from "react";
import { formatTime, type TimeFormat } from "@/app/lib/time";

const subscribe = () => () => {};

// The server only knows UTC, the browser knows the visitor's zone. Rendering
// UTC (labelled) on the server and during hydration, then local time after,
// keeps the hydration text identical; formatting in local time directly made
// React discard the server HTML for every visitor outside UTC.
export function LocalTime({
  iso,
  format,
  className,
}: {
  iso: string;
  format: TimeFormat;
  className?: string;
}) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <time dateTime={iso} className={className}>
      {isClient ? formatTime(iso, format) : `${formatTime(iso, format, "UTC")} UTC`}
    </time>
  );
}
