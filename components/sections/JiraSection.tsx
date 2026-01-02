"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { Link2, BarChart3, Folder, ClipboardList, Search, Settings, ChevronDown } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { JiraAction } from "@/interfaces/JiraAction.interface";

interface JiraSectionProps {
  jiraConnected: boolean;
  userId: string | null;
  jiraBaseUrl?: string;
}

// Icon mapping for Jira actions
const jiraIconMap: Record<string, typeof BarChart3> = {
  "link": Link2,
  "bar-chart-3": BarChart3,
  "folder": Folder,
  "clipboard-list": ClipboardList,
  "search": Search,
  "settings": Settings,
};

const JiraSection = memo(function JiraSection({
  jiraConnected,
  userId,
}: JiraSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  const jiraActions: JiraAction[] = useMemo(() => {
    const actions: JiraAction[] = [];

    if (!jiraConnected) {
      // Bağlı değilse sadece bağlantı aksiyonu
      actions.push({
        id: "connect-jira",
        title: "Jira'yı Bağla",
        description: "Jira hesabınızı bağlayın ve projelerinizi yönetin",
        icon: "link",
        requiresConnection: false,
        onClick: () => {
          setShowPermissionModal(true);
        },
      });
    } else {
      // Bağlıysa tüm Jira işlemleri
      actions.push(
        {
          id: "jira-dashboard",
          title: "Jira Ana Sayfa",
          description: "Projelerinizi ve issue'larınızı görüntüleyin",
          href: "/app/jira",
          icon: "bar-chart-3",
          requiresConnection: true,
        },
        {
          id: "jira-projects",
          title: "Projelerim",
          description: "Tüm Jira projelerinizi görüntüleyin",
          href: "/app/jira?tab=projects",
          icon: "folder",
          requiresConnection: true,
        },
        {
          id: "jira-issues",
          title: "Issue'larım",
          description: "Size atanan issue'ları görüntüleyin",
          href: "/app/jira?tab=issues",
          icon: "clipboard-list",
          requiresConnection: true,
        },
        {
          id: "jira-search",
          title: "Jira'da Ara",
          description: "JQL ile gelişmiş arama yapın",
          href: "/app/jira-test?tab=search",
          icon: "search",
          requiresConnection: true,
        },
        {
          id: "jira-settings",
          title: "Jira Ayarları",
          description: "Jira bağlantı ayarlarını yönetin",
          href: "/app/account",
          icon: "settings",
          requiresConnection: true,
        }
      );
    }

    return actions;
  }, [jiraConnected]);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Ana Kategori Başlığı - Accordion Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group mb-4 flex w-full items-center justify-between rounded-md border-2 border-blue-600 bg-card p-5 text-left transition-all hover:border-blue-700 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20">
              <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                Jira
              </h2>
              <p className="text-sm text-muted-foreground">
                {jiraConnected
                  ? "Jira projelerinizi ve issue'larınızı yönetin"
                  : "Jira hesabınızı bağlayarak başlayın"}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <ChevronDown
              className={`h-6 w-6 text-muted-foreground transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Alt Menü - Accordion Content */}
        {isExpanded && (
          <div className="mb-4 rounded-md border-2 border-blue-600 bg-card p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jiraActions.map((action) =>
                action.onClick ? (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="group relative block w-full border-l-4 border-t-2 border-r-2 border-b-2 border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary hover:shadow-md"
                    style={{
                      borderLeftColor: '#2563eb',
                    }}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      {(() => {
                        const IconComponent = jiraIconMap[action.icon] || Link2;
                        return (
                          <div className="flex h-8 w-8 items-center justify-center border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20">
                            <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        );
                      })()}
                      <h3 className="text-base font-semibold text-foreground sm:text-lg">
                        {action.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {action.description}
                    </p>
                  </button>
                ) : action.href ? (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="group relative block w-full border-l-4 border-t-2 border-r-2 border-b-2 border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary hover:shadow-md"
                    style={{
                      borderLeftColor: '#2563eb',
                    }}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      {(() => {
                        const IconComponent = jiraIconMap[action.icon] || Link2;
                        return (
                          <div className="flex h-8 w-8 items-center justify-center border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20">
                            <IconComponent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        );
                      })()}
                      <h3 className="text-base font-semibold text-foreground sm:text-lg">
                        {action.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {action.description}
                    </p>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>

      {/* Jira İzinleri Bilgilendirme Modal'ı */}
      <Modal
        open={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        title="Jira Bağlantısı İçin Gerekli İzinler"
      >
        <div className="space-y-4">
          <div className="border-2 border-blue-300 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Neden bu izinler gerekli?</strong> Jira hesabınızı bağlamak için bu izinlere
              ihtiyacımız var. Bu sayede projelerinizi, issue&apos;larınızı ve board&apos;larınızı
              görüntüleyebilir, story point&apos;leri yönetebilirsiniz.
            </p>
          </div>

          <div className="space-y-3 border-2 border-border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="text-xs font-semibold">1</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  Jira Verilerini Okuma
                </h4>
                <p className="mb-1 text-xs text-muted-foreground">
                  <strong>Ne için:</strong> Projelerinizi, issue&apos;larınızı ve board&apos;larınızı
                  görüntüleyebilmek için
                </p>
                <p className="text-xs text-muted-foreground">
                  Bu izin sayesinde Jira&apos;daki tüm projelerinizi ve size atanan görevleri
                  TeamHubX&apos;de görüntüleyebilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="text-xs font-semibold">2</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  Jira Verilerini Güncelleme
                </h4>
                <p className="mb-1 text-xs text-muted-foreground">
                  <strong>Ne için:</strong> Poker planning sonuçlarını Jira&apos;daki issue&apos;lara
                  story point olarak kaydedebilmek için
                </p>
                <p className="text-xs text-muted-foreground">
                  Takımınızla yaptığınız oylamaların sonuçlarını otomatik olarak Jira&apos;daki
                  ilgili issue&apos;lara aktarabiliriz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="text-xs font-semibold">3</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  Board ve Sprint Erişimi
                </h4>
                <p className="mb-1 text-xs text-muted-foreground">
                  <strong>Ne için:</strong> Agile board&apos;larınızı ve sprint&apos;lerinizi
                  görüntüleyebilmek için
                </p>
                <p className="text-xs text-muted-foreground">
                  Scrum ve Kanban board&apos;larınızı, aktif sprint&apos;lerinizi ve sprint
                  içindeki görevleri TeamHubX&apos;de görebilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-green-600 bg-green-50 text-green-600 dark:border-green-500 dark:bg-green-900/30 dark:text-green-400">
                <span className="text-xs font-semibold">✓</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-foreground">
                  Otomatik Yenileme
                </h4>
                <p className="mb-1 text-xs text-muted-foreground">
                  <strong>Ne için:</strong> Bağlantınızın sürekli aktif kalması için
                </p>
                <p className="text-xs text-muted-foreground">
                  Her seferinde yeniden bağlanmanıza gerek kalmadan, bağlantınız otomatik olarak
                  yenilenir ve kesintisiz çalışır.
                </p>
              </div>
            </div>
          </div>

          <div className="border-2 border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/20">
            <p className="text-xs text-green-800 dark:text-green-200">
              <strong>Güvenlik:</strong> Bu izinler sadece Jira verilerinize erişim sağlar. Hesap
              şifreniz, kişisel bilgileriniz veya diğer hassas verileriniz saklanmaz. İstediğiniz
              zaman hesap ayarlarından bağlantıyı kaldırabilirsiniz.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPermissionModal(false)}
              className="flex-1 rounded-md border-2 border-border bg-card px-4 py-2.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent hover:border-border hover:text-accent-foreground"
            >
              İptal
            </button>
            <button
              onClick={async () => {
                if (!userId) return;
                setShowPermissionModal(false);
                try {
                  const returnUrl = encodeURIComponent("/");
                  const encodedUserId = encodeURIComponent(userId);
                  window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
                } catch {
                  // Jira OAuth error
                }
              }}
              className="flex-1 border-2 border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 hover:border-primary"
            >
              Devam Et
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
});

export default JiraSection;

