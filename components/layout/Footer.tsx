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
  ChevronRight,
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
    <footer className="border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm mt-20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Ana Sayfalar */}
          <div>
            <h3 className="font-semibold text-white mb-4">Sayfalar</h3>
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
                        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Uygulama */}
          <div>
            <h3 className="font-semibold text-white mb-4">Uygulamalar</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/app/jira"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <Zap className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Jira</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app/boards"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <ClipboardList className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Board&apos;lar</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app/tasks"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <CheckSquare className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Task&apos;lar</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/app/notes"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Notlar</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Yasal</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <Shield className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Gizlilik Politikası</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <FileTextIcon className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Kullanım Şartları</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <Cookie className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Çerez Politikası</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/third-party"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <Shield className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Üçüncü Taraf Ayrıntıları</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Bilgi */}
          <div>
            <h3 className="font-semibold text-white mb-4">Bilgi</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <Info className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>Hakkımızda</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                  <span>İletişim</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center text-sm text-slate-500">
          <p>© {currentYear} Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
