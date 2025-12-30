"use client";

import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Use setTimeout to avoid calling setState synchronously in effect
    setTimeout(() => {
      setMounted(true);
      // localStorage'dan theme'i oku
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      } else {
        // Sistem tercihini kontrol et
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: Theme = prefersDark ? "dark" : "light";
        setTheme(initialTheme);
        applyTheme(initialTheme);
      }
    }, 0);
  }, []);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    mounted,
  };
}

