import { NextResponse } from "next/server";
import type { ContactFormData } from "@/interfaces/Contact.interface";
import { UseCaseFactory } from "@/src/application/services/UseCaseFactory";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactFormData;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Geçersiz istek" },
        { status: 400 }
      );
    }

    // Honeypot check - if triggered, return success silently
    if (body.website && body.website.trim().length > 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Create contact message using use case
    const createContactMessageUseCase = UseCaseFactory.createContactMessage();
    await createContactMessageUseCase.execute({
      name: body.name || "",
      email: body.email || "",
      message: body.message || "",
      website: body.website || "",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Beklenmeyen hata";
    
    // Map domain errors to user-friendly messages
    let userMessage = "Beklenmeyen hata";
    if (errorMessage.includes("Name must be between")) {
      userMessage = "Ad geçersiz";
    } else if (errorMessage.includes("Valid email")) {
      userMessage = "E-posta geçersiz";
    } else if (errorMessage.includes("Message must be between")) {
      userMessage = "Mesaj uzunluğu geçersiz";
    } else if (errorMessage.includes("Spam detected")) {
      // Silently return success for spam
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: 500 }
    );
  }
}
