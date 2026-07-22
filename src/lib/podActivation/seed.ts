import type { PodActivationCategoryId } from "./categories";
import type { PodActivationItemTemplate } from "./types";

type SeedRow = {
  type: "learn" | "do";
  title: string;
  description: string;
  materialUrl?: string;
  artifactSchema?: PodActivationItemTemplate["artifactSchema"];
};

const CATEGORY_ITEMS: Record<PodActivationCategoryId, SeedRow[]> = {
  "understand-the-why": [
    { type: "learn", title: "Why Caarya pods exist", description: "Learn the mission behind student-led pods and the change we're building on campus.", materialUrl: "https://caarya.com" },
    { type: "learn", title: "The pod operating model", description: "Understand how research, talent, and network work together in a Caarya pod.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Write your pod's why statement", description: "Draft a one-page why that your crew can rally around.", artifactSchema: "pod_why" },
    { type: "learn", title: "Stories from active pods", description: "Read how pods like yours went from zero to their first wins.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Present your why to your crew", description: "Share your why statement with the pod and capture feedback.", artifactSchema: "freeform_doc" },
  ],
  "understand-the-what": [
    { type: "learn", title: "HIVE, Rolodex, and Talent Map", description: "Tour the core modules you'll use every week.", materialUrl: "/research" },
    { type: "learn", title: "Level-up and pod maturity", description: "Learn how pods progress from activation through Level 4+.", materialUrl: "/knowledge-space/leveling-up" },
    { type: "do", title: "Map your first 30-day plan", description: "Outline what your pod will ship in the first month.", artifactSchema: "thirty_day_plan" },
    { type: "learn", title: "Knowledge Space essentials", description: "Find playbooks, SOPs, and community guides.", materialUrl: "/knowledge-space" },
    { type: "do", title: "Submit your 30-day operating plan", description: "Finalize and publish your plan to your pod's knowledge space.", artifactSchema: "freeform_doc" },
  ],
  "set-your-vision": [
    { type: "learn", title: "Goal-setting frameworks", description: "Learn OKRs, SMART goals, and how pods set direction.", materialUrl: "https://docs.google.com/document/" },
    { type: "learn", title: "Vision vs goals vs tactics", description: "Separate long-term vision from quarterly objectives.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Set your pod vision statement", description: "Write where your pod is headed in 12 months.", artifactSchema: "pod_goals" },
    { type: "learn", title: "Measuring pod success", description: "Understand the level-up pillars and how progress is tracked.", materialUrl: "/knowledge-space/leveling-up" },
    { type: "do", title: "Submit pod goals for Level 1", description: "Define 3–5 measurable goals your pod will hit first.", artifactSchema: "pod_goals" },
  ],
  "construct-your-workflows": [
    { type: "learn", title: "Introduction to BPM", description: "Learn business process mapping for student teams.", materialUrl: "https://docs.google.com/document/" },
    { type: "learn", title: "Writing SOPs", description: "How to document repeatable pod workflows.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Document weekly standup workflow", description: "Create an SOP for your weekly pod standup.", artifactSchema: "workflows" },
    { type: "learn", title: "Handoffs between roles", description: "Learn clean handoffs between Exec, Ops, Talent, and Marketing leads.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Submit 3 core pod SOPs", description: "Publish standup, research handoff, and outreach follow-up SOPs.", artifactSchema: "workflows" },
  ],
  "design-your-culture": [
    { type: "learn", title: "Building team culture", description: "Learn how high-trust pods operate on campus.", materialUrl: "https://docs.google.com/document/" },
    { type: "learn", title: "Accountability rituals", description: "Standups, retros, and peer accountability that stick.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Define pod values", description: "Choose 3–5 values your pod will hold each other to.", artifactSchema: "culture_charter" },
    { type: "learn", title: "Feedback and conflict resolution", description: "Handle disagreements without breaking the crew.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Submit culture charter", description: "Publish values, norms, and accountability rules.", artifactSchema: "culture_charter" },
  ],
  "manifest-your-dream-clientele": [
    { type: "learn", title: "How to research brands", description: "Learn the HIVE research methodology.", materialUrl: "/research" },
    { type: "learn", title: "Scoring HIVE targets", description: "Understand gap match, pod fit, and when to push to Rolodex.", materialUrl: "/knowledge-space" },
    { type: "do", title: "List 10 dream companies", description: "Name the brands and startups your pod wants to partner with.", artifactSchema: "research_targets" },
    { type: "learn", title: "Industry vs campus companies", description: "Choose the right search targets for your pod's goals.", materialUrl: "/partners" },
    { type: "do", title: "Submit research targets", description: "Finalize targets — they populate your HIVE pre-research slots.", artifactSchema: "research_targets" },
  ],
  "architect-your-all-star-roster": [
    { type: "learn", title: "C-level roles in a pod", description: "Exec, Ops, Talent, Marketing, and Partner relations explained.", materialUrl: "https://docs.google.com/document/" },
    { type: "learn", title: "Role responsibilities", description: "What each leadership seat owns week to week.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Assign leadership roles", description: "Map names to each pod leadership seat.", artifactSchema: "role_map" },
    { type: "learn", title: "Succession and backup", description: "Plan coverage when leads are in exams or away.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Submit role distribution map", description: "Publish who owns what for the semester.", artifactSchema: "role_map" },
  ],
  "build-your-content-funnel": [
    { type: "learn", title: "Content marketing basics", description: "Learn how pods build visibility on campus and online.", materialUrl: "https://docs.google.com/document/" },
    { type: "learn", title: "Content buckets for pods", description: "Education, proof, culture, and opportunity content types.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Choose content offers", description: "Pick what you'll publish in each content bucket.", artifactSchema: "content_funnel" },
    { type: "learn", title: "Distribution channels", description: "LinkedIn, Instagram, WhatsApp, and campus channels.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Submit content funnel plan", description: "Publish your semester content calendar outline.", artifactSchema: "content_funnel" },
  ],
  "design-your-campaign": [
    { type: "learn", title: "Business goals → marketing goals", description: "Connect pod outcomes to campaign objectives.", materialUrl: "https://docs.google.com/document/" },
    { type: "learn", title: "Campaign design basics", description: "Audience, message, channel, and CTA.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Draft one pod campaign", description: "Design a campaign for talent, partners, or campus visibility.", artifactSchema: "campaign_plan" },
    { type: "learn", title: "Digital marketing fundamentals", description: "Tracking, UTMs, and measuring campaign efficacy.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Submit campaign plan with KPIs", description: "Publish business goals, marketing goals, and success metrics.", artifactSchema: "campaign_plan" },
  ],
  "build-your-network": [
    { type: "learn", title: "Outreach basics", description: "Warm intros, cold outreach, and follow-up rhythm.", materialUrl: "/rolodex" },
    { type: "learn", title: "Objection handling", description: "Respond to common pushback from clubs and partners.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "List partnership targets", description: "Clubs, societies, and campus orgs you want to partner with.", artifactSchema: "outreach_pitches" },
    { type: "learn", title: "Drafting pitch emails", description: "Templates for club partnerships and industry intros.", materialUrl: "https://docs.google.com/document/" },
    { type: "do", title: "Submit outreach pitches", description: "Publish draft pitches for your top 3 targets.", artifactSchema: "outreach_pitches" },
  ],
};

export function buildActivationTemplateSeed(): PodActivationItemTemplate[] {
  const items: PodActivationItemTemplate[] = [];
  for (const [categoryId, rows] of Object.entries(CATEGORY_ITEMS) as [PodActivationCategoryId, SeedRow[]][]) {
    rows.forEach((row, index) => {
      const sortOrder = index + 1;
      items.push({
        id: `pa_${categoryId}_${sortOrder}`,
        categoryId,
        sortOrder,
        type: row.type,
        title: row.title,
        description: row.description,
        materialUrl: row.materialUrl,
        materialType: row.materialUrl?.startsWith("http") ? "docs" : row.materialUrl ? "in-app" : undefined,
        artifactSchema: row.artifactSchema,
        shareWithCommunityDefault: row.type === "do",
        published: true,
      });
    });
  }
  return items;
}
