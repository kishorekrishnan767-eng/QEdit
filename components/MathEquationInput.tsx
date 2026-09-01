/**
 * MathEquationInput.tsx
 * A LaTeX-like math equation builder with a symbol palette.
 * Stores the equation as a formatted unicode/text string.
 * Preview renders the equation visually using simple replacements
 * (no external LaTeX library needed — pure text + superscript/subscript HTML).
 */
"use client";

import { useState, useRef } from "react";
import { Check, X, Trash2 } from "lucide-react";

interface MathEquationInputProps {
  initialValue?: string;
  onInsert: (equation: string) => void;
  onClose: () => void;
}

// Symbol categories
const SYMBOL_GROUPS = [
  {
    label: "Greek Letters",
    symbols: [
      { label: "α", value: "α" }, { label: "β", value: "β" }, { label: "γ", value: "γ" },
      { label: "δ", value: "δ" }, { label: "θ", value: "θ" }, { label: "λ", value: "λ" },
      { label: "μ", value: "μ" }, { label: "π", value: "π" }, { label: "σ", value: "σ" },
      { label: "φ", value: "φ" }, { label: "ω", value: "ω" }, { label: "Δ", value: "Δ" },
      { label: "Σ", value: "Σ" }, { label: "Π", value: "Π" }, { label: "Ω", value: "Ω" },
      { label: "Γ", value: "Γ" }, { label: "Λ", value: "Λ" }, { label: "Θ", value: "Θ" },
    ],
  },
  {
    label: "Operators",
    symbols: [
      { label: "±", value: "±" }, { label: "∓", value: "∓" }, { label: "×", value: "×" },
      { label: "÷", value: "÷" }, { label: "=", value: "=" }, { label: "≠", value: "≠" },
      { label: "≈", value: "≈" }, { label: "≡", value: "≡" }, { label: "≤", value: "≤" },
      { label: "≥", value: "≥" }, { label: "<", value: "<" }, { label: ">", value: ">" },
      { label: "∝", value: "∝" }, { label: "∞", value: "∞" }, { label: "√", value: "√(" },
      { label: "∛", value: "∛(" }, { label: "!", value: "!" }, { label: "%", value: "%" },
    ],
  },
  {
    label: "Calculus",
    symbols: [
      { label: "∫", value: "∫" }, { label: "∬", value: "∬" }, { label: "∮", value: "∮" },
      { label: "∂", value: "∂" }, { label: "∇", value: "∇" }, { label: "d/dx", value: "d/dx" },
      { label: "dy/dx", value: "dy/dx" }, { label: "d²y/dx²", value: "d²y/dx²" },
      { label: "lim", value: "lim" }, { label: "→", value: "→" }, { label: "∑", value: "∑" },
      { label: "∏", value: "∏" }, { label: "∆x", value: "∆x" }, { label: "∆y", value: "∆y" },
    ],
  },
  {
    label: "Sets & Logic",
    symbols: [
      { label: "∈", value: "∈" }, { label: "∉", value: "∉" }, { label: "∩", value: "∩" },
      { label: "∪", value: "∪" }, { label: "⊂", value: "⊂" }, { label: "⊃", value: "⊃" },
      { label: "⊆", value: "⊆" }, { label: "⊇", value: "⊇" }, { label: "∅", value: "∅" },
      { label: "∀", value: "∀" }, { label: "∃", value: "∃" }, { label: "¬", value: "¬" },
      { label: "∧", value: "∧" }, { label: "∨", value: "∨" }, { label: "⊕", value: "⊕" },
    ],
  },
  {
    label: "Geometry",
    symbols: [
      { label: "∠", value: "∠" }, { label: "∟", value: "∟" }, { label: "⊥", value: "⊥" },
      { label: "∥", value: "∥" }, { label: "≅", value: "≅" }, { label: "~", value: "~" },
      { label: "△", value: "△" }, { label: "□", value: "□" }, { label: "○", value: "○" },
      { label: "°", value: "°" }, { label: "′", value: "′" }, { label: "″", value: "″" },
      { label: "π", value: "π" }, { label: "r²", value: "r²" }, { label: "½", value: "½" },
    ],
  },
  {
    label: "Powers & Subscripts",
    symbols: [
      { label: "x²", value: "x²" }, { label: "x³", value: "x³" }, { label: "xⁿ", value: "xⁿ" },
      { label: "x₁", value: "x₁" }, { label: "x₂", value: "x₂" }, { label: "xₙ", value: "xₙ" },
      { label: "aₙ", value: "aₙ" }, { label: "bₙ", value: "bₙ" }, { label: "²", value: "²" },
      { label: "³", value: "³" }, { label: "⁴", value: "⁴" }, { label: "⁻¹", value: "⁻¹" },
      { label: "₀", value: "₀" }, { label: "₁", value: "₁" }, { label: "₂", value: "₂" },
      { label: "√x", value: "√x" }, { label: "ⁿ√x", value: "ⁿ√x" }, { label: "log", value: "log" },
    ],
  },
  {
    label: "Fractions & Templates",
    symbols: [
      { label: "½", value: "½" }, { label: "⅓", value: "⅓" }, { label: "¼", value: "¼" },
      { label: "¾", value: "¾" }, { label: "⅔", value: "⅔" }, { label: "a/b", value: "a/b" },
      { label: "(a+b)/c", value: "(a+b)/c" }, { label: "sin θ", value: "sin θ" },
      { label: "cos θ", value: "cos θ" }, { label: "tan θ", value: "tan θ" },
      { label: "sin⁻¹", value: "sin⁻¹" }, { label: "cos⁻¹", value: "cos⁻¹" },
      { label: "tan⁻¹", value: "tan⁻¹" }, { label: "eˣ", value: "eˣ" }, { label: "ln x", value: "ln x" },
    ],
  },
];

export default function MathEquationInput({ initialValue = "", onInsert, onClose }: MathEquationInputProps) {
  const [equation, setEquation] = useState(initialValue);
  const [activeGroup, setActiveGroup] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSymbol = (sym: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setEquation(eq => eq + sym);
      return;
    }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const newEq = equation.slice(0, start) + sym + equation.slice(end);
    setEquation(newEq);
    // Restore cursor after inserted symbol
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + sym.length;
      ta.focus();
    });
  };

  const handleInsert = () => {
    if (equation.trim()) onInsert(equation.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}>
      <div className="rounded-xl overflow-hidden shadow-2xl flex flex-col" style={{ background: "#0f172a", width: "min(96vw, 760px)", maxHeight: "92vh", border: "1px solid #2a3a5e" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#0a1020", borderBottom: "1px solid #1e3a5f" }}>
          <span className="text-white font-semibold text-sm">∑ Math Equation Builder</span>
          <div className="flex gap-2">
            <button type="button" onClick={handleInsert} className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold text-white" style={{ background: "#2a7d5f" }}>
              <Check size={13} /> Insert
            </button>
            <button type="button" onClick={onClose} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Equation Input + Preview */}
        <div className="p-4 space-y-3" style={{ borderBottom: "1px solid #1e3a5f" }}>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <label className="block text-[11px] text-gray-400 mb-1">Type your equation (use symbols below):</label>
              <textarea
                ref={textareaRef}
                value={equation}
                onChange={e => setEquation(e.target.value)}
                placeholder="e.g.  x² + y² = r²   or   ∫₀^∞ e^(-x²) dx = √π/2"
                rows={3}
                className="w-full p-2 rounded text-sm font-mono resize-none"
                style={{ background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", outline: "none" }}
              />
            </div>
            <button
              type="button"
              onClick={() => setEquation("")}
              title="Clear"
              className="mt-5 p-1.5 rounded text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Live preview */}
          {equation.trim() && (
            <div className="px-3 py-2 rounded" style={{ background: "#1e293b", border: "1px solid #334155" }}>
              <p className="text-[10px] text-gray-500 mb-1">Preview:</p>
              <div className="text-white text-base font-serif tracking-wide" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {equation}
              </div>
            </div>
          )}
        </div>

        {/* Symbol Palette */}
        <div className="flex-1 overflow-auto p-3">
          {/* Group tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {SYMBOL_GROUPS.map((g, i) => (
              <button
                type="button"
                key={g.label}
                onClick={() => setActiveGroup(i)}
                className="px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                style={{
                  background: activeGroup === i ? "#2a7d5f" : "#1e293b",
                  color:      activeGroup === i ? "#fff"    : "#9ca3af",
                  border:     activeGroup === i ? "1px solid #3aae88" : "1px solid #334155",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Symbols grid */}
          <div className="flex flex-wrap gap-1.5">
            {SYMBOL_GROUPS[activeGroup].symbols.map(sym => (
              <button
                type="button"
                key={sym.value}
                onClick={() => insertSymbol(sym.value)}
                title={sym.value}
                className="px-2.5 py-1.5 rounded text-sm font-serif transition-all hover:scale-110"
                style={{
                  background: "#1e293b",
                  color: "#e2e8f0",
                  border: "1px solid #334155",
                  minWidth: "36px",
                  textAlign: "center",
                }}
              >
                {sym.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-gray-600 mt-3">
            💡 Tip: Click symbols to insert at cursor position. Type freely or combine with keyboard input. The equation will appear as typed in the question paper.
          </p>
        </div>
      </div>
    </div>
  );
}
