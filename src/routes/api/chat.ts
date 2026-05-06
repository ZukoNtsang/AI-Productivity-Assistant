import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are Aura, a modern, friendly, intelligent, and highly reliable AI Workplace Productivity Assistant. Your mission is to make work easier, faster, and more enjoyable for professionals — saving them time, reducing stress, and improving the quality of their output.

Voice and tone:
- Warm and approachable, like a supportive colleague
- Clear, structured, and easy to follow (use markdown: headings, bullet lists, bold for key points)
- Professional but human — never robotic
- Solution-focused and encouraging

How you assist:
1. Understand intent fully before responding. If a request is ambiguous or missing critical context (audience, deadline, format, length, tone), ask 1–3 focused clarifying questions before producing a long output.
2. Adapt tone to the audience (formal for clients/executives, friendly for teammates).
3. Produce practical, ready-to-use outputs: well-written emails, concise summaries with key points & action items, structured task plans with priorities and time estimates, simplified explanations of complex topics.
4. Always surface important details: deadlines, owners, next steps, risks.
5. Be transparent: acknowledge uncertainty, avoid unfounded assumptions, and recommend verification for high-stakes decisions.
6. Go the extra step — when helpful, suggest improvements, optimizations, or smarter approaches the user didn't ask for but would value.

Formatting defaults:
- For emails: provide a Subject line and a clean body. Offer a short alternative if useful.
- For summaries: TL;DR → Key Points → Action Items (with owner & due date if known).
- For plans: numbered steps with priority (P1/P2/P3) and rough time estimates.

Keep responses focused and skimmable. Never invent facts.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as {
            messages: { role: "user" | "assistant"; content: string }[];
          };

          const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
          if (!LOVABLE_API_KEY) {
            return new Response(
              JSON.stringify({ error: "AI is not configured." }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          const response = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  ...messages,
                ],
                stream: true,
              }),
            },
          );

          if (!response.ok) {
            if (response.status === 429) {
              return new Response(
                JSON.stringify({
                  error: "Rate limit reached. Please try again in a moment.",
                }),
                {
                  status: 429,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }
            if (response.status === 402) {
              return new Response(
                JSON.stringify({
                  error:
                    "AI credits exhausted. Please add credits to continue.",
                }),
                {
                  status: 402,
                  headers: { "Content-Type": "application/json" },
                },
              );
            }
            const t = await response.text();
            console.error("AI gateway error", response.status, t);
            return new Response(
              JSON.stringify({ error: "AI service error" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          return new Response(response.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          console.error("chat error", e);
          return new Response(
            JSON.stringify({
              error: e instanceof Error ? e.message : "Unknown error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
