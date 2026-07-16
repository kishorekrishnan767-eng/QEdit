"use client";

/**
 * SpellCheckedTextarea.tsx
 *
 * Drop-in textarea/input with real-time offline spell-check.
 * Red dotted underlines via mirror overlay. Click detection via textarea
 * selectionStart so the popover always appears even though the textarea
 * sits on top of the mirror layer.
 */

import { useState, useEffect, useRef, useCallback, CSSProperties } from "react";
import { checkText, getSpellChecker, SpellError } from "@/lib/spellchecker";

// ── Types ────────────────────────────────────────────────────────────────────

interface Popover {
  errIdx: number;
  x: number;
  y: number;
}

interface SpellCheckedTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  style?: CSSProperties;
  as?: "textarea" | "input";
  disabled?: boolean;
}

// ── HTML builder ─────────────────────────────────────────────────────────────

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}

function buildHighlightedHTML(text: string, errors: SpellError[]): string {
  if (!errors.length) return escapeHtml(text);

  let result = "";
  let cursor = 0;

  for (const err of errors) {
    result += escapeHtml(text.slice(cursor, err.index));
    result += `<mark data-idx="${err.index}" style="background:transparent;border-bottom:2px dotted #ef4444;display:inline;">${escapeHtml(text.slice(err.index, err.index + err.length))}</mark>`;
    cursor = err.index + err.length;
  }
  result += escapeHtml(text.slice(cursor));
  if (text.endsWith("\n")) result += " "; // keep mirror height in sync

  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpellCheckedTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
  style = {},
  as = "textarea",
  disabled,
}: SpellCheckedTextareaProps) {
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [popover, setPopover] = useState<Popover | null>(null);
  const [ready, setReady] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-warm dictionary
  useEffect(() => {
    getSpellChecker().then(() => setReady(true)).catch(() => {});
  }, []);

  // Debounced spell-check (300 ms after stop typing)
  const scheduleCheck = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!ready) return;
      setErrors(checkText(text));
    }, 300);
  }, [ready]);

  useEffect(() => {
    if (ready) scheduleCheck(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ready]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    if (popover) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popover]);

  // ── Key handler: close popover on Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setPopover(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Click on textarea: detect word via cursor position ──────────────────
  const handleTextareaClick = useCallback(() => {
    if (!errors.length) return;

    const el = (as === "textarea" ? textareaRef.current : inputRef.current) as
      | HTMLTextAreaElement
      | HTMLInputElement
      | null;
    if (!el) return;

    const pos = el.selectionStart ?? 0;

    // Find which error range the cursor falls into
    const errIdx = errors.findIndex(
      (err) => pos >= err.index && pos <= err.index + err.length
    );
    if (errIdx === -1) {
      setPopover(null);
      return;
    }

    // Position the popover below the element
    const wrapperRect = wrapperRef.current!.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    // Approximate horizontal position: proportional to char index in line
    const lineLength = Math.max(value.length, 1);
    const approxX = Math.min(
      (errors[errIdx].index / lineLength) * elRect.width,
      elRect.width - 160
    );
    const approxY = elRect.bottom - wrapperRect.top + 4;

    setPopover({ errIdx, x: Math.max(0, approxX), y: approxY });
  }, [errors, as, value]);

  // ── Apply suggestion ──────────────────────────────────────────────────────
  const applySuggestion = useCallback(
    (suggestion: string) => {
      if (popover === null) return;
      const err = errors[popover.errIdx];
      const newText =
        value.slice(0, err.index) + suggestion + value.slice(err.index + err.length);
      onChange(newText);
      setPopover(null);

      // Re-focus the input after replacing
      setTimeout(() => {
        const el = as === "textarea" ? textareaRef.current : inputRef.current;
        if (el) {
          el.focus();
          const newPos = err.index + suggestion.length;
          (el as HTMLInputElement).setSelectionRange(newPos, newPos);
        }
      }, 0);
    },
    [popover, errors, value, onChange, as]
  );

  // ── Shared styles for mirror + field ─────────────────────────────────────
  const sharedStyle: CSSProperties = {
    fontFamily: style.fontFamily ?? "inherit",
    fontSize: style.fontSize ?? "0.875rem",
    fontWeight: style.fontWeight ?? "normal",
    lineHeight: style.lineHeight ?? "1.5",
    padding: style.padding ?? "0.5rem",
    letterSpacing: style.letterSpacing ?? "normal",
    wordSpacing: style.wordSpacing ?? "normal",
    whiteSpace: as === "textarea" ? "pre-wrap" : "pre",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    boxSizing: "border-box" as const,
  };

  const err = popover !== null ? errors[popover.errIdx] : null;
  const htmlContent = buildHighlightedHTML(value, errors);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* ── Mirror layer (behind field, renders underlines) ── */}
      <div
        aria-hidden="true"
        style={{
          ...sharedStyle,
          position: "absolute",
          inset: 0,
          color: "transparent",
          pointerEvents: "none",       // ← never intercept clicks
          overflowY: "auto",
          border: "1.5px solid transparent",
          borderRadius: "0.375rem",
          zIndex: 1,
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* ── Real textarea ── */}
      {as === "textarea" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleTextareaClick}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={className}
          style={{
            ...style,
            position: "relative",
            zIndex: 2,
            background: "transparent",
            caretColor: style.color ?? "#1a1a2e",
            resize: "vertical",
          }}
        />
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleTextareaClick}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          style={{
            ...style,
            position: "relative",
            zIndex: 2,
            background: "transparent",
            caretColor: style.color ?? "#1a1a2e",
          }}
        />
      )}

      {/* ── Suggestion popover ── */}
      {popover && err && (
        <div
          ref={popoverRef}
          style={{
            position: "absolute",
            top: popover.y,
            left: Math.max(0, popover.x),
            zIndex: 100,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
            overflow: "hidden",
            minWidth: 160,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "5px 10px 4px",
              borderBottom: "1px solid #f0f0f0",
              background: "#fafafa",
            }}
          >
            <span style={{ fontSize: "0.65rem", color: "#ef4444", fontWeight: 700 }}>
              &quot;{err.word}&quot;
            </span>
            <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}> — did you mean?</span>
          </div>

          {/* Suggestions */}
          {err.suggestions.length > 0 ? (
            err.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
                  applySuggestion(s);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 12px",
                  fontSize: "0.82rem",
                  color: "#1a1a2e",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0faf5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {s}
              </button>
            ))
          ) : (
            <p style={{ padding: "6px 12px", fontSize: "0.78rem", color: "#9ca3af" }}>
              No suggestions found
            </p>
          )}

          {/* Dismiss */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setPopover(null); }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              padding: "4px 12px",
              fontSize: "0.7rem",
              color: "#9ca3af",
              background: "none",
              border: "none",
              borderTop: "1px solid #f0f0f0",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
