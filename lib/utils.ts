import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDefaultNavigationItems(): NavigationItem[] {
  return [
    { label: "Ana Sayfa", href: "/" },
    { label: "Özellikler", href: "/#features" },
    { label: "İndir", href: "/#download" },
    { label: "Hakkında", href: "/about" },
    { label: "İletişim", href: "/contact" },
  ];
}
