# Aura — AI Workplace Productivity Assistant

Aura is a modern, friendly, and highly reliable AI assistant designed to make work easier, faster, and more enjoyable. It helps professionals draft emails, summarize meetings, plan their day, and explain complex topics — all through a clean, streaming chat interface.

> Save time. Reduce stress. Ship better work.

---

## ✨ Features

- **Warm, supportive AI persona** — tuned to feel like a helpful colleague, not a robotic chatbot.
- **Streaming responses** — answers appear in real time for a fluid experience.
- **Quick-start prompts** — one-click actions for common tasks:
  - 📧 Draft an email
  - 📝 Summarize notes (TL;DR + key points + action items)
  - ✅ Plan my day (prioritized tasks with time estimates)
  - 💡 Explain simply (complex topics in plain language)
- **Structured outputs** — markdown rendering with headings, lists, tables, and emphasis.
- **Honest & transparent** — acknowledges uncertainty and recommends verification for high-stakes decisions.
- **Responsive UI** — works beautifully on desktop, tablet, and mobile.

---

## 🛠 Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7, SSR + server functions)
- **Styling:** Tailwind CSS v4 with a custom OKLCH design system
- **UI Components:** shadcn/ui + lucide-react icons
- **Markdown:** react-markdown + remark-gfm
- **Backend:** Lovable Cloud (Supabase) for auth/data + Lovable AI Gateway for LLM access
- **Model:** `google/gemini-3-flash-preview` (configurable in `src/routes/api/chat.ts`)
- **Deployment:** Cloudflare Workers (edge)

---


---

## 📁 Project Structure

```
src/
├── routes/
│   ├── __root.tsx          # Root layout (head, html shell)
│   ├── index.tsx           # Aura chat UI
│   └── api/
│       └── chat.ts         # Streaming chat endpoint (calls AI gateway)
├── components/ui/          # shadcn/ui components
├── integrations/supabase/  # Auto-generated Supabase client
└── styles.css              # Design tokens, gradients, markdown styles
```

---

## 🎨 Customizing Aura

- **Persona / tone** — edit the `SYSTEM_PROMPT` in `src/routes/api/chat.ts`.
- **Quick prompts** — update the `QUICK_PROMPTS` array in `src/routes/index.tsx`.
- **Theme** — adjust OKLCH tokens and gradients in `src/styles.css`.
- **Model** — swap the `model` field in the chat API (any model supported by Lovable AI Gateway).

---


