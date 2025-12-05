import { NextResponse } from "next/server";
import { UseCaseFactory } from "@/src/application/services/UseCaseFactory";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";

/**
 * Jira URL'ini veritabanına kaydet
 */
export async function POST(request: Request) {
  try {
    // 1. Kullanıcıyı doğrula
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first" },
        { status: 401 }
      );
    }

    // 2. Request body'den Jira URL'ini al
    const body = await request.json();
    const jiraBaseUrl = body.jiraBaseUrl?.trim();

    if (!jiraBaseUrl) {
      return NextResponse.json(
        { error: "Jira URL is required" },
        { status: 400 }
      );
    }

    // 3. Use case ile URL'i kaydet
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
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    
    // Map domain errors to user-friendly messages
    if (errorMessage.includes("User not found")) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (errorMessage.includes("Failed to update")) {
      return NextResponse.json(
        { error: `Failed to save Jira URL: ${errorMessage}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


