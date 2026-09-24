import { cleanJsonResponse } from "./gemini";

export interface OmniRouteOptions {
  model?: string;
  temperature?: number;
  systemInstruction?: string;
}

const DEFAULT_MODEL = "gemini-1.5-flash";

/**
 * Server-side AI abstraction for OmniRoute / LLM execution.
 * Respects OMNIROUTE_API_KEY if provided; falls back to GEMINI_API_KEY.
 * Never leaks keys to client code.
 */
export async function generateOmniRouteJson<T>(
  prompt: string,
  fallback?: T,
  options?: OmniRouteOptions
): Promise<T> {
  const apiKey = process.env.OMNIROUTE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    console.warn("[OmniRoute] Neither OMNIROUTE_API_KEY nor GEMINI_API_KEY is configured.");
    if (fallback !== undefined) return fallback;
    throw new Error("Server-side AI API key is not configured in the environment.");
  }

  const model = options?.model || DEFAULT_MODEL;
  // OmniRoute endpoint or Google Generative Language gateway
  const baseUrl = process.env.OMNIROUTE_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const endpoint = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;

  try {
    const payload: Record<string, any> = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: options?.temperature ?? 0.2,
      },
    };

    if (options?.systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.warn(`[OmniRoute] Gateway returned status ${response.status}:`, errorText);
      if (fallback !== undefined) return fallback;
      throw new Error(`AI request failed with status ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      if (fallback !== undefined) return fallback;
      throw new Error("AI returned empty content.");
    }

    const cleaned = cleanJsonResponse(candidateText);
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.warn("[OmniRoute] AI request failed, falling back to deterministic plan:", error);
    if (fallback !== undefined) return fallback;
    throw error;
  }
}
