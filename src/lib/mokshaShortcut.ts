export const MOKSHA_OPEN_EVENT = "moksha:open";

export type MokshaPanelMode = "insights" | "tasks" | "comments";

export function isMokshaShortcut(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || !event.shiftKey) return false;
  return event.key.toLowerCase() === "m";
}

export function mokshaModeFromShortcut(event: KeyboardEvent): MokshaPanelMode | null {
  if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
  const key = event.key.toLowerCase();
  if (key === "i") return "insights";
  if (key === "t") return "tasks";
  if (key === "c") return "comments";
  return null;
}

export function shouldHandleMokshaModeShortcut(event: KeyboardEvent): boolean {
  return mokshaModeFromShortcut(event) !== null;
}

export const MOKSHA_MODE_SHORTCUT_HINT: Record<MokshaPanelMode, string> = {
  insights: "Alt+I",
  tasks: "Alt+T",
  comments: "Alt+C",
};

export function dispatchOpenMoksha() {
  window.dispatchEvent(new CustomEvent(MOKSHA_OPEN_EVENT));
}
