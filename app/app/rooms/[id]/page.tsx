"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, ArrowLeft, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/jira/EmptyState";
import UserVotingView from "@/components/voting/UserVotingView";
import AdminVotingView from "@/components/voting/AdminVotingView";
import UserCompletedTasksView from "@/components/voting/UserCompletedTasksView";
import TaskFormModal from "@/components/rooms/TaskFormModal";
import TaskCard from "@/components/rooms/TaskCard";
import RoomPinModal from "@/components/rooms/RoomPinModal";
import RoomParticipants from "@/components/rooms/RoomParticipants";
import ShareRoomButton from "@/components/rooms/ShareRoomButton";
import RetroRoomView from "@/components/retro/RetroRoomView";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";
import { useActiveTask } from "@/hooks/useActiveTask";
import { useTasks } from "@/hooks/useTasks";
import { useRoomAdmin } from "@/hooks/useRoomAdmin";
import { verifyRoomPin, addUserToRoom } from "@/lib/roomUtils";
import { useToastContext } from "@/contexts/ToastContext";

export default function RoomDetailPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roomId = String(params?.id);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [userKey, setUserKey] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [creatingTask, setCreatingTask] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [checkingPin, setCheckingPin] = useState<boolean>(true);

  const { activeTask, loading: activeTaskLoading } = useActiveTask(roomId);
  const { tasks, loading: tasksLoading } = useTasks(roomId);
  const { showToast } = useToastContext();

  // Admin kontrolü için hook kullan
  const {
    isAdmin,
    loading: adminLoading,
    permissions,
  } = useRoomAdmin(room?.code || "", userKey);

  // Yeni task aktif olduğunda user'a toast göster
  const [previousActiveTaskId, setPreviousActiveTaskId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  
  // Auth state değişikliğini dinle - logout olduğunda anasayfaya yönlendir
  // Ama RequireAuth zaten login'e yönlendirecek, bu yüzden burada sadece logout durumunu handle ediyoruz
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        // Sadece explicit logout durumunda anasayfaya yönlendir
        // RequireAuth zaten login olmamış kullanıcıları login'e yönlendirecek
        if (event === "SIGNED_OUT") {
          router.replace("/");
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);
  
  useEffect(() => {
    // İlk yükleme tamamlandıktan sonra toast göster
    if (isInitialLoad && !activeTaskLoading) {
      setIsInitialLoad(false);
      if (activeTask) {
        setPreviousActiveTaskId(activeTask.id);
      }
      return;
    }

    // Sadece user için ve yeni bir task aktif olduğunda toast göster
    // (İlk yüklemede değil, sonradan değiştiğinde)
    if (
      !isAdmin &&
      !isInitialLoad &&
      activeTask &&
      activeTask.id !== previousActiveTaskId
    ) {
      showToast(
        `Yeni task başlatıldı: ${activeTask.title}`,
        "info",
        5000,
        {
          label: "Puanlamaya Git",
          onClick: () => {
            // Voting view'e scroll yap
            const votingElement = document.getElementById("voting-view");
            if (votingElement) {
              votingElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          },
        }
      );
    }
    
    if (activeTask) {
      setPreviousActiveTaskId(activeTask.id);
    } else {
      setPreviousActiveTaskId(null);
    }
  }, [activeTask, isAdmin, previousActiveTaskId, isInitialLoad, activeTaskLoading, showToast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        
        // Önce odayı yükle (kullanıcı giriş yapmamış olsa bile)
        // RequireAuth zaten login'e yönlendirecek
        
        // Kullanıcı varsa user bilgilerini set et
        if (userData.user) {
          setUserKey(userData.user.id);
        }

        // Kullanıcı varsa username'i al
        let userRow: { username?: string } | null = null;
        if (userData.user) {
          const { data: userRowData } = await supabase
            .from("users")
            .select("username")
            .eq("id", userData.user.id)
            .single();
          if (!mounted) return;
          userRow = userRowData;
          setUsername(
            userRowData?.username || userData.user.email?.split("@")[0] || "User"
          );
        }

        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select(
            "id, name, code, created_by_key, created_by_username, is_active, room_type, is_private, room_password"
          )
          .eq("id", roomId)
          .single();
        if (!mounted) return;
        
        if (roomError || !roomData) {
          showToast("Oda bulunamadı veya erişilemiyor.", "error");
          setTimeout(() => {
            if (mounted) {
              router.replace("/app/rooms");
            }
          }, 2000);
          return;
        }
        
        // Oda aktif değilse
        if (!roomData.is_active) {
          showToast("Bu oda kapatılmış ve artık erişilemez.", "error");
          setTimeout(() => {
            if (mounted) {
              router.replace("/app/rooms");
            }
          }, 2000);
          return;
        }
        
        setRoom(roomData);

        // Kullanıcı varsa odaya katılma işlemini yap
        if (userData.user) {
          // Kullanıcının odada olup olmadığını kontrol et
          const { data: participantData } = await supabase
            .from("room_participants")
            .select("user_key")
            .eq("room_code", roomData.code)
            .eq("user_key", userData.user.id)
            .single();
          
          if (!mounted) return;
          
          // PIN kontrolü - eğer oda şifreli ise ve kullanıcı odada değilse PIN iste
          if (roomData.is_private && !participantData) {
            setCheckingPin(false);
            setShowPinModal(true);
            return;
          }

          // Şifresiz oda veya kullanıcı zaten odada - kullanıcıyı odaya ekle (eğer değilse)
          if (!roomData.is_private && !participantData) {
            const usernameToUse = userRow?.username || userData.user.email?.split("@")[0] || "User";
            await addUserToRoom(roomData.code, userData.user.id, usernameToUse);
            // Yeni katılan kullanıcıya hoş geldin mesajı göster
            showToast(`Hoş geldiniz! ${roomData.name} odasına katıldınız.`, "success", 4000);
          }
        }
        // Admin kontrolü useRoomAdmin hook'u tarafından yapılıyor
      } catch {
        // Room detail fetch error
        if (mounted) {
          showToast("Oda yüklenirken bir hata oluştu.", "error");
          // Hata durumunda kısa bir süre bekle ve sonra yönlendir
          setTimeout(() => {
            if (mounted) {
              router.replace("/app/rooms");
            }
          }, 2000);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setCheckingPin(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [roomId, router]);

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      if (!room) return;

      setPinLoading(true);
      setPinError(null);

      try {
        const result = await verifyRoomPin(room.id, pin);

        if (!result.success) {
          setPinError(result.error || "PIN yanlış!");
          setPinLoading(false);
          return;
        }

        // PIN doğru - kullanıcıyı odaya ekle
        if (userKey && username) {
          await addUserToRoom(room.code, userKey, username);
        }

        setShowPinModal(false);
        setPinError(null);
      } catch (err) {
        setPinError(err instanceof Error ? err.message : "Bilinmeyen hata");
      } finally {
        setPinLoading(false);
      }
    },
    [room, userKey, username]
  );

  const handleSetActiveTask = useCallback(
    async (taskId: string) => {
      // Admin kontrolü - sadece admin task'ı aktif yapabilir
      if (!isAdmin) {
        showToast("Bu işlem için admin yetkisi gereklidir.", "error");
        return;
      }

      try {
        const supabase = getSupabase();
        // Önce tüm task'ları completed yap
        await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("room_id", roomId);
        // Sonra seçilen task'ı active yap ve updated_at'i güncelle (timer için)
        const { error } = await supabase
          .from("tasks")
          .update({ 
            status: "active",
            updated_at: new Date().toISOString() // Timer başlangıcı için zamanı güncelle
          })
          .eq("id", taskId);
        if (error) throw error;
        showToast("Task başarıyla aktif yapıldı!", "success");
      } catch {
        showToast("Task aktif yapılamadı.", "error");
      }
    },
    [roomId, isAdmin, showToast]
  );

  const handleCreateTask = useCallback(
    async (
      title: string,
      description?: string,
      jiraKey?: string,
      jiraUrl?: string,
      jiraId?: string
    ) => {
      // Admin kontrolü - sadece admin task oluşturabilir
      if (!isAdmin) {
        showToast("Bu işlem için admin yetkisi gereklidir.", "error");
        return;
      }

      if (!userKey || !username) return;
      setCreatingTask(true);
      try {
        const supabase = getSupabase();
        // Mobil projede olduğu gibi task'ı pending status'ü ile ekle
        // Puanlamaya gönder butonuna tıklanınca active yapılacak
        const { error } = await supabase.from("tasks").insert({
          room_id: roomId,
          title,
          description: description || null,
          status: "pending", // Direkt active değil, pending olarak ekle
          created_by_key: userKey,
          created_by_username: username,
          jira_key: jiraKey || null,
          jira_url: jiraUrl || null,
          jira_id: jiraId || null,
        });
        if (error) throw error;
        showToast("Task başarıyla oluşturuldu!", "success");
      } catch (err) {
        showToast("Task oluşturulamadı.", "error");
        throw err;
      } finally {
        setCreatingTask(false);
      }
    },
    [roomId, userKey, username, isAdmin, showToast]
  );

  if (loading || activeTaskLoading || adminLoading || checkingPin) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="h-40 animate-pulse border-2 border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  return (
    <>
      <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between rounded-md border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div>
                <h1 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {room?.name || "Oda"}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Kod: <span className="font-mono font-semibold">{room?.code}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {room && (
                  <ShareRoomButton
                    roomId={roomId}
                    roomCode={room.code}
                    roomName={room.name || "Oda"}
                  />
                )}
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  size="sm"
                  icon={ArrowLeft}
                  className="!h-8 !px-3 !text-xs"
                >
                  Geri
                </Button>
              </div>
            </div>

            {/* Katılımcılar - Hem admin hem user için görünür */}
            {room?.code && (
              <div className="mb-6">
                <RoomParticipants
                  roomCode={room.code}
                  currentUserKey={userKey}
                  isAdmin={isAdmin}
                />
              </div>
            )}

            {room?.room_type === "retro" ? (
              <RetroRoomView
                roomId={roomId}
                userKey={userKey}
                username={username}
                isAdmin={isAdmin}
              />
            ) : activeTask ? (
              <>
                <div id="voting-view">
                  {isAdmin ? (
                    <AdminVotingView
                      roomId={roomId}
                      activeTask={activeTask}
                      isAdmin={isAdmin}
                    />
                  ) : (
                    <UserVotingView
                      roomId={roomId}
                      activeTask={activeTask}
                      userKey={userKey}
                      username={username}
                      canVote={permissions?.can_vote ?? true}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <EmptyState
                  icon={Clock}
                  title="Aktif Task Yok"
                  description="Şu anda aktif bir task yok. Admin yeni bir task başlatana kadar bekleyin."
                />

                {/* User için tamamlanan task'lar */}
                {!isAdmin && (
                  <UserCompletedTasksView
                    roomId={roomId}
                    userKey={userKey}
                    username={username}
                  />
                )}

                {isAdmin && (
                  <>
                    {/* Puanlanmayan Task'lar (Pending) */}
                    {(() => {
                      const pendingTasks = tasks.filter(
                        (t) => t.status === "pending"
                      );
                      if (pendingTasks.length === 0) return null;
                      return (
                        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50/50 p-5 dark:border-amber-700 dark:bg-amber-900/10">
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <div className="mb-1.5 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Puanlanmayı Bekleyen Task&apos;lar
                                </h2>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {pendingTasks.length} task puanlamaya hazır
                              </p>
                            </div>
                            <Button
                              onClick={() => setShowTaskModal(true)}
                              variant="primary"
                              size="sm"
                              icon={Plus}
                              className="!border-blue-600 !bg-blue-600 hover:!border-blue-700 hover:!bg-blue-700 dark:!border-blue-500 dark:!bg-blue-600 dark:hover:!border-blue-400 dark:hover:!bg-blue-500"
                            >
                              Task Ekle
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {pendingTasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                roomId={roomId}
                                isAdmin={isAdmin}
                                onSetActive={handleSetActiveTask}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Diğer Task'lar (Active ve Completed) */}
                    <div className="rounded-lg border border-gray-300 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="mb-1.5 text-lg font-semibold text-gray-900 dark:text-white">
                            Task Yönetimi (Admin)
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Aktif ve tamamlanan task&apos;lar
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowTaskModal(true)}
                          variant="primary"
                          size="sm"
                          icon={Plus}
                          className="!border-blue-600 !bg-blue-600 hover:!border-blue-700 hover:!bg-blue-700 dark:!border-blue-500 dark:!bg-blue-600 dark:hover:!border-blue-400 dark:hover:!bg-blue-500"
                        >
                          Task Ekle
                        </Button>
                      </div>
                      {tasksLoading ? (
                        <div className="py-8 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Yükleniyor...
                          </p>
                        </div>
                      ) : tasks.filter((t) => t.status !== "pending").length ===
                        0 ? (
                        <EmptyState
                          icon={Clock}
                          title="Henüz aktif veya tamamlanan task yok"
                          description="İlk task'ınızı ekleyerek başlayın"
                          actionLabel="Task Ekle"
                          onAction={() => setShowTaskModal(true)}
                        />
                      ) : (
                        <div className="space-y-3">
                          {tasks
                            .filter((t) => t.status !== "pending")
                            .map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                roomId={roomId}
                                isAdmin={isAdmin}
                                onSetActive={handleSetActiveTask}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
        <TaskFormModal
          open={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleCreateTask}
          loading={creatingTask}
        />
        <RoomPinModal
          open={showPinModal}
          onClose={() => {
            setShowPinModal(false);
            setPinError(null);
            router.replace("/app/rooms");
          }}
          onSubmit={handlePinSubmit}
          loading={pinLoading}
          error={pinError}
        />
        <Footer navigationItems={navigationItems} />
    </>
  );
}
