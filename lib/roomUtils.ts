import { getSupabase } from "./supabase";

export interface RoomEntryResult {
  success: boolean;
  needsPin: boolean;
  room?: {
    id: string;
    code: string;
    is_private: boolean;
    room_password: string | null;
    room_type: string;
    is_active: boolean;
  };
  error?: string;
}

/**
 * Odaya giriş yapmadan önce kontrol eder
 * @param roomId Oda ID
 * @returns RoomEntryResult
 */
export async function checkRoomEntry(
  roomId: string
): Promise<RoomEntryResult> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("rooms")
      .select("id, is_private, room_password, room_type, is_active, code")
      .eq("id", roomId)
      .single();

    if (error || !data) {
      return {
        success: false,
        needsPin: false,
        error: "Oda bulunamadı",
      };
    }

    // Oda aktif mi kontrol et
    if (!data.is_active) {
      return {
        success: false,
        needsPin: false,
        error: "Bu oda kapatılmış ve artık erişilemez.",
      };
    }

    // Şifreli oda kontrolü
    if (data.is_private) {
      return {
        success: false,
        needsPin: true,
        room: {
          id: data.id,
          code: data.code,
          is_private: data.is_private,
          room_password: data.room_password,
          room_type: data.room_type,
          is_active: data.is_active,
        },
      };
    }

    // Şifresiz oda - direkt giriş yapılabilir
    return {
      success: true,
      needsPin: false,
      room: {
        id: data.id,
        code: data.code,
        is_private: data.is_private,
        room_password: data.room_password,
        room_type: data.room_type,
        is_active: data.is_active,
      },
    };
  } catch (err) {
    return {
      success: false,
      needsPin: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}

/**
 * Kullanıcıyı odaya ekler veya günceller
 * @param roomCode Oda kodu
 * @param userKey Kullanıcı key'i
 * @param username Kullanıcı adı
 */
export async function addUserToRoom(
  roomCode: string,
  userKey: string,
  username: string
): Promise<void> {
  try {
    const supabase = getSupabase();
    
    // Önce kullanıcının odada olup olmadığını kontrol et
    const { data: existingParticipant, error: checkError } = await supabase
      .from("room_participants")
      .select("user_key, is_admin")
      .eq("room_code", roomCode)
      .eq("user_key", userKey)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows found, bu normal
      throw checkError;
    }

    if (existingParticipant) {
      // Kullanıcı zaten odada - joined_at'i güncelle (tekrar geldiğinde)
      const { error: updateError } = await supabase
        .from("room_participants")
        .update({
          joined_at: new Date().toISOString(),
          username: username, // Username değişmiş olabilir
        })
        .eq("room_code", roomCode)
        .eq("user_key", userKey);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Kullanıcı odada değil - ekle
      const { error: insertError } = await supabase
        .from("room_participants")
        .insert({
          room_code: roomCode,
          user_key: userKey,
          username: username,
          is_admin: false,
          joined_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }
    }
  } catch (err) {
    console.error("Odaya katılma hatası:", err);
    throw err;
  }
}

/**
 * PIN doğrulaması yapar
 * @param roomId Oda ID
 * @param pin Girilen PIN
 * @returns Doğru mu?
 */
export async function verifyRoomPin(
  roomId: string,
  pin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("rooms")
      .select("id, is_private, room_password, is_active, code, room_type")
      .eq("id", roomId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Oda bulunamadı",
      };
    }

    // Oda aktif mi kontrol et
    if (!data.is_active) {
      return {
        success: false,
        error: "Bu oda kapatılmış ve artık erişilemez.",
      };
    }

    // PIN kontrolü
    if (data.is_private && data.room_password !== pin) {
      return {
        success: false,
        error: "Girdiğiniz PIN yanlış!",
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}

