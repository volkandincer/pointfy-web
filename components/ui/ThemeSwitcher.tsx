"use client";

import { memo } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Button from "@/components/ui/Button";

const ThemeSwitcher = memo(function ThemeSwitcher() {
  const { theme, toggleTheme, mounted } = useTheme();

  // SSR için mounted kontrolü
  if (!mounted) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-md border-2 border-border bg-muted" />
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      icon={theme === "dark" ? Sun : Moon}
      className="h-9 w-9 p-0"
      aria-label={theme === "dark" ? "Light mode'a geç" : "Dark mode'a geç"}
    >
      <span className="sr-only">
        {theme === "dark" ? "Light mode'a geç" : "Dark mode'a geç"}
      </span>
    </Button>
  );
});

export default ThemeSwitcher;

