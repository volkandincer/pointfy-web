"use client";

import Link from "next/link";
import { memo, useEffect, useState } from "react";
import type { RoomInfo } from "@/interfaces/Room.interface";
import { getSupabase } from "@/lib/supabase";

interface RecentRoomsProps {
  createdByKey?: string;
}

const RecentRooms = memo(function RecentRooms({
  createdByKey,
}: RecentRoomsProps) {
  const [rooms, setRooms] = useState<RoomInfo[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function fetchRooms() {
      try {
        const supabase = getSupabase();
        let query = supabase
          .from("rooms")
          .select("id, name, code, created_by_username, is_active, created_at")
          .order("created_at", { ascending: false })
          .limit(8);
        if (createdByKey) {
          query = query.eq("created_by_key", createdByKey);
        }
        const { data } = await query;
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
    <section className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          {createdByKey ? "Odalarım" : "Son Aktif Odalar"}
        </h2>
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
          En son oluşturulan ve aktif odalar
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(loading ? Array.from({ length: 4 }) : rooms || []).map((r, idx) => (
            <div
              key={r ? r.id : idx}
              className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm dark:border-gray-800/70 dark:bg-gray-900"
            >
              {r ? (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                      {r.name || "Oda"}
                    </h3>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-gray-800 dark:text-blue-300">
                      {r.code}
                    </span>
                  </div>
                  <p className="mb-4 line-clamp-1 text-sm text-gray-600 dark:text-gray-400">
                    {r.created_by_username ? `@${r.created_by_username}` : ""}
                  </p>
                  <Link
                    href={`/app/rooms/${r.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-3 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    Odaya Git
                  </Link>
                </>
              ) : (
                <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 text-right">
          <Link
            href="/app/rooms"
            className="text-sm font-semibold text-gray-900 underline-offset-2 hover:underline dark:text-white"
          >
            Tüm odaları gör
          </Link>
        </div>
      </div>
    </section>
  );
});

export default RecentRooms;
