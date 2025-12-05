"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { JiraAction } from "@/interfaces/JiraAction.interface";

interface JiraSectionProps {
  jiraConnected: boolean;
  userId: string | null;
  jiraBaseUrl?: string;
}

const JiraSection = memo(function JiraSection({
  jiraConnected,
  userId,
  jiraBaseUrl,
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
        icon: "🔗",
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
          icon: "📊",
          requiresConnection: true,
        },
        {
          id: "jira-projects",
          title: "Projelerim",
          description: "Tüm Jira projelerinizi görüntüleyin",
          href: "/app/jira?tab=projects",
          icon: "📁",
          requiresConnection: true,
        },
        {
          id: "jira-issues",
          title: "Issue'larım",
          description: "Size atanan issue'ları görüntüleyin",
          href: "/app/jira?tab=issues",
          icon: "📋",
          requiresConnection: true,
        },
        {
          id: "jira-search",
          title: "Jira'da Ara",
          description: "JQL ile gelişmiş arama yapın",
          href: "/app/jira-test?tab=search",
          icon: "🔍",
          requiresConnection: true,
        },
        {
          id: "jira-settings",
          title: "Jira Ayarları",
          description: "Jira bağlantı ayarlarını yönetin",
          href: "/app/account",
          icon: "⚙️",
          requiresConnection: true,
        }
      );
    }

    return actions;
  }, [jiraConnected, userId]);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Ana Kategori Başlığı - Accordion Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group mb-4 flex w-full items-center justify-between border-2 border-blue-600 bg-white p-5 text-left transition-all hover:border-blue-700 hover:shadow-md dark:bg-gray-900"
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">🔗</div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white md:text-2xl">
                Jira
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {jiraConnected
                  ? "Jira projelerinizi ve issue'larınızı yönetin"
                  : "Jira hesabınızı bağlayarak başlayın"}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <svg
              className={`h-6 w-6 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Alt Menü - Accordion Content */}
        {isExpanded && (
          <div className="mb-4 border-2 border-blue-600 bg-white p-4 dark:bg-gray-900">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {jiraActions.map((action) =>
                action.onClick ? (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="group relative block w-full border-l-4 border-t border-r border-b border-gray-300 bg-white p-4 text-left shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    style={{
                      borderLeftColor: '#2563eb',
                    }}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-2xl">{action.icon}</span>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </button>
                ) : action.href ? (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="group relative block w-full border-l-4 border-t border-r border-b border-gray-300 bg-white p-4 text-left shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                    style={{
                      borderLeftColor: '#2563eb',
                    }}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-2xl">{action.icon}</span>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
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
          <div className="border border-blue-300 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Neden bu izinler gerekli?</strong> Jira hesabınızı bağlamak için bu izinlere
              ihtiyacımız var. Bu sayede projelerinizi, issue&apos;larınızı ve board&apos;larınızı
              görüntüleyebilir, story point&apos;leri yönetebilirsiniz.
            </p>
          </div>

          <div className="space-y-3 border border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="text-xs font-semibold">1</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Jira Verilerini Okuma
                </h4>
                <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                  <strong>Ne için:</strong> Projelerinizi, issue&apos;larınızı ve board&apos;larınızı
                  görüntüleyebilmek için
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Bu izin sayesinde Jira&apos;daki tüm projelerinizi ve size atanan görevleri
                  Pointfy&apos;de görüntüleyebilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="text-xs font-semibold">2</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Jira Verilerini Güncelleme
                </h4>
                <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                  <strong>Ne için:</strong> Poker planning sonuçlarını Jira&apos;daki issue&apos;lara
                  story point olarak kaydedebilmek için
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Takımınızla yaptığınız oylamaların sonuçlarını otomatik olarak Jira&apos;daki
                  ilgili issue&apos;lara aktarabiliriz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="text-xs font-semibold">3</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Board ve Sprint Erişimi
                </h4>
                <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                  <strong>Ne için:</strong> Agile board&apos;larınızı ve sprint&apos;lerinizi
                  görüntüleyebilmek için
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Scrum ve Kanban board&apos;larınızı, aktif sprint&apos;lerinizi ve sprint
                  içindeki görevleri Pointfy&apos;de görebilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <span className="text-xs font-semibold">✓</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Otomatik Yenileme
                </h4>
                <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                  <strong>Ne için:</strong> Bağlantınızın sürekli aktif kalması için
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Her seferinde yeniden bağlanmanıza gerek kalmadan, bağlantınız otomatik olarak
                  yenilenir ve kesintisiz çalışır.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/20">
            <p className="text-xs text-green-800 dark:text-green-200">
              <strong>🔒 Güvenlik:</strong> Bu izinler sadece Jira verilerinize erişim sağlar. Hesap
              şifreniz, kişisel bilgileriniz veya diğer hassas verileriniz saklanmaz. İstediğiniz
              zaman hesap ayarlarından bağlantıyı kaldırabilirsiniz.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowPermissionModal(false)}
              className="flex-1 border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
                } catch (err) {
                  // Jira OAuth error
                }
              }}
              className="flex-1 border-2 border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 hover:border-blue-700"
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

