/**
 * Supabase ve diğer hata mesajlarını kullanıcı dostu Türkçe mesajlara çevirir
 */

interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Supabase hata kodlarını Türkçe mesajlara çevirir
 */
function getSupabaseErrorMessage(error: unknown): string {
  // Error objesi değilse
  if (!error || typeof error !== "object") {
    return "Bir hata oluştu. Lütfen tekrar deneyin.";
  }

  const supabaseError = error as SupabaseError;
  const errorCode = supabaseError.code || "";
  const errorMessage = supabaseError.message || "";

  // PostgREST hataları (PGRST*)
  if (errorCode.startsWith("PGRST")) {
    switch (errorCode) {
      case "PGRST116":
        return "Kayıt bulunamadı.";
      case "PGRST301":
        return "İstek çok büyük. Lütfen daha az veri gönderin.";
      case "PGRST302":
        return "Geçersiz istek formatı.";
      default:
        return "Veritabanı hatası oluştu. Lütfen tekrar deneyin.";
    }
  }

  // PostgreSQL hata kodları
  switch (errorCode) {
    case "23505": // unique_violation
      if (errorMessage.includes("username") || errorMessage.includes("email")) {
        return "Bu kullanıcı adı veya e-posta zaten kullanılıyor.";
      }
      return "Bu kayıt zaten mevcut.";
    case "23503": // foreign_key_violation
      return "İlişkili bir kayıt bulunamadı.";
    case "23502": // not_null_violation
      return "Gerekli alanlar eksik.";
    case "23514": // check_violation
      return "Girilen değer geçersiz.";
    case "42P01": // undefined_table
      return "Veritabanı hatası. Lütfen destek ekibiyle iletişime geçin.";
    case "42501": // insufficient_privilege
      return "Bu işlem için yetkiniz bulunmuyor.";
    case "08003": // connection_does_not_exist
      return "Bağlantı hatası. Lütfen tekrar deneyin.";
    case "08006": // connection_failure
      return "Veritabanı bağlantısı kurulamadı. Lütfen tekrar deneyin.";
    case "53300": // too_many_connections
      return "Çok fazla bağlantı var. Lütfen birkaç saniye sonra tekrar deneyin.";
  }

  // Auth hataları
  if (errorMessage.includes("Invalid login credentials") || errorMessage.includes("Invalid credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (errorMessage.includes("Email not confirmed")) {
    return "E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin.";
  }
  if (errorMessage.includes("User already registered")) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }
  if (errorMessage.includes("Password should be at least")) {
    return "Şifre en az 6 karakter olmalıdır.";
  }
  if (errorMessage.includes("Unable to validate email address")) {
    return "E-posta adresi geçersiz.";
  }
  if (errorMessage.includes("Token has expired")) {
    return "Oturum süreniz doldu. Lütfen tekrar giriş yapın.";
  }
  if (errorMessage.includes("JWT expired")) {
    return "Oturum süreniz doldu. Lütfen tekrar giriş yapın.";
  }

  // Network hataları
  if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
    return "Bağlantı hatası. İnternet bağlantınızı kontrol edin.";
  }
  if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
    return "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
  }

  // Genel Supabase hataları
  if (errorMessage.includes("Row Level Security")) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }
  if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
    return "Veritabanı hatası. Lütfen destek ekibiyle iletişime geçin.";
  }
  if (errorMessage.includes("permission denied")) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }
  if (errorMessage.includes("duplicate key")) {
    return "Bu kayıt zaten mevcut.";
  }
  if (errorMessage.includes("violates foreign key constraint")) {
    return "İlişkili bir kayıt bulunamadı.";
  }
  if (errorMessage.includes("violates not-null constraint")) {
    return "Gerekli alanlar eksik.";
  }
  if (errorMessage.includes("violates check constraint")) {
    return "Girilen değer geçersiz.";
  }

  // İngilizce mesajları Türkçe'ye çevir
  if (errorMessage.includes("Failed to")) {
    return "İşlem başarısız oldu. Lütfen tekrar deneyin.";
  }
  if (errorMessage.includes("Unauthorized") || errorMessage.includes("unauthorized")) {
    return "Bu işlem için yetkiniz bulunmuyor. Lütfen giriş yapın.";
  }
  if (errorMessage.includes("Forbidden") || errorMessage.includes("forbidden")) {
    return "Bu işlem için yetkiniz bulunmuyor.";
  }
  if (errorMessage.includes("Not found") || errorMessage.includes("not found")) {
    return "İstenen kayıt bulunamadı.";
  }
  if (errorMessage.includes("Bad Request") || errorMessage.includes("bad request")) {
    return "Geçersiz istek. Lütfen bilgilerinizi kontrol edin.";
  }
  if (errorMessage.includes("Internal Server Error") || errorMessage.includes("internal server error")) {
    return "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.";
  }
  if (errorMessage.includes("Service Unavailable") || errorMessage.includes("service unavailable")) {
    return "Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
  }

  // Eğer hala İngilizce bir mesaj varsa ve teknik detaylar içeriyorsa
  if (errorMessage && errorMessage.length > 0) {
    // Teknik detayları gizle (örn: "PGRST116", "relation", "constraint" gibi kelimeler)
    if (
      errorMessage.includes("PGRST") ||
      errorMessage.includes("relation") ||
      errorMessage.includes("constraint") ||
      errorMessage.includes("column") ||
      errorMessage.includes("table") ||
      errorMessage.includes("schema") ||
      errorMessage.includes("database") ||
      errorMessage.includes("SQL") ||
      errorMessage.includes("PostgreSQL") ||
      errorMessage.includes("PostgREST")
    ) {
      return "Veritabanı hatası oluştu. Lütfen tekrar deneyin.";
    }

    // Eğer mesaj çok uzunsa veya teknik detaylar içeriyorsa
    if (errorMessage.length > 100) {
      return "Bir hata oluştu. Lütfen tekrar deneyin.";
    }
  }

  // Varsayılan mesaj
  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}

/**
 * Herhangi bir hatayı kullanıcı dostu Türkçe mesaja çevirir
 * @param error - Hata objesi (Error, SupabaseError, string, veya unknown)
 * @returns Kullanıcı dostu Türkçe hata mesajı
 */
export function formatErrorMessage(error: unknown): string {
  if (!error) {
    return "Bir hata oluştu. Lütfen tekrar deneyin.";
  }

  // String ise direkt döndür (zaten Türkçe olabilir)
  if (typeof error === "string") {
    // Eğer İngilizce görünüyorsa çevir
    if (
      error.includes("Failed to") ||
      error.includes("Error") ||
      error.includes("Unauthorized") ||
      error.includes("Not found") ||
      error.includes("PGRST") ||
      error.includes("relation") ||
      error.includes("constraint")
    ) {
      return getSupabaseErrorMessage({ message: error });
    }
    return error;
  }

  // Error objesi ise
  if (error instanceof Error) {
    return getSupabaseErrorMessage(error);
  }

  // Supabase error formatında ise
  if (typeof error === "object" && "message" in error) {
    return getSupabaseErrorMessage(error);
  }

  // Bilinmeyen hata tipi
  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}

