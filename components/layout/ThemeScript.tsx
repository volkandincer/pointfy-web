"use client";

import { useEffect } from "react";

export default function ThemeScript() {
  useEffect(() => {
    // Sayfa yüklendiğinde theme'i uygula (flash önlemek için)
    const savedTheme = localStorage.getItem("theme");
    const root = document.documentElement;
    
    if (savedTheme === "dark") {
      root.classList.add("dark");
    } else if (savedTheme === "light") {
      root.classList.remove("dark");
    } else {
      // Sistem tercihini kontrol et
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  return null;
}

