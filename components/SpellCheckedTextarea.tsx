"use client";

import { useRef, useEffect, useCallback, CSSProperties } from "react";

interface SpellCheckedTextareaProps {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  style?: CSSProperties;
  as?: "textarea" | "input";
  disabled?: boolean;
  showToolbar?: boolean;
}

export default function SpellCheckedTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 3,
  className = "",
  style = {},
  as = "textarea",
  disabled,
  showToolbar = true,
}: SpellCheckedTextareaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync value from props to contentEditable (only if changed externally)
  useEffect(() => {
    if (as === "textarea" && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, as]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const applyFormat = useCallback((cmd: string) => {
    document.execCommand(cmd, false, null);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  }, [handleInput]);

  if (as === "input") {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        style={style}
        spellCheck={true}
      />
    );
  }

  return (
    <div className="flex flex-col w-full">
      <style>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
      `}</style>
      
      {showToolbar && (
        <div className="flex items-center gap-1 p-1 bg-[#f8f9fb] border border-b-0 rounded-t-md" style={{ borderColor: '#d1d5db' }}>
          <button type="button" onClick={() => applyFormat('bold')} className="p-1 hover:bg-[#e2e5ea] rounded text-sm w-7 h-7 font-bold transition-colors" title="Bold">B</button>
          <button type="button" onClick={() => applyFormat('italic')} className="p-1 hover:bg-[#e2e5ea] rounded text-sm w-7 h-7 italic font-serif transition-colors" title="Italic">I</button>
          <button type="button" onClick={() => applyFormat('underline')} className="p-1 hover:bg-[#e2e5ea] rounded text-sm w-7 h-7 underline transition-colors" title="Underline">U</button>
          <div className="w-px h-4 bg-[#d1d5db] mx-1"></div>
          <button type="button" onClick={() => applyFormat('subscript')} className="p-1 hover:bg-[#e2e5ea] rounded text-xs w-7 h-7 transition-colors" title="Subscript">X<sub className="text-[10px]">2</sub></button>
          <button type="button" onClick={() => applyFormat('superscript')} className="p-1 hover:bg-[#e2e5ea] rounded text-xs w-7 h-7 transition-colors" title="Superscript">X<sup className="text-[10px]">2</sup></button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onBlur={onBlur}
        className={className}
        style={{
          ...style,
          minHeight: `${rows * 1.5}em`,
          outline: "none",
          cursor: disabled ? "not-allowed" : "text",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          ...(showToolbar ? { marginTop: '-1px', borderTopLeftRadius: 0, borderTopRightRadius: 0 } : {})
        }}
        spellCheck={true}
        data-placeholder={placeholder}
      />
    </div>
  );
}
