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
import katex from "katex";

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
      { label: "α", value: "\\alpha" }, { label: "β", value: "\\beta" }, { label: "γ", value: "\\gamma" },
      { label: "δ", value: "\\delta" }, { label: "θ", value: "\\theta" }, { label: "λ", value: "\\lambda" },
      { label: "μ", value: "\\mu" }, { label: "π", value: "\\pi" }, { label: "σ", value: "\\sigma" },
      { label: "φ", value: "\\phi" }, { label: "ω", value: "\\omega" }, { label: "Δ", value: "\\Delta" },
      { label: "Σ", value: "\\Sigma" }, { label: "Π", value: "\\Pi" }, { label: "Ω", value: "\\Omega" },
      { label: "Γ", value: "\\Gamma" }, { label: "Λ", value: "\\Lambda" }, { label: "Θ", value: "\\Theta" },
    ],
  },
  {
    label: "Operators",
    symbols: [
      { label: "±", value: "\\pm" }, { label: "∓", value: "\\mp" }, { label: "×", value: "\\times" },
      { label: "÷", value: "\\div" }, { label: "=", value: "=" }, { label: "≠", value: "\\neq" },
      { label: "≈", value: "\\approx" }, { label: "≡", value: "\\equiv" }, { label: "≤", value: "\\leq" },
      { label: "≥", value: "\\geq" }, { label: "<", value: "<" }, { label: ">", value: ">" },
      { label: "∝", value: "\\propto" }, { label: "∞", value: "\\infty" }, { label: "√", value: "\\sqrt{}" },
      { label: "∛", value: "\\sqrt[3]{}" }, { label: "!", value: "!" }, { label: "...", value: "\\dots" },
    ],
  },
  {
    label: "Calculus",
    symbols: [
      { label: "∫", value: "\\int" }, { label: "∬", value: "\\iint" }, { label: "∮", value: "\\oint" },
      { label: "∂", value: "\\partial" }, { label: "∇", value: "\\nabla" }, { label: "d/dx", value: "\\frac{d}{dx}" },
      { label: "dy/dx", value: "\\frac{dy}{dx}" }, { label: "d²y/dx²", value: "\\frac{d^2y}{dx^2}" },
      { label: "lim", value: "\\lim_{x\\to\\infty}" }, { label: "→", value: "\\to" }, { label: "∑", value: "\\sum_{i=1}^{n}" },
      { label: "∏", value: "\\prod_{i=1}^{n}" }, { label: "∆x", value: "\\Delta x" }, { label: "∆y", value: "\\Delta y" },
    ],
  },
  {
    label: "Sets & Logic",
    symbols: [
      { label: "∈", value: "\\in" }, { label: "∉", value: "\\notin" }, { label: "∩", value: "\\cap" },
      { label: "∪", value: "\\cup" }, { label: "⊂", value: "\\subset" }, { label: "⊃", value: "\\supset" },
      { label: "⊆", value: "\\subseteq" }, { label: "⊇", value: "\\supseteq" }, { label: "∅", value: "\\emptyset" },
      { label: "∀", value: "\\forall" }, { label: "∃", value: "\\exists" }, { label: "¬", value: "\\neg" },
      { label: "∧", value: "\\wedge" }, { label: "∨", value: "\\vee" }, { label: "⊕", value: "\\oplus" },
    ],
  },
  {
    label: "Structures",
    symbols: [
      { label: "x²", value: "x^2" }, { label: "xⁿ", value: "x^n" }, { label: "x₁", value: "x_1" },
      { label: "xₙ", value: "x_n" }, { label: "frac", value: "\\frac{a}{b}" }, { label: "binom", value: "\\binom{n}{x}" },
      { label: "Matrix 2x2", value: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
      { label: "Cases", value: "\\begin{cases} x^2, & x\\geq0 \\\\ -x^2, & x<0 \\end{cases}" },
      { label: "Aligned", value: "\\begin{aligned} y &= x^2+2x+1 \\\\ &= (x+1)^2 \\end{aligned}" },
    ],
  },
  {
    label: "Statistics",
    symbols: [
      { label: "X̄", value: "\\bar{x}" }, { label: "s²", value: "s^2" }, { label: "σ²", value: "\\sigma^2" },
      { label: "E(X)", value: "E(X)" }, { label: "Var(X)", value: "Var(X)" }, { label: "Cov", value: "Cov(X,Y)" },
      { label: "P(A|B)", value: "P(A\\mid B)" }, { label: "Binomial", value: "P(X=x)=\\binom{n}{x}p^x(1-p)^{n-x}" },
      { label: "Poisson", value: "P(X=x)=\\frac{e^{-\\lambda}\\lambda^x}{x!}" },
      { label: "Normal", value: "f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}" }
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
                placeholder="e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} or \sum_{i=1}^n x_i"
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
              <div 
                className="text-white text-base font-serif tracking-wide" 
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{ 
                  __html: (function() {
                    try {
                      return katex.renderToString(equation, { displayMode: true, throwOnError: false });
                    } catch (e) {
                      return equation;
                    }
                  })()
                }}
              />
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
