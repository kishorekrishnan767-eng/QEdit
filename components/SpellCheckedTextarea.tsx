"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, CSSProperties } from 'react';

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Underline,
      Subscript,
      Superscript,
      Placeholder.configure({
        placeholder: placeholder || 'Type here...',
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      let html = editor.getHTML();
      if (html === '<p></p>') html = '';
      else {
        html = html.replace(/<\/p>\s*<p>/g, '<br/>').replace(/^<p>/, '').replace(/<\/p>$/, '');
      }
      onChange(html);
    },
    onBlur: () => {
      if (onBlur) onBlur();
    }
  });

  // Sync external value changes to the editor (e.g., auto-capitalize)
  useEffect(() => {
    if (editor && value !== undefined) {
      let currentHtml = editor.getHTML();
      if (currentHtml === '<p></p>') currentHtml = '';
      else if (currentHtml) {
        currentHtml = currentHtml.replace(/<\/p>\s*<p>/g, '<br/>').replace(/^<p>/, '').replace(/<\/p>$/, '');
      }
      if (currentHtml !== value && value !== '') {
        const { from, to } = editor.state.selection;
        editor.commands.setContent(value, { emitUpdate: false, parseOptions: { preserveWhitespace: "full" } });
        editor.commands.setTextSelection({ from, to });
      }
    }
  }, [value, editor]);

  if (as === "input") {
    return (
      <input
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
    <div className={`w-full custom-tiptap-editor ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <style>{`
        .custom-tiptap-editor .ProseMirror {
          min-height: ${rows * 1.5}em;
          padding: ${style.padding ?? '0.5rem'};
          border: 1px solid #d1d5db;
          border-top: ${showToolbar ? 'none' : '1px solid #d1d5db'};
          border-radius: ${showToolbar ? '0 0 0.375rem 0.375rem' : '0.375rem'};
          font-family: inherit;
          font-size: ${style.fontSize ?? '0.875rem'};
          background: transparent;
          outline: none;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .custom-tiptap-editor .ProseMirror p {
          margin: 0;
        }
        .custom-tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>
      
      {showToolbar && editor && (
        <div className="flex items-center gap-1 p-1 bg-[#f8f9fb] border border-b-0 rounded-t-md" style={{ borderColor: '#d1d5db' }}>
          <button 
            type="button" 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            className={`p-1 rounded text-sm w-7 h-7 font-bold transition-colors ${editor.isActive('bold') ? 'bg-[#d1d5db]' : 'hover:bg-[#e2e5ea]'}`} 
            title="Bold"
          >B</button>
          <button 
            type="button" 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            className={`p-1 rounded text-sm w-7 h-7 italic font-serif transition-colors ${editor.isActive('italic') ? 'bg-[#d1d5db]' : 'hover:bg-[#e2e5ea]'}`} 
            title="Italic"
          >I</button>
          <button 
            type="button" 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            className={`p-1 rounded text-sm w-7 h-7 underline transition-colors ${editor.isActive('underline') ? 'bg-[#d1d5db]' : 'hover:bg-[#e2e5ea]'}`} 
            title="Underline"
          >U</button>
          <div className="w-px h-4 bg-[#d1d5db] mx-1"></div>
          <button 
            type="button" 
            onClick={() => editor.chain().focus().toggleSubscript().run()} 
            className={`p-1 rounded text-xs w-7 h-7 transition-colors ${editor.isActive('subscript') ? 'bg-[#d1d5db]' : 'hover:bg-[#e2e5ea]'}`} 
            title="Subscript"
          >X<sub className="text-[10px]">2</sub></button>
          <button 
            type="button" 
            onClick={() => editor.chain().focus().toggleSuperscript().run()} 
            className={`p-1 rounded text-xs w-7 h-7 transition-colors ${editor.isActive('superscript') ? 'bg-[#d1d5db]' : 'hover:bg-[#e2e5ea]'}`} 
            title="Superscript"
          >X<sup className="text-[10px]">2</sup></button>
        </div>
      )}
      
      <EditorContent editor={editor} spellCheck={true} />
    </div>
  );
}
