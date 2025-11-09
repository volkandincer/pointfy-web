"use client";

import Link from "next/link";
import { memo, useEffect, useState } from "react";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";

interface RecentRoomsProps {
  createdByKey?: string; // Artık kullanılmıyor, tüm odalar gösteriliyor
}

const RecentRooms = memo(function RecentRooms({
  createdByKey, // Artık kullanılmıyor
}: RecentRoomsProps) {
  const [rooms, setRooms] = useState<RoomInfo[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function fetchRooms() {
      try {
        const supabase = getSupabase();
        // Mobil projede olduğu gibi: sadece aktif odaları göster, tüm odaları göster (createdByKey filtresi yok)
        const { data } = await supabase
          .from("rooms")
          .select("id, name, code, created_by_username, is_active, created_at")
          .eq("is_active", true)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(8);
        if (!mounted) return;
        setRooms(data || []);
      } catch {
        if (!mounted) return;
        setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRooms();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
          Odalar
        </h2>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400 md:text-base">
          En son oluşturulan ve aktif odalar
        </p>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : rooms && rooms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rooms.map((r) => (
                <Link
                  key={r.id}
                  href={`/app/rooms/${r.id}`}
                  className="group block overflow-hidden rounded-2xl border-2 border-blue-400/15 bg-white p-5 shadow-[0_4px_16px_rgba(59,130,246,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)] dark:border-blue-500/10 dark:bg-gray-900"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                      {r.name || "Oda"}
                    </h3>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {r.code}
                    </span>
                  </div>
                  {r.created_by_username && (
                    <p className="mb-4 line-clamp-1 text-xs text-gray-600 dark:text-gray-400">
                      @{r.created_by_username}
                    </p>
                  )}
                  <div className="inline-flex h-8 items-center justify-center rounded-md bg-gray-900 px-3 text-xs font-semibold text-white transition group-hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:group-hover:bg-gray-100">
                    Odaya Git
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-right">
              <Link
                href="/app/rooms"
                className="text-sm font-semibold text-gray-900 underline-offset-2 hover:underline dark:text-white"
              >
                Tüm odaları gör →
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-gray-200/70 bg-white p-8 text-center dark:border-gray-800/70 dark:bg-gray-900">
            <p className="mb-2 text-4xl">🏠</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Henüz oda yok
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              İlk odanızı oluşturun
            </p>
          </div>
        )}
      </div>
    </section>
  );
});

export default RecentRooms;
