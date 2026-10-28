import { useEffect, useRef, useState } from "react";
import { Loader2, Send, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { askMoksha } from "@/lib/ai";
import { makeId } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Give me insights",
  "How are pods doing on quarterly goals?",
  "Show me what happened this week",
  "Show me what happened today",
  "What challenges are pods facing?",
  "Did we get any new partners?",
  "How many pods haven't submitted research today?",
  "Tell me what I should do next",
];

const WELCOME: ChatMessage = {
  id: "m0",
  role: "assistant",
  content:
    "I'm Moksha — your Pod Admin business intelligence copilot. I pull from live dashboard, challenge, and partner data to summarize what's happening across the network and what deserves your attention next.",
  ts: new Date().toISOString(),
};

export function MokshaChatPanel({ className }: { className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSource, setLastSource] = useState<"ai" | "local" | null>(null);
  const [usedLiveData, setUsedLiveData] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const userMsg: ChatMessage = { id: makeId("m"), role: "user", content: q, ts: new Date().toISOString() };
    const history = messages;
    setMessages((current) => [...current, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { answer, source, usedLiveData: live } = await askMoksha(q, history);
      setLastSource(source);
      setUsedLiveData(live);
      setMessages((current) => [
        ...current,
        { id: makeId("m"), role: "assistant", content: answer, ts: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className ?? ""}`}>
      {lastSource ? (
        <div className="mb-3 shrink-0">
          <Badge tone={lastSource === "ai" || usedLiveData ? "good" : "amber"}>
            {lastSource === "ai"
              ? "Live · AI + admin data"
              : usedLiveData
                ? "BI · live admin data"
                : "Offline"}
          </Badge>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                message.role === "user" ? "bg-surface-3 text-ink" : "border border-line bg-surface"
              }`}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <img src="/moksha-icon.png" alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user" ? "bg-surface-3 text-ink" : "border border-line bg-surface-2 text-ink-muted"
              }`}
            >
              <span className="whitespace-pre-wrap">{message.content}</span>
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-line bg-surface">
              <img src="/moksha-icon.png" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink-faint">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void send(suggestion)}
              className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-left text-xs text-ink-muted hover:border-ruby/40 hover:text-ink"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
        className="mt-3 flex shrink-0 items-center gap-2"
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask for insights, today's activity, challenges…"
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
