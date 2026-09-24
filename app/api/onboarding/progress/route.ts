import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        onboardingStep: 1,
        onboardingData: null,
        onboardingCompleted: false,
      });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        onboardingStep: true,
        onboardingData: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        onboardingStep: 1,
        onboardingData: null,
        onboardingCompleted: false,
      });
    }

    let parsedData = null;
    if (user.onboardingData) {
      try {
        parsedData = JSON.parse(user.onboardingData);
      } catch (err) {
        console.warn("Could not parse user.onboardingData:", err);
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      onboardingStep: user.onboardingStep || 1,
      onboardingData: parsedData,
      onboardingCompleted: user.onboardingCompleted,
    });
  } catch (error) {
    console.error("GET /api/onboarding/progress error:", error);
    return NextResponse.json(
      { error: "Failed to load onboarding progress" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const body = await req.json().catch(() => ({}));
    const { step, data, completed } = body;

    const validatedStep = typeof step === "number" && step >= 1 && step <= 5 ? step : 1;

    // If candidate has an active session, persist directly to User record
    if (session?.user?.id) {
      const userId = session.user.id;

      // Merge with any existing draft data
      let mergedDataStr = undefined;
      if (data !== undefined) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { onboardingData: true },
        });

        let existingObj: Record<string, any> = {};
        if (currentUser?.onboardingData) {
          try {
            existingObj = JSON.parse(currentUser.onboardingData);
          } catch {
            existingObj = {};
          }
        }

        const merged = { ...existingObj, ...(data || {}) };
        mergedDataStr = JSON.stringify(merged);
      }

      const updatePayload: any = {
        onboardingStep: validatedStep,
      };

      if (mergedDataStr !== undefined) {
        updatePayload.onboardingData = mergedDataStr;
      }

      if (completed === true) {
        updatePayload.onboardingCompleted = true;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updatePayload,
      });

      return NextResponse.json({
        success: true,
        persistedToDb: true,
        onboardingStep: validatedStep,
      });
    }

    // For unauthenticated candidates, acknowledge saving (client persists in localStorage)
    return NextResponse.json({
      success: true,
      persistedToDb: false,
      onboardingStep: validatedStep,
    });
  } catch (error) {
    console.error("POST /api/onboarding/progress error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding progress" },
      { status: 500 }
    );
  }
}
