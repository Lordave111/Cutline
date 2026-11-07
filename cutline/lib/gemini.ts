type GeminiMessage = { role: "user" | "model"; text: string };

const MODEL = "gemini-3.8-flash";

export async function generateWithGemini(
  messages: GeminiMessage[],
  systemInstruction: string,
  maxOutputTokens = 900,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured. Add GEMINI_API_KEY in Vercel project environment variables.");

  const conversation = messages
    .filter((message) => typeof message.text === "string" && message.text.trim())
    .map((message) => ({ ...message, text: message.text.slice(0, 2500) }));

  // Gemini conversation history must begin with a user turn. The UI's welcome
  // message is presentation-only, so discard any leading model turn.
  while (conversation[0]?.role === "model") conversation.shift();
  if (!conversation.length || conversation[0].role !== "user") {
    throw new Error("Please enter a message.");
  }

  const contents = conversation.map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          maxOutputTokens,
          thinkingConfig: { thinkingLevel: "LOW" },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    },
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Google Gemini rejected the API key. Check GEMINI_API_KEY in Vercel.");
    }
    if (response.status === 429) {
      throw new Error("Gemini is currently rate-limited. Please wait a moment and try again.");
    }
    throw new Error(data?.error?.message || `Gemini request failed (HTTP ${response.status}).`);
  }

  const result = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim();
  if (!result) throw new Error("Gemini returned an empty response. Please try again.");
  return result;
}
