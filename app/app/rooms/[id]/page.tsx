"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UserVotingView from "@/components/voting/UserVotingView";
import AdminVotingView from "@/components/voting/AdminVotingView";
import TaskFormModal from "@/components/rooms/TaskFormModal";
import TaskCard from "@/components/rooms/TaskCard";
import RetroRoomView from "@/components/retro/RetroRoomView";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { RoomInfo } from "@/interfaces/Room.interface";
import type { TaskInfo } from "@/interfaces/Voting.interface";
import { getSupabase } from "@/lib/supabase";
import { useActiveTask } from "@/hooks/useActiveTask";
import { useTasks } from "@/hooks/useTasks";
import { useRoomAdmin } from "@/hooks/useRoomAdmin";

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

  const { activeTask, loading: activeTaskLoading } = useActiveTask(roomId);
  const { tasks, loading: tasksLoading } = useTasks(roomId);

  // Admin kontrolü için hook kullan
  const {
    isAdmin,
    loading: adminLoading,
    error: adminError,
    permissions,
  } = useRoomAdmin(room?.code || "", userKey);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        // Don't redirect here - RequireAuth already handles auth
        // Just set user data or return if no user
        if (!mounted || !userData.user) {
          return;
        }
        setUserKey(userData.user.id);

        const { data: userRow } = await supabase
          .from("users")
          .select("username")
          .eq("key", userData.user.id)
          .single();
        if (!mounted) return;
        setUsername(
          userRow?.username || userData.user.email?.split("@")[0] || "User"
        );

        const { data: roomData } = await supabase
          .from("rooms")
          .select(
            "id, name, code, created_by_key, created_by_username, is_active, room_type"
          )
          .eq("id", roomId)
          .single();
        if (!mounted) return;
        if (!roomData) {
          router.replace("/app/rooms");
          return;
        }
        setRoom(roomData);
        // Admin kontrolü useRoomAdmin hook'u tarafından yapılıyor
      } catch (err) {
        console.error("Room detail fetch error:", err);
        if (mounted) {
          // If room not found or error, go back to rooms list
          router.replace("/app/rooms");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [roomId, router]);

  const handleSetActiveTask = useCallback(
    async (taskId: string) => {
      // Admin kontrolü - sadece admin task'ı aktif yapabilir
      if (!isAdmin) {
        alert("Bu işlem için admin yetkisi gereklidir.");
        return;
      }

      try {
        const supabase = getSupabase();
        // Önce tüm task'ları completed yap
        await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("room_id", roomId);
        // Sonra seçilen task'ı active yap
        const { error } = await supabase
          .from("tasks")
          .update({ status: "active" })
          .eq("id", taskId);
        if (error) throw error;
      } catch (err) {
        console.error("Set active task error:", err);
        alert("Task aktif yapılamadı.");
      }
    },
    [roomId, isAdmin]
  );

  const handleCreateTask = useCallback(
    async (title: string, description?: string) => {
      // Admin kontrolü - sadece admin task oluşturabilir
      if (!isAdmin) {
        alert("Bu işlem için admin yetkisi gereklidir.");
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
        });
        if (error) throw error;
      } catch (err) {
        console.error("Create task error:", err);
        alert("Task oluşturulamadı.");
        throw err;
      } finally {
        setCreatingTask(false);
      }
    },
    [roomId, userKey, username, isAdmin]
  );

  if (loading || activeTaskLoading || adminLoading) {
    return (
      <RequireAuth>
        <>
          <Header navigationItems={navigationItems} />
          <main className="container mx-auto px-4 py-16">
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </main>
          <Footer navigationItems={navigationItems} />
        </>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {room?.name || "Oda"}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kod: {room?.code}
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                ← Geri
              </button>
            </div>

            {room?.room_type === "retro" ? (
              <RetroRoomView
                roomId={roomId}
                userKey={userKey}
                username={username}
                isAdmin={isAdmin}
              />
            ) : activeTask ? (
              <>
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
                  />
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200/70 bg-white p-8 text-center shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
                  <p className="mb-2 text-4xl">⏳</p>
                  <p className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                    Aktif Task Yok
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Şu anda aktif bir task yok. Admin yeni bir task başlatana
                    kadar bekleyin.
                  </p>
                </div>

                {isAdmin && (
                  <>
                    {/* Puanlanmayan Task'lar (Pending) */}
                    {(() => {
                      const pendingTasks = tasks.filter(
                        (t) => t.status === "pending"
                      );
                      if (pendingTasks.length === 0) return null;
                      return (
                        <div className="mb-6 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-6 shadow-sm dark:border-amber-800/70 dark:bg-amber-900/10">
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                ⏳ Puanlanmayı Bekleyen Task'lar
                              </h2>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {pendingTasks.length} task puanlamaya hazır
                              </p>
                            </div>
                            <button
                              onClick={() => setShowTaskModal(true)}
                              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              + Task Ekle
                            </button>
                          </div>
                          <div className="space-y-4">
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
                    <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Task Yönetimi (Admin)
                          </h2>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Aktif ve tamamlanan task'lar
                          </p>
                        </div>
                        <button
                          onClick={() => setShowTaskModal(true)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          + Task Ekle
                        </button>
                      </div>
                      {tasksLoading ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Yükleniyor...
                        </p>
                      ) : tasks.filter((t) => t.status !== "pending").length ===
                        0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Henüz aktif veya tamamlanan task yok.
                        </p>
                      ) : (
                        <div className="space-y-4">
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
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}
