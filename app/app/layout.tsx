"use client";

import { useEffect, useState } from "react";
import GlobalNoteFab from "@/components/notes/GlobalNoteFab";
import ToastContainer from "@/components/ui/ToastContainer";
import { ToastProvider, useToastContext } from "@/contexts/ToastContext";
import { getSupabase } from "@/lib/supabase";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToastContext();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsAuthenticated(!!data.user);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {children}
      {isAuthenticated && <GlobalNoteFab />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </ToastProvider>
  );
}

