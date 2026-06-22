import { useRef, useState, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, User } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { askMoksha } from "@/lib/ai";
import { makeId } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "What is Caarya and how do pods work?",
  "How does HIVE research scoring work?",
  "Explain the Rolodex outreach pipeline",
  "What is sponsorship leverage?",
];

export default function AskMoksha() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      content:
        "Hi! I'm Ask Moksha. Ask me anything about Caarya, your pod, or how to use this portal — research, outreach, talent, opportunities, partners and sponsorship leverage.",
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSource, setLastSource] = useState<"ai" | "local" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const userMsg: ChatMessage = { id: makeId("m"), role: "user", content: q, ts: new Date().toISOString() };
    const history = messages;
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { answer, source } = await askMoksha(q, history);
      setLastSource(source);
      setMessages((m) => [...m, { id: makeId("m"), role: "assistant", content: answer, ts: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col">
      <PageHeader
        icon={Sparkles}
        title="Ask Moksha"
        description="Your in-app guide to Caarya and this pod workspace."
        actions={
          lastSource && (
            <Badge tone={lastSource === "ai" ? "good" : "amber"}>
              {lastSource === "ai" ? "Live · chirag-ai" : "Demo · offline"}
            </Badge>
          )
        }
      />

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  m.role === "user" ? "bg-surface-3 text-ink" : "bg-gradient-to-br from-ruby-bright to-amber text-[#1a0c10]"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-surface-3 text-ink"
                    : "border border-line bg-surface-2 text-ink-muted"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ruby-bright to-amber text-[#1a0c10]">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink-faint">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink-muted hover:border-ruby/40 hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-line p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Caarya, pods, or this portal…"
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
