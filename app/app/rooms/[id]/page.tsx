"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UserVotingView from "@/components/voting/UserVotingView";
import AdminVotingView from "@/components/voting/AdminVotingView";
import CompletedTasksView from "@/components/voting/CompletedTasksView";
import TaskFormModal from "@/components/rooms/TaskFormModal";
import RetroRoomView from "@/components/retro/RetroRoomView";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { RoomInfo } from "@/interfaces/Room.interface";
import type { TaskInfo } from "@/interfaces/Voting.interface";
import { getSupabase } from "@/lib/supabase";
import { useActiveTask } from "@/hooks/useActiveTask";
import { useTasks } from "@/hooks/useTasks";

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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [creatingTask, setCreatingTask] = useState<boolean>(false);

  const { activeTask, loading: activeTaskLoading } = useActiveTask(roomId);
  const { tasks, loading: tasksLoading } = useTasks(roomId);

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

        const { data: participant } = await supabase
          .from("room_participants")
          .select("is_admin")
          .eq("room_code", roomData.code)
          .eq("user_key", userData.user.id)
          .single();
        if (!mounted) return;
        setIsAdmin(
          participant?.is_admin || roomData.created_by_key === userData.user.id
        );
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
      try {
        const supabase = getSupabase();
        await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("room_id", roomId);
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
    [roomId]
  );

  const handleCreateTask = useCallback(
    async (title: string, description?: string) => {
      if (!userKey || !username) return;
      setCreatingTask(true);
      try {
        const supabase = getSupabase();
        await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("room_id", roomId);
        const { error } = await supabase.from("tasks").insert({
          room_id: roomId,
          title,
          description: description || null,
          status: "active",
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
    [roomId, userKey, username]
  );

  if (loading || activeTaskLoading) {
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
              <Link
                href="/app/rooms"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                ← Geri
              </Link>
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
                  <AdminVotingView roomId={roomId} activeTask={activeTask} />
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
                  <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Task Yönetimi (Admin)
                      </h2>
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
                    ) : tasks.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Henüz task yok. Yeni task ekleyin.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleSetActiveTask(task.id)}
                              disabled={task.status === "active"}
                              className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
                            >
                              {task.status === "active" ? "Aktif" : "Aktif Yap"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <CompletedTasksView roomId={roomId} />
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
