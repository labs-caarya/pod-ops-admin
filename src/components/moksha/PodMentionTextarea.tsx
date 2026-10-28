import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { College, PodComment } from "@/lib/api";
import type { PodLeaderOption } from "@/lib/podLeaders";
import {
  activeComposeTrigger,
  filterLeadersForMention,
  filterPodsForMention,
  filterVisibilityForMention,
  roleSlashToken,
  visibilitySlashToken,
  VISIBILITY_SLASH_OPTIONS,
  type ComposeTrigger,
  type SlashMode,
} from "@/lib/podMentions";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/Field";

const MENU_MAX_HEIGHT = 176;

export function PodMentionTextarea({
  value,
  onChange,
  pods,
  leaders = [],
  slashMode = "none",
  onMentionPod,
  onMentionLeader,
  onMentionVisibility,
  disabled,
  placeholder,
  rows = 4,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  pods: College[];
  leaders?: PodLeaderOption[];
  slashMode?: SlashMode;
  onMentionPod?: (pod: College) => void;
  onMentionLeader?: (leader: PodLeaderOption) => void;
  onMentionVisibility?: (visibility: PodComment["visibility"]) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [trigger, setTrigger] = useState<ComposeTrigger | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [menuRect, setMenuRect] = useState<{
    anchorTop: number;
    anchorBottom: number;
    left: number;
    width: number;
    placement: "below" | "above";
  } | null>(null);

  const podSuggestions = useMemo(
    () => (trigger?.type === "pod" ? filterPodsForMention(pods, trigger.query) : []),
    [trigger, pods],
  );
  const roleSuggestions = useMemo(
    () => (trigger?.type === "role" ? filterLeadersForMention(leaders, trigger.query) : []),
    [trigger, leaders],
  );
  const visibilitySuggestions = useMemo(
    () => (trigger?.type === "visibility" ? filterVisibilityForMention(trigger.query) : []),
    [trigger],
  );

  const suggestions =
    trigger?.type === "pod"
      ? podSuggestions
      : trigger?.type === "role"
        ? roleSuggestions
        : visibilitySuggestions;
  const showMenu = Boolean(trigger && suggestions.length > 0);

  useEffect(() => {
    setHighlightIndex(0);
  }, [trigger?.query, trigger?.type, suggestions.length]);

  useLayoutEffect(() => {
    if (!showMenu || !textareaRef.current) {
      setMenuRect(null);
      return;
    }

    function updateMenuRect() {
      const el = textareaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placement =
        spaceBelow >= MENU_MAX_HEIGHT + 12 || spaceBelow >= spaceAbove ? "below" : "above";
      setMenuRect({
        anchorTop: rect.top,
        anchorBottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        placement,
      });
    }

    updateMenuRect();
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [showMenu, trigger?.query, value]);

  function syncTriggerState(nextValue: string, cursor: number) {
    const active = activeComposeTrigger(nextValue, cursor, slashMode);
    if (active?.type === "role" && !leaders.length) {
      setTrigger(null);
      return;
    }
    setTrigger(active);
  }

  function closeMenu() {
    setTrigger(null);
    setMenuRect(null);
  }

  function insertToken(start: number, cursor: number, token: string) {
    const before = value.slice(0, start);
    const after = value.slice(cursor);
    const next = before + token + after;
    onChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = before.length + token.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function applyPod(pod: College) {
    if (trigger?.type !== "pod") return;
    closeMenu();
    insertToken(trigger.start, textareaRef.current?.selectionStart ?? value.length, `@${pod.name} `);
    onMentionPod?.(pod);
  }

  function applyLeader(leader: PodLeaderOption) {
    if (trigger?.type !== "role") return;
    closeMenu();
    insertToken(trigger.start, textareaRef.current?.selectionStart ?? value.length, roleSlashToken(leader));
    onMentionLeader?.(leader);
  }

  function applyVisibility(option: (typeof VISIBILITY_SLASH_OPTIONS)[number]) {
    if (trigger?.type !== "visibility") return;
    closeMenu();
    insertToken(trigger.start, textareaRef.current?.selectionStart ?? value.length, visibilitySlashToken(option));
    onMentionVisibility?.(option.visibility);
  }

  function applyHighlighted() {
    if (!trigger || !suggestions.length) return;
    if (trigger.type === "pod") applyPod(podSuggestions[highlightIndex]);
    else if (trigger.type === "role") applyLeader(roleSuggestions[highlightIndex]);
    else applyVisibility(visibilitySuggestions[highlightIndex]);
  }

  const menuHeader =
    trigger?.type === "pod"
      ? `Pods matching @${trigger.query || "…"}`
      : trigger?.type === "role"
        ? `Roles matching /${trigger.query || "…"}`
        : `Audience /${trigger?.query || "…"}`;

  const menu =
    showMenu && menuRect && trigger
      ? createPortal(
          <ul
            className="fixed z-[100] max-h-44 overflow-y-auto rounded-xl border border-line bg-base-2 py-1 shadow-xl"
            style={{
              top: menuRect.placement === "below" ? menuRect.anchorBottom + 6 : menuRect.anchorTop - 6,
              left: menuRect.left,
              width: menuRect.width,
              transform: menuRect.placement === "above" ? "translateY(-100%)" : undefined,
            }}
            role="listbox"
            aria-label={menuHeader}
          >
            <li className="border-b border-line px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              {menuHeader}
            </li>
            {trigger.type === "pod"
              ? podSuggestions.map((pod, index) => (
                  <li key={pod.id} role="option" aria-selected={index === highlightIndex}>
                    <button
                      type="button"
                      className={cn(
                        "focus-ring flex w-full px-3 py-2 text-left text-sm",
                        index === highlightIndex ? "bg-surface-3 text-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applyPod(pod)}
                    >
                      {pod.name}
                    </button>
                  </li>
                ))
              : trigger.type === "role"
                ? roleSuggestions.map((leader, index) => (
                    <li key={leader.key} role="option" aria-selected={index === highlightIndex}>
                      <button
                        type="button"
                        className={cn(
                          "focus-ring flex w-full flex-col px-3 py-2 text-left text-sm",
                          index === highlightIndex ? "bg-surface-3 text-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyLeader(leader)}
                      >
                        <span>{leader.label}</span>
                      </button>
                    </li>
                  ))
                : visibilitySuggestions.map((option, index) => (
                    <li key={option.key} role="option" aria-selected={index === highlightIndex}>
                      <button
                        type="button"
                        className={cn(
                          "focus-ring flex w-full flex-col px-3 py-2 text-left text-sm",
                          index === highlightIndex ? "bg-surface-3 text-ink" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyVisibility(option)}
                      >
                        <span className="font-medium">/{option.slash}</span>
                        <span className="text-xs text-ink-muted">{option.label}</span>
                      </button>
                    </li>
                  ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => {
          onChange(event.target.value);
          syncTriggerState(event.target.value, event.target.selectionStart ?? event.target.value.length);
        }}
        onClick={(event) => {
          const target = event.target as HTMLTextAreaElement;
          syncTriggerState(value, target.selectionStart ?? value.length);
        }}
        onKeyUp={(event) => {
          const target = event.target as HTMLTextAreaElement;
          syncTriggerState(value, target.selectionStart ?? value.length);
        }}
        onKeyDown={(event) => {
          if (!trigger || !suggestions.length) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightIndex((current) => (current + 1) % suggestions.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
          } else if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            applyHighlighted();
          } else if (event.key === "Escape") {
            event.preventDefault();
            closeMenu();
          }
        }}
      />
      {menu}
    </div>
  );
}
