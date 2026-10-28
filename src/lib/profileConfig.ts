export const PROFICIENCY_LABELS = ["Novice", "Developing", "Competent", "Advanced", "Expert"] as const;

export const TRANSFERABLE_SKILL_CATEGORIES = [
  {
    category: "Learning & Insight",
    skills: ["Effective Listening", "Strategic Learning"],
  },
  {
    category: "Analysis & Problem Solving",
    skills: ["Problem Solving", "Critical Thinking"],
  },
  {
    category: "Creation & Development",
    skills: ["Creativity", "Innovation"],
  },
] as const;

export const HUMAN_CENTRICITY_QUESTIONS = [
  { id: "needs", text: "I seek to understand people's needs before proposing solutions." },
  { id: "listening", text: "I actively listen and verify that I understand different perspectives." },
  { id: "inclusion", text: "I consider accessibility and inclusion when making decisions." },
  { id: "feedback", text: "I test ideas with affected people and use their feedback to improve." },
  { id: "balance", text: "I balance user needs with business and technical constraints." },
] as const;

export const HUMAN_LABELS = ["Emerging", "Developing", "Competent", "Advanced", "Exemplary"] as const;

export const ENGAGEMENT_GIGS = [
  { id: "focus-group-testing", title: "Focus Group Testing" },
  { id: "market-research", title: "Market Research" },
  { id: "user-interviews", title: "User Interviews" },
  { id: "product-testing", title: "Product Testing" },
] as const;

export const CAREER_LOOKING_OPTIONS = [
  { id: "exploring-careers", title: "Exploring careers" },
  { id: "first-experience", title: "Gaining your first experience" },
  { id: "industrial-work", title: "Industrial work" },
] as const;
