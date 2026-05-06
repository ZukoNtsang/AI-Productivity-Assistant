import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Send,
  Loader2,
  Mail,
  ListChecks,
  FileText,
  Lightbulb,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Aura — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Aura is your friendly AI workplace assistant — draft emails, summarize meetings, plan tasks, and simplify complex topics in seconds.",
      },
    ],
  }),
});

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  {
    icon: Mail,
    label: "Draft an email",
    prompt:
      "Help me draft a professional email. Ask me a couple of quick questions first (recipient, goal, tone).",
  },
  {
    icon: FileText,
    label: "Summarize notes",
    prompt:
      "I'll paste meeting notes and you give me a TL;DR, key points, and action items with owners and due dates. Ready when I am.",
  },
  {
    icon: ListChecks,
    label: "Plan my day",
    prompt:
      "Help me plan a focused workday. Ask me what's on my plate, then give me a prioritized plan with time estimates.",
  },
  {
    icon: Lightbulb,
    label: "Explain simply",
    prompt:
      "I'll give you a complex topic and you explain it simply, like I'm a smart non-expert. What's the topic?",
  },
];

function Index() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast.error(err.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      let done = false;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const update = (chunk: string) => {
        assistant += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistant };
          return copy;
        });
      };

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) update(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--gradient-soft)]">
      <header className="border-b border-border/60 backdrop-blur-sm bg-background/70 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-primary-foreground shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight">Aura</h1>
              <p className="text-xs text-muted-foreground leading-tight">
                Your AI workplace assistant
              </p>
            </div>
          </div>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="text-muted-foreground"
            >
              New chat
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            {isEmpty ? (
              <Welcome onPick={(p) => send(p)} />
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <Message key={i} msg={m} />
                ))}
                {isLoading &&
                  messages[messages.length - 1]?.role === "user" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aura is thinking…
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-ring/40 transition"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask Aura to draft an email, summarize notes, plan your day…"
                rows={1}
                className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 px-2 py-2 text-sm"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 rounded-xl shrink-0"
                style={{ background: "var(--gradient-hero)" }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Aura can be wrong — verify important details before acting.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (p: string) => void }) {
  return (
    <div className="text-center py-8 sm:py-14">
      <div
        className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-primary-foreground mb-6 shadow-[var(--shadow-elegant)]"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
        Hi, I'm Aura.
      </h2>
      <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
        A friendly AI teammate that helps you draft, summarize, plan, and think
        clearly — so you can focus on the work that matters.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 max-w-xl mx-auto text-left">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.label}
            onClick={() => onPick(q.prompt)}
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-[var(--shadow-soft)] transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-secondary text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                <q.icon className="h-4 w-4" />
              </div>
              <span className="font-medium text-sm">{q.label}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
              {q.prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-xs font-medium ${
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "text-primary-foreground"
        }`}
        style={
          isUser ? undefined : { background: "var(--gradient-hero)" }
        }
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm shadow-[var(--shadow-soft)]"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="markdown">
            {msg.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
