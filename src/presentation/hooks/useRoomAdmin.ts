/**
 * useRoomAdmin Hook
 * Presentation layer hook for checking room admin status using use cases
 */

"use client";

import { useState, useEffect } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";

interface UseRoomAdminResult {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  permissions: {
    is_admin: boolean;
    is_spectator: boolean;
    can_vote: boolean;
    can_create_tasks: boolean;
    can_manage_room: boolean;
  } | null;
}

export function useRoomAdmin(
  roomCode: string,
  userKey: string
): UseRoomAdminResult {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] =
    useState<UseRoomAdminResult["permissions"]>(null);

  useEffect(() => {
    if (!roomCode || !userKey) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function checkAdminStatus() {
      try {
        setLoading(true);
        setError(null);

        const checkRoomAdminUseCase = UseCaseFactory.checkRoomAdmin();
        const result = await checkRoomAdminUseCase.execute(roomCode, userKey);

        if (!mounted) return;

        setIsAdmin(result.isAdmin);
        setPermissions(result.permissions);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setIsAdmin(false);
        setPermissions(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkAdminStatus();

    return () => {
      mounted = false;
    };
  }, [roomCode, userKey]);

  return {
    isAdmin,
    loading,
    error,
    permissions,
  };
}

