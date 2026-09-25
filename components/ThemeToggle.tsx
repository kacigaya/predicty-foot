"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/app/site";

type Theme = "dark" | "light";

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// The root layout's inline script applies the stored or OS theme before first paint.
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribeToTheme, getTheme, () => "light");

  const toggleTheme = useCallback(() => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }, []);

  useEffect(() => {
    // Follow the OS preference until the user picks a theme.
    const media = matchMedia("(prefers-color-scheme: dark)");
    function onSchemeChange() {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch {}
      document.documentElement.classList.toggle("dark", media.matches);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "d" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      toggleTheme();
    }

    media.addEventListener("change", onSchemeChange);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      media.removeEventListener("change", onSchemeChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [toggleTheme]);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      title="Toggle theme (d)"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme (shortcut: d)`}
    >
      <Sun className="hidden dark:block" aria-hidden />
      <Moon className="dark:hidden" aria-hidden />
    </Button>
  );
}
