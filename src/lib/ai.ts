import { TOKEN_KEY } from "@/lib/constants";
import type { ChatMessage } from "./types";
import {
  answerAdminBiQuestion,
  buildBiContextBlock,
  getAdminBiSnapshot,
  OFFLINE_BI_FALLBACK,
} from "@/lib/mokshaBi";

/**
 * Moksha BI for Pod Admin. Calls chirag-ai when configured; otherwise answers
 * from live admin dashboard / portfolio / challenge / partner APIs.
 */

const AI_URL = (import.meta.env.VITE_AI_URL as string) || "";

const SYSTEM_PROMPT = `You are Moksha, the business intelligence copilot for Caarya Pod Admin.
Your job is to help operators understand network health, pod activity, challenges, partners, research throughput, quarterly goals, and what to do next.
Quarterly Goals playbook for any pod: 1 Experience Studio cohort (8 observership seats), 1 CASTLE cohort (8 apprenticeship seats; Entrepreneurship, Tech, or Marketing), 5 Fusion Work Study placements; close 5 industry partners via 80 HIVE profiles (10/week) and 50 Rolodex outreaches (6/week); publish 4 content pieces/week (2 educational, 1 partnership, 1 promotional = 32 in 8 weeks); 2 academic partnerships/month, 50 brand engagement specialists, 10 nano-influencers; 2 campus company partnerships featured in TISA Uprise; 2–3 events reaching 80–100 students.
Use only the ADMIN DATA JSON provided in the conversation context. Be concise, use bullet points, cite numbers, and name pods when relevant.
If data is missing, say what you cannot see and suggest which admin screen to open (Dashboard, Pods, Challenge Vault, Partnerships, Quarterly Goals).
Do not give generic tutorials about Caarya unless asked; default to operational insights and recommendations.`;

export async function askMoksha(
  question: string,
  history: ChatMessage[] = [],
): Promise<{ answer: string; source: "ai" | "local"; usedLiveData: boolean }> {
  const snapshot = await getAdminBiSnapshot();
  const token = localStorage.getItem(TOKEN_KEY);

  if (AI_URL && token) {
    try {
      const contextBlock = snapshot
        ? `\n\nADMIN DATA (JSON, treat as source of truth):\n${buildBiContextBlock(snapshot)}`
        : "\n\nADMIN DATA: unavailable — say so briefly.";
      const res = await fetch(`${AI_URL}/sphinx/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          system: SYSTEM_PROMPT + contextBlock,
          messages: [
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: question },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const answer =
          data.answer || data.output || data.content || data.choices?.[0]?.message?.content;
        if (answer) return { answer: String(answer), source: "ai", usedLiveData: Boolean(snapshot) };
      }
    } catch {
      /* fall through to local BI */
    }
  }

  if (snapshot) {
    const biAnswer = answerAdminBiQuestion(question, snapshot);
    if (biAnswer) return { answer: biAnswer, source: "local", usedLiveData: true };
    return {
      answer:
        formatGenericBi(snapshot) +
        "\n\nAsk a sharper question — e.g. what happened today, open challenges, new partners, or what to do next.",
      source: "local",
      usedLiveData: true,
    };
  }

  return { answer: OFFLINE_BI_FALLBACK, source: "local", usedLiveData: false };
}

function formatGenericBi(snapshot: NonNullable<Awaited<ReturnType<typeof getAdminBiSnapshot>>>): string {
  return answerAdminBiQuestion("give me insights", snapshot) ?? OFFLINE_BI_FALLBACK;
}
