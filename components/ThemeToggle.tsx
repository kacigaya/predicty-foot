"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Button } from "@/app/components/ui/button";

type Theme = "dark" | "light";
const THEME_STORAGE_KEY = "predicty_theme";

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(
    subscribeToTheme,
    getTheme,
    () => "dark",
  );

  const toggleTheme = useCallback(() => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    const next: Theme = isCurrentlyDark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }, []);

  useEffect(() => {
    // Restore preference if stored
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light") {
        document.documentElement.classList.remove("dark");
      } else if (stored === "dark") {
        document.documentElement.classList.add("dark");
      }
    } catch {}

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "d" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return;
      }
      event.preventDefault();
      toggleTheme();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleTheme]);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      title="Toggle theme (d)"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme (shortcut: d)`}
    >
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <Moon className="block size-4 dark:hidden" aria-hidden />
    </Button>
  );
}
