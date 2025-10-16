import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const noKeys =
    !process.env.OPENAI_API_KEY &&
    !process.env.TOGETHER_API_KEY &&
    !process.env.ANTHROPIC_API_KEY &&
    !process.env.GROQ_API_KEY;

  if (noKeys) {
    const last = Array.isArray(body?.messages) ? body.messages.at(-1) : null;
    const userText = typeof last?.content === "string" ? last.content : "";
    const reply =
      "👋 Mock reply (no API key set). I received: " +
      (userText ? userText.slice(0, 200) : "(no message)") +
      " …";

    return Response.json(
      {
        id: "mock-" + Date.now(),
        created: Date.now(),
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: reply },
            finish_reason: "stop",
          },
        ],
      },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  }

  // If keys exist but real provider logic isnt wired here:
  return Response.json(
    { error: "Providers configured but chat route not implemented yet." },
    { status: 500 }
  );
}

// Handy for quick checks in the browser
export async function GET() {
  return Response.json({ ok: true }, { status: 200 });
}
