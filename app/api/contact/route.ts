import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { ContactFormData } from "@/interfaces/Contact.interface";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactFormData;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Geçersiz istek" },
        { status: 400 }
      );
    }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const website = (body.website || "").trim();

    if (website.length > 0) {
      // Honeypot triggered
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: "Ad geçersiz" },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "E-posta geçersiz" },
        { status: 400 }
      );
    }
    if (message.length < 10 || message.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Mesaj uzunluğu geçersiz" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, message });
    if (error) {
      return NextResponse.json(
        { success: false, error: "Kayıt başarısız" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
