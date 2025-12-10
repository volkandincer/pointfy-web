"use client";

import { useEffect } from "react";
import { forceUnlockBodyScroll } from "@/lib/utils/scrollLock";

/**
 * Sayfa yüklendiğinde scroll lock'u temizler
 * Modal kapandıktan sonra scroll lock'un kalmasını önler
 */
export default function ScrollLockCleanup() {
  useEffect(() => {
    // Body'nin scroll durumunu kontrol et ve düzelt
    const checkAndFixScroll = () => {
      // Önce utility ile temizle
      forceUnlockBodyScroll();
      
      // Sonra manuel olarak da kontrol et
      if (document.body.style.position === "fixed" || document.body.style.overflow === "hidden") {
        const scrollY = document.body.getAttribute("data-scroll-y");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        document.body.removeAttribute("data-scroll-y");
        
        // Scroll pozisyonunu geri yükle
        if (scrollY) {
          const scrollPosition = parseInt(scrollY, 10);
          if (!isNaN(scrollPosition) && scrollPosition > 0) {
            setTimeout(() => {
              window.scrollTo(0, scrollPosition);
            }, 0);
          }
        }
      }
    };
    
    // İlk yüklemede hemen kontrol et
    checkAndFixScroll();
    
    // DOMContentLoaded'da da kontrol et
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", checkAndFixScroll);
    }
    
    // Window load'da da kontrol et
    window.addEventListener("load", checkAndFixScroll);
    
    // Route değişikliklerinde de kontrol et
    const handleRouteChange = () => {
      setTimeout(checkAndFixScroll, 100);
    };
    
    // Popstate event'i (geri/ileri butonları)
    window.addEventListener("popstate", handleRouteChange);
    
    // Her 500ms'de bir kontrol et (güvenlik için)
    const intervalId = setInterval(checkAndFixScroll, 500);
    
    return () => {
      document.removeEventListener("DOMContentLoaded", checkAndFixScroll);
      window.removeEventListener("load", checkAndFixScroll);
      window.removeEventListener("popstate", handleRouteChange);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}

