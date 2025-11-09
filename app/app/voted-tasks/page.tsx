"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getSupabase } from "@/lib/supabase";

interface VotedTask {
  id: string;
  task_id: string;
  task_title: string;
  task_description?: string;
  task_status: string;
  room_id: string;
  room_name: string;
  room_code: string;
  user_point: number | null;
  average_point: number;
  total_votes: number;
  created_at: string;
  task_created_at?: string;
}

export default function VotedTasksPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const [votedTasks, setVotedTasks] = useState<VotedTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function fetchVotedTasks() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) {
          if (mounted) setLoading(false);
          return;
        }
        // userKey is not used in this component

        // Kullanıcının oy verdiği task'ları getir
        const { data: votesData, error: votesError } = await supabase
          .from("votes")
          .select(
            `
            id,
            task_id,
            point,
            created_at,
            tasks!inner (
              id,
              title,
              description,
              status,
              created_at,
              room_id,
              rooms!inner (
                id,
                name,
                code
              )
            )
          `
          )
          .eq("user_key", userData.user.id)
          .order("created_at", { ascending: false });

        if (votesError) {
          console.error("Votes fetch error:", votesError);
          if (mounted) setVotedTasks([]);
          if (mounted) setLoading(false);
          return;
        }

        if (!mounted) return;

        // Her vote için task'ın istatistiklerini hesapla
        const tasksWithStats = await Promise.all(
          (votesData || []).map(async (vote: {
            id: string;
            task_id: string;
            point: number | null;
            created_at: string;
            tasks: {
              id: string;
              title: string;
              description: string | null;
              status: string;
              created_at: string;
              room_id: string;
              rooms: {
                id: string;
                name: string;
                code: string;
              };
            };
          }) => {
            const task = vote.tasks;
            const room = task.rooms;

            // Bu task için tüm oyları getir
            const { data: allVotes } = await supabase
              .from("votes")
              .select("point")
              .eq("task_id", task.id)
              .not("point", "is", null);

            const validPoints = (allVotes || [])
              .map((v: { point: number | null }) => v.point)
              .filter((p: number | null): p is number => p !== null && p !== undefined);

            const averagePoint =
              validPoints.length > 0
                ? Number(
                    (
                      validPoints.reduce((sum, p) => sum + p, 0) /
                      validPoints.length
                    ).toFixed(1)
                  )
                : 0;

            return {
              id: vote.id,
              task_id: task.id,
              task_title: task.title,
              task_description: task.description,
              task_status: task.status,
              room_id: room.id,
              room_name: room.name,
              room_code: room.code,
              user_point: vote.point,
              average_point: averagePoint,
              total_votes: validPoints.length,
              created_at: vote.created_at,
              task_created_at: task.created_at,
            };
          })
        );

        if (mounted) {
          setVotedTasks(tasksWithStats);
          setLoading(false);
        }

        // Realtime subscription - yeni oy verildiğinde listeyi güncelle
        const channel = supabase
          .channel("voted-tasks-" + userData.user.id)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "votes",
              filter: `user_key=eq.${userData.user.id}`,
            },
            () => {
              if (mounted) {
                // Oy değişikliği olduğunda listeyi yeniden yükle
                fetchVotedTasks();
              }
            }
          );
        channel.subscribe();
        unsubscribe = () => channel.unsubscribe();
      } catch (err) {
        console.error("Fetch voted tasks error:", err);
        if (mounted) {
          setVotedTasks([]);
          setLoading(false);
        }
      }
    }

    fetchVotedTasks();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400">
            ✅ Tamamlandı
          </span>
        );
      case "active":
        return (
          <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            🔄 Aktif
          </span>
        );
      case "pending":
      default:
        return (
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            ⏳ Beklemede
          </span>
        );
    }
  };

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Puanladığım Task&apos;lar
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Oy verdiğiniz tüm task&apos;ları görüntüleyin
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
                  />
                ))}
              </div>
            ) : votedTasks.length === 0 ? (
              <div className="rounded-2xl border border-gray-200/70 bg-white p-12 text-center dark:border-gray-800/70 dark:bg-gray-900">
                <p className="mb-2 text-4xl">📊</p>
                <p className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                  Henüz puanladığınız task yok
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Odalarda task&apos;lara oy vererek buraya ekleyebilirsiniz
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {votedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group relative overflow-hidden rounded-2xl border-2 border-l-4 border-l-blue-600 border-blue-400/15 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-blue-500/10 dark:bg-gray-900"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1.5 text-lg font-bold text-gray-900 dark:text-white">
                          {task.task_title}
                        </h3>
                        {task.task_description && (
                          <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                            {task.task_description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/app/rooms/${task.room_id}`}
                            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {task.room_name} ({task.room_code})
                          </Link>
                        </div>
                      </div>
                      <div className="ml-4 shrink-0">
                        {getStatusBadge(task.task_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Verdiğiniz Puan
                        </span>
                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                          {task.user_point ?? "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Ortalama Puan
                        </span>
                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                          {task.average_point > 0 ? task.average_point : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Toplam Oy
                        </span>
                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                          {task.total_votes}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Oy Tarihi
                        </span>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(task.created_at)}
                        </p>
                      </div>
                    </div>

                    {task.task_status === "active" && (
                      <div className="mt-4 text-right">
                        <Link
                          href={`/app/rooms/${task.room_id}`}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Odaya Git →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}

