"use client";

import Link from "next/link";
import { memo } from "react";
import {
  Home,
  Zap,
  ClipboardList,
  CheckSquare,
  FileText,
  Info,
  Mail,
  Shield,
  FileText as FileTextIcon,
  Cookie,
} from "lucide-react";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

interface FooterProps {
  navigationItems: NavigationItem[];
}

const Footer = memo(function Footer({ navigationItems }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const getIcon = (href: string) => {
    if (href === "/" || href.startsWith("/app/rooms")) return Home;
    if (href.startsWith("/app/jira")) return Zap;
    if (href.startsWith("/app/boards")) return ClipboardList;
    if (href.startsWith("/app/tasks")) return CheckSquare;
    if (href.startsWith("/app/notes")) return FileText;
    if (href === "/about") return Info;
    if (href === "/contact") return Mail;
    return null;
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Ana Sayfalar */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Sayfalar
            </h4>
            <ul className="space-y-2.5">
              {navigationItems
                .filter(
                  (item) =>
                    item.href !== "/features" &&
                    item.href !== "/#features" &&
                    item.href !== "/#download" &&
                    item.label !== "Özellikler" &&
                    item.label !== "İndir"
                )
                .map((item) => {
                  const Icon = getIcon(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Uygulama */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Uygulama
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/app/jira"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Zap className="h-3.5 w-3.5 shrink-0" />
                  <span>Jira</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app/boards"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                  <span>Board&apos;lar</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app/tasks"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                  <span>Task&apos;lar</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app/notes"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span>Notlar</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Yasal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/legal/privacy"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span>Gizlilik Politikası</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <FileTextIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>Kullanım Şartları</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Cookie className="h-3.5 w-3.5 shrink-0" />
                  <span>Çerez Politikası</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/third-party"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span>Üçüncü Taraf Hizmetler</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Bilgi */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Bilgi
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Hakkında</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>İletişim</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
