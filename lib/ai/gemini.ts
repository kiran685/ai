/**
 * Gemini AI Client Module
 *
 * Encapsulates communication with Google Generative Language APIs,
 * structured JSON output decoding, and resilient fallback handling.
 */

export interface GeminiClientOptions {
  model?: string;
  temperature?: number;
  systemInstruction?: string;
}

const DEFAULT_MODEL = "gemini-1.5-flash";

/**
 * Checks if the Gemini API key is configured in the environment.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

/**
 * Cleans potential markdown fences around JSON responses.
 */
export function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Executes a structured JSON prompt against the Gemini API.
 *
 * @param prompt The prompt instruction requesting JSON.
 * @param fallback Optional fallback object to return if the API call fails or key is missing.
 * @param options Optional model or temperature configurations.
 * @returns Parsed JSON response of type T.
 */
export async function generateGeminiJson<T>(
  prompt: string,
  fallback?: T,
  options?: GeminiClientOptions
): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[Gemini Client] GEMINI_API_KEY is not set.");
    if (fallback !== undefined) return fallback;
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }

  const model = options?.model || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
      const errorBody = await response.text().catch(() => "");
      console.error(`[Gemini Client] API error (${response.status}):`, errorBody);
      if (fallback !== undefined) return fallback;
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.warn("[Gemini Client] Empty response content from candidate.");
      if (fallback !== undefined) return fallback;
      throw new Error("Gemini returned an empty response.");
    }

    const cleaned = cleanJsonResponse(candidateText);
    const parsed = JSON.parse(cleaned) as T;
    return parsed;
  } catch (error) {
    console.error("[Gemini Client] Execution error:", error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}
