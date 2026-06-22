import { AI_URL, TOKEN_KEY } from "@/config/env";
import type { ChatMessage } from "./types";

/**
 * "Ask Moksha" agent. Calls chirag-ai's `/sphinx/chat` (or `/llm/raw`) when an
 * AI base URL + token are configured; otherwise falls back to a helpful local
 * knowledge responder so the feature always works in demo mode.
 */

const SYSTEM_PROMPT = `You are "Ask Moksha", the in-app assistant for Caarya pods.
Caarya runs student-led "pods" inside colleges. Pods research startups & brands,
run outreach via a Rolodex, maintain a talent map to place students, post job
opportunities, and build academic (clubs/councils) and industry partnerships.
Answer questions about Caarya, pods, and how to use this portal concisely and warmly.`;

export async function askMoksha(
  question: string,
  history: ChatMessage[] = [],
): Promise<{ answer: string; source: "ai" | "local" }> {
  const token = localStorage.getItem(TOKEN_KEY);

  if (AI_URL && token) {
    try {
      const res = await fetch(`${AI_URL}/sphinx/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
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
        if (answer) return { answer: String(answer), source: "ai" };
      }
    } catch {
      /* fall through to local */
    }
  }

  return { answer: localAnswer(question), source: "local" };
}

function localAnswer(q: string): string {
  const text = q.toLowerCase();
  for (const entry of KNOWLEDGE) {
    if (entry.match.some((m) => text.includes(m))) return entry.answer;
  }
  return (
    "I'm running in offline demo mode right now, so I can answer from a small " +
    "built-in knowledge base about Caarya pods. Try asking about: research & HIVE " +
    "scoring, the Rolodex outreach pipeline, the talent map, job opportunities, " +
    "academic vs industry partners, or sponsorship leverage. Connect the chirag-ai " +
    "service (set VITE_AI_URL) to enable full answers."
  );
}

const KNOWLEDGE: { match: string[]; answer: string }[] = [
  {
    match: ["what is caarya", "about caarya", "who is caarya"],
    answer:
      "Caarya builds student-led 'pods' inside colleges. Each pod operates like a tiny venture studio: it researches startups & brands, runs outreach, maps and places talent, shares opportunities, and grows academic + industry partnerships.",
  },
  {
    match: ["pod", "what is a pod"],
    answer:
      "A pod is a college-based team of students that runs real operations: HIVE research on startups/brands, a Rolodex outreach CRM, a talent map to place people, a job opportunity canvas, and a partner network of clubs, councils and companies.",
  },
  {
    match: ["hive", "research", "score", "scoring"],
    answer:
      "HIVE is the research module. You profile a startup or brand across founder, social, product, culture and funding, then score it on 5 weighted criteria (max 100). Bands: 80+ Priority, 60–79 Strong, 40–59 Watchlist, <40 Skip. Strong leads get pushed into the Rolodex.",
  },
  {
    match: ["rolodex", "outreach", "pipeline", "follow"],
    answer:
      "The Rolodex is a 7-stage outreach pipeline: To Contact → Outreach Sent → In Conversation → Meeting Booked → Proposal Sent → Partner Won (or Passed). Each contact tracks a hypothesis, next action + date, channel and an activity log.",
  },
  {
    match: ["talent", "place", "placement"],
    answer:
      "The Talent Map tracks pod members and partner students by skill, level and availability (Available / Engaged / Placed / Bench). Use it to staff opportunities and to show academic partners a live map of their own talent.",
  },
  {
    match: ["job", "opportunit", "canvas"],
    answer:
      "The Job Opportunity Canvas is where a pod posts internships, freelance gigs and projects, then shares them to channels for fellow students. Each card tracks seats, applicants and where it's been shared.",
  },
  {
    match: ["partner", "club", "council", "academic", "industry"],
    answer:
      "Partners are split into Academic (clubs, councils, colleges, communities) and Industry (companies, incubators). Academic partners can be given a Sponsorship Leverage dashboard and their own talent map.",
  },
  {
    match: ["sponsorship", "leverage"],
    answer:
      "Sponsorship Leverage shows an academic partner the total value of assets a pod can mobilise for them — reach, events, content, talent — with each asset's audience, format and status (Available / Committed / Delivered).",
  },
];
