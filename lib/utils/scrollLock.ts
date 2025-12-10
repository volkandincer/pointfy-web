/**
 * Body scroll lock utility
 * Birden fazla modal açıldığında da düzgün çalışır
 */

let scrollLockCount = 0;
let savedScrollPosition = 0;

/**
 * Body scroll'unu kilitle
 */
export function lockBodyScroll(): void {
  scrollLockCount++;
  
  if (scrollLockCount === 1) {
    // İlk kez kilitleniyor
    savedScrollPosition = window.scrollY;
    document.body.setAttribute("data-scroll-y", savedScrollPosition.toString());
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollPosition}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
  }
}

/**
 * Body scroll'unu aç
 */
export function unlockBodyScroll(): void {
  scrollLockCount--;
  
  if (scrollLockCount <= 0) {
    // Tüm kilitler açıldı
    scrollLockCount = 0;
    const scrollY = document.body.getAttribute("data-scroll-y");
    
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    document.body.style.overflow = "";
    document.body.removeAttribute("data-scroll-y");
    
    // Scroll pozisyonunu geri yükle
    if (scrollY) {
      const scrollPosition = parseInt(scrollY, 10);
      if (!isNaN(scrollPosition)) {
        // setTimeout ile bir sonraki frame'de scroll yap
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 0);
      }
    }
  }
}

/**
 * Tüm scroll kilitlerini temizle (acil durumlar için)
 */
export function forceUnlockBodyScroll(): void {
  scrollLockCount = 0;
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.overflow = "";
  document.body.removeAttribute("data-scroll-y");
}

