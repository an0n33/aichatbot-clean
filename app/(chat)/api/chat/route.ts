import { NextRequest } from "next/server";

// Minimal fallback: if no provider keys are set, return a mock assistant reply.
export async function POST(req: NextRequest) {
  try {
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

    // If keys exist but no real handler is wired yet:
    return Response.json(
      { error: "Providers configured but route logic not added yet." },
      { status: 500 }
    );
  } catch (e: any) {
    return Response.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

// Optional GET to sanity-check in browser
export async function GET() {
  return Response.json({ ok: true }, { status: 200 });
}

// Safe fallback so stream route import doesn't explode in production
export function getStreamContext() {
  return {};
}
