"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/app/site";

type Theme = "dark" | "light";

const SHORTCUT_EXCLUDED = [
  "input",
  "textarea",
  "select",
  "[contenteditable]",
  "[role=dialog]",
  "[role=alertdialog]",
  "[role=textbox]",
  "[role=combobox]",
  "[role=listbox]",
  "[role=menu]",
].join(", ");

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
    // Crests used to be cached in localStorage; the cookie policy promises the
    // old keys are deleted. Safe to drop once returning visitors have cycled.
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("predicty_foot_crests_v")) localStorage.removeItem(key);
      }
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

    // A single-letter shortcut (WCAG 2.1.4) must not fire while the user is
    // typing, composing, holding the key, or working inside a dialog or widget
    // that handles its own keys.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "d" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.repeat || event.isComposing || event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest(SHORTCUT_EXCLUDED)) return;
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
