import { NextResponse } from "next/server";
import { UseCaseFactory } from "@/src/application/services/UseCaseFactory";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const jiraBaseUrl = body.jiraBaseUrl?.trim();

    if (!jiraBaseUrl) {
      return NextResponse.json(
        { error: "Jira URL is required" },
        { status: 400 }
      );
    }

    const updateUserJiraBaseUrlUseCase = UseCaseFactory.updateUserJiraBaseUrl();
    const normalizedUrl = await updateUserJiraBaseUrlUseCase.execute({
      userId,
      jiraBaseUrl,
    });

    return NextResponse.json({
      success: true,
      jiraBaseUrl: normalizedUrl,
      message: "Jira URL saved successfully",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "";
    
    if (errorMessage.includes("User not found")) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    if (errorMessage.includes("Failed to update")) {
      return NextResponse.json(
        { error: "Jira URL kaydedilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Jira URL kaydedilirken hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}


