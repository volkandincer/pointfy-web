"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Link2, Settings as SettingsIcon } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useToastContext } from "@/contexts/ToastContext";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import IconBadge from "@/components/ui/IconBadge";
import Button from "@/components/ui/Button";

interface ConnectionStatus {
  connected: boolean;
  baseUrl?: string;
  tokenExpiresAt?: string;
  lastTest?: {
    success: boolean;
    message: string;
    timestamp: string;
  };
}

export default function JiraSettingsPage() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [testing, setTesting] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
  });
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [baseUrlInput, setBaseUrlInput] = useState<string>("");

  // Load connection status
  useEffect(() => {
    let mounted = true;
    async function loadConnectionStatus() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();

        if (!mounted || !userData.user) {
          setLoading(false);
          return;
        }

        const { data: userRow } = await supabase
          .from("users")
          .select("jira_base_url, jira_access_token, jira_token_expires_at")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (mounted) {
          const connected = !!(
            userRow?.jira_access_token && userRow?.jira_base_url
          );
          setConnectionStatus({
            connected,
            baseUrl: userRow?.jira_base_url || undefined,
            tokenExpiresAt: userRow?.jira_token_expires_at || undefined,
          });
          setBaseUrl(userRow?.jira_base_url || "");
          setBaseUrlInput(userRow?.jira_base_url || "");
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
          showToast("Bağlantı durumu yüklenirken bir hata oluştu.", "error");
        }
      }
    }

    loadConnectionStatus();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  // Test connection
  const testConnection = useCallback(async () => {
    if (!baseUrl) {
      showToast("Lütfen önce Jira Base URL girin.", "error");
      return;
    }

    setTesting(true);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        showToast("Lütfen giriş yapın.", "error");
        setTesting(false);
        return;
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", baseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(
        `/api/jira/test-connection?${urlParams.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setConnectionStatus((prev) => ({
          ...prev,
          lastTest: {
            success: true,
            message: data.message || "Bağlantı başarılı!",
            timestamp: new Date().toISOString(),
          },
        }));
        showToast("Bağlantı testi başarılı!", "success");
      } else {
        setConnectionStatus((prev) => ({
          ...prev,
          lastTest: {
            success: false,
            message: data.error || "Bağlantı testi başarısız.",
            timestamp: new Date().toISOString(),
          },
        }));
        showToast(data.error || "Bağlantı testi başarısız.", "error");
      }
    } catch (err) {
      setConnectionStatus((prev) => ({
        ...prev,
        lastTest: {
          success: false,
          message: err instanceof Error ? err.message : "Bilinmeyen hata",
          timestamp: new Date().toISOString(),
        },
      }));
      showToast("Bağlantı testi sırasında bir hata oluştu.", "error");
    } finally {
      setTesting(false);
    }
  }, [baseUrl, showToast]);

  // Save base URL
  const saveBaseUrl = useCallback(async () => {
    if (!baseUrlInput.trim()) {
      showToast("Lütfen Jira Base URL girin.", "error");
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        showToast("Lütfen giriş yapın.", "error");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/jira/save-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          jiraBaseUrl: baseUrlInput.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBaseUrl(baseUrlInput.trim());
        setConnectionStatus((prev) => ({
          ...prev,
          baseUrl: baseUrlInput.trim(),
        }));
        showToast("Jira Base URL kaydedildi!", "success");
      } else {
        showToast(data.error || "Base URL kaydedilemedi.", "error");
      }
    } catch {
      showToast("Base URL kaydedilirken bir hata oluştu.", "error");
    } finally {
      setSaving(false);
    }
  }, [baseUrlInput, showToast]);

  // Disconnect Jira
  const disconnectJira = useCallback(async () => {
    if (
      !confirm(
        "Jira bağlantısını kesmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    ) {
      return;
    }

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        showToast("Lütfen giriş yapın.", "error");
        return;
      }

      await supabase
        .from("users")
        .update({
          jira_access_token: null,
          jira_refresh_token: null,
          jira_token_expires_at: null,
          jira_base_url: null,
        })
        .eq("id", userData.user.id);

      setConnectionStatus({
        connected: false,
      });
      setBaseUrl("");
      setBaseUrlInput("");
      showToast("Jira bağlantısı kesildi.", "success");
      router.refresh();
    } catch {
      showToast("Bağlantı kesilirken bir hata oluştu.", "error");
    }
  }, [showToast, router]);

  // Connect Jira (OAuth)
  const connectJira = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        showToast("Lütfen giriş yapın.", "error");
        return;
      }

      const returnUrl = encodeURIComponent("/app/jira/settings");
      const encodedUserId = encodeURIComponent(userData.user.id);
      window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
    } catch {
      showToast("Jira bağlantısı başlatılamadı.", "error");
    }
  }, [showToast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse border-2 border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Jira Ayarları"
        description="Jira bağlantınızı yönetin ve yapılandırın"
      />

      {/* Connection Status Card */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconBadge
              icon={connectionStatus.connected ? CheckCircle2 : XCircle}
              color={connectionStatus.connected ? "green" : "red"}
              size="sm"
            />
            <h2 className="text-lg font-semibold text-card-foreground">
              Bağlantı Durumu
            </h2>
          </div>
          <div
            className={`flex items-center gap-2 rounded-md border-2 px-3 py-1 text-sm font-semibold shadow-sm ${
              connectionStatus.connected
                ? "border-green-300 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "border-red-300 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                connectionStatus.connected ? "bg-green-600" : "bg-red-600"
              }`}
            />
            {connectionStatus.connected ? "Bağlı" : "Bağlı Değil"}
          </div>
        </div>

        {connectionStatus.connected ? (
          <div className="space-y-4">
            {connectionStatus.baseUrl && (
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  Jira Base URL
                </label>
                <p className="text-sm text-card-foreground">
                  {connectionStatus.baseUrl}
                </p>
              </div>
            )}
            {connectionStatus.tokenExpiresAt && (
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  Token Süresi
                </label>
                <p className="text-sm text-muted-foreground">
                  {new Date(connectionStatus.tokenExpiresAt).toLocaleString("tr-TR")}
                </p>
              </div>
            )}
            {connectionStatus.lastTest && (
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">
                  Son Test
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      connectionStatus.lastTest.success
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      connectionStatus.lastTest.success
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {connectionStatus.lastTest.message}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(connectionStatus.lastTest.timestamp).toLocaleString(
                    "tr-TR"
                  )}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={testConnection}
                disabled={testing || !baseUrl}
                loading={testing}
              >
                {testing ? "Test Ediliyor..." : "Bağlantıyı Test Et"}
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={disconnectJira}
              >
                Bağlantıyı Kes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Jira hesabınıza bağlanmak için OAuth ile giriş yapın.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={connectJira}
              icon={Link2}
            >
              Jira&apos;yı Bağla
            </Button>
          </div>
        )}
      </Card>

      {/* Base URL Configuration */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <IconBadge
            icon={SettingsIcon}
            color="primary"
            size="sm"
          />
          <h2 className="text-lg font-semibold text-card-foreground">
            Jira Base URL Yapılandırması
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="baseUrl"
              className="mb-2 block text-sm font-medium text-card-foreground"
            >
              Jira Base URL
            </label>
            <input
              id="baseUrl"
              type="text"
              value={baseUrlInput}
              onChange={(e) => setBaseUrlInput(e.target.value)}
              placeholder="örn: pointf.atlassian.net"
              className="w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-base"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Jira instance&apos;ınızın base URL&apos;i (örn: pointf.atlassian.net)
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={saveBaseUrl}
            disabled={saving || baseUrlInput === baseUrl}
            loading={saving}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </Card>

      {/* Help Card */}
      <Card className="border-blue-300 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
        <div className="mb-2 flex items-center gap-3">
          <IconBadge
            icon={SettingsIcon}
            color="blue"
            size="sm"
          />
          <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
            Yardım
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>
            • Jira Base URL, Jira instance&apos;ınızın domain adresidir (örn:
            pointf.atlassian.net)
          </li>
          <li>
            • OAuth ile bağlanmak için &quot;Jira&apos;yı Bağla&quot; butonuna
            tıklayın
          </li>
          <li>
            • Bağlantıyı test etmek için &quot;Bağlantıyı Test Et&quot;
            butonunu kullanın
          </li>
          <li>
            • Bağlantıyı kesmek için &quot;Bağlantıyı Kes&quot; butonuna
            tıklayın
          </li>
        </ul>
      </Card>
    </div>
  );
}

