/** Runtime configuration for the admin dashboard auth and shared demo data. */

const env = import.meta.env;

/** Dedicated backend auth base, including the /api suffix. */
export const AUTH_API_URL: string =
  (env.VITE_AUTH_API_URL as string) || "http://127.0.0.1:4000/api";

/** chirag-ai LLM proxy base (optional) for the "Ask Moksha" agent. */
export const AI_URL: string = (env.VITE_AI_URL as string) || "";

export const TOKEN_KEY = "podops.token";
export const USER_KEY = "podops.user";
