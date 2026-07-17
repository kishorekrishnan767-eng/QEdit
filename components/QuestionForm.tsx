"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Question } from "@/types";
import SpellCheckedTextarea from "./SpellCheckedTextarea";
import { applyAcademicPunctuation } from "@/lib/utils/questionPunctuation";

interface QuestionFormProps {
  onAddQuestion: (question: Question) => void;
  editingQuestion?: Question | null;
  onCancelEdit?: () => void;
  sectionDefaultMarks?: number;
  showBlCoPo?: boolean;
  autoCapitalize?: boolean;
  allCaps?: boolean;
}

export default function QuestionForm({ onAddQuestion, editingQuestion, onCancelEdit, sectionDefaultMarks, showBlCoPo, autoCapitalize, allCaps }: QuestionFormProps) {
  const [text, setText] = useState("");
  const [marks, setMarks] = useState(1);
  const [type, setType] = useState<"short" | "long" | "mcq" | "break">("short");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [bl, setBl] = useState("1");
  const [co, setCo] = useState("1");
  const [po, setPo] = useState("1");
  const [isGeneratingBl, setIsGeneratingBl] = useState(false);
  const [isGeneratingOrBl, setIsGeneratingOrBl] = useState(false);
  const [blError, setBlError] = useState<string | null>(null);

  // Auto Punctuation — blur-triggered suggestion state
  const [mainSuggestion, setMainSuggestion] = useState<string | null>(null);
  const [orSuggestion, setOrSuggestion] = useState<string | null>(null);
  const [subSuggestion, setSubSuggestion] = useState<{ idx: number; value: string } | null>(null);

  // Complex Question States
  const [hasOrQuestion, setHasOrQuestion] = useState(false);
  const [orQuestionText, setOrQuestionText] = useState("");
  const [orQuestionBl, setOrQuestionBl] = useState("1");
  const [orQuestionCo, setOrQuestionCo] = useState("1");
  const [orQuestionPo, setOrQuestionPo] = useState("1");

  const [hasSubQuestions, setHasSubQuestions] = useState(false);
  const [subQuestions, setSubQuestions] = useState<Question[]>([]);

  useEffect(() => {
      if (sectionDefaultMarks) {
          setMarks(sectionDefaultMarks);
      }
  }, [sectionDefaultMarks]);

  useEffect(() => {
    if (editingQuestion) {
      setText(editingQuestion.text);
      setMarks(editingQuestion.marks);
      setType(editingQuestion.type);
      setOptions(editingQuestion.options || ["", "", "", ""]);
      setBl(editingQuestion.bl || "1");
      setCo(editingQuestion.co || "1");
      setPo(editingQuestion.po || "1");
      
      if (editingQuestion.orQuestion) {
          setHasOrQuestion(true);
          setOrQuestionText(editingQuestion.orQuestion.text);
          setOrQuestionBl(editingQuestion.orQuestion.bl || "1");
          setOrQuestionCo(editingQuestion.orQuestion.co || "1");
          setOrQuestionPo(editingQuestion.orQuestion.po || "1");
      } else {
          setHasOrQuestion(false);
          setOrQuestionText("");
      }

      if (editingQuestion.subQuestions && editingQuestion.subQuestions.length > 0) {
          setHasSubQuestions(true);
          setSubQuestions(editingQuestion.subQuestions);
      } else {
          setHasSubQuestions(false);
          setSubQuestions([]);
      }

    } else {
      setText("");
      setMarks(sectionDefaultMarks || 1);
      setType("short");
      setOptions(["", "", "", ""]);
      setBl("1");
      setCo("1");
      setPo("1");
      setHasOrQuestion(false);
      setOrQuestionText("");
      setHasSubQuestions(false);
      setSubQuestions([]);
    }
  }, [editingQuestion, sectionDefaultMarks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Auto-apply correct punctuation on save (silent, no user action needed)
    const correctedText = capitalizeFirstLetter(applyAcademicPunctuation(text));

    let orQuestionObj: Question | undefined = undefined;
    if (hasOrQuestion && orQuestionText.trim()) {
        orQuestionObj = {
            id: crypto.randomUUID(),
            text: capitalizeFirstLetter(applyAcademicPunctuation(orQuestionText)),
            marks: marks,
            type: type,
            bl: orQuestionBl,
            co: orQuestionCo,
            po: orQuestionPo
        };
    }

    const correctedSubs = hasSubQuestions
      ? subQuestions.map(sub => ({
          ...sub,
          text: sub.text.trim() ? capitalizeFirstLetter(applyAcademicPunctuation(sub.text)) : sub.text,
        }))
      : undefined;

    const newQuestion: Question = {
      id: editingQuestion ? editingQuestion.id : crypto.randomUUID(),
      text: correctedText,
      marks: marks,
      type,
      options: type === "mcq" ? options.map(capitalizeFirstLetter).filter((opt) => opt.trim() !== "") : undefined,
      bl,
      co,
      po,
      orQuestion: orQuestionObj,
      subQuestions: correctedSubs
    };

    onAddQuestion(newQuestion);
    if (!editingQuestion) {
        setText("");
        setMarks(sectionDefaultMarks || 1);
        setOptions(["", "", "", ""]);
        setBl("1");
        setCo("1");
        setPo("1");
        setHasOrQuestion(false);
        setOrQuestionText("");
        setHasSubQuestions(false);
        setSubQuestions([]);
        setMainSuggestion(null);
        setOrSuggestion(null);
        setSubSuggestion(null);
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Real-time punctuation checker:
  // Shows suggestion chip only when the text already ends with a punctuation char
  // AND the detected correct punctuation differs from what's there.
  const PUNCT_CHARS = /[.?!:;,]+$/;

  const checkRealTimeSuggestion = (
    val: string,
    setSuggestion: (s: string | null) => void
  ) => {
    const trimmed = val.trim();
    if (!trimmed || !PUNCT_CHARS.test(trimmed)) {
      // User hasn't typed punctuation yet — don't show anything
      setSuggestion(null);
      return;
    }
    const suggested = applyAcademicPunctuation(trimmed);
    if (suggested !== trimmed) setSuggestion(suggested);
    else setSuggestion(null);
  };

  const generateBloomLevel = async (questionText: string, isOrQuestion = false) => {
    const trimmed = questionText.trim();
    if (!trimmed) {
      setBlError("Please enter question text before generating Bloom's Level.");
      setTimeout(() => setBlError(null), 3000);
      return;
    }
    setBlError(null);
    if (isOrQuestion) {
      setIsGeneratingOrBl(true);
    } else {
      setIsGeneratingBl(true);
    }
    try {
      const res = await fetch("/api/bloom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate Bloom's Level.");
      }
      if (isOrQuestion) {
        setOrQuestionBl(data.bloomLevel);
      } else {
        setBl(data.bloomLevel);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setBlError(msg);
      setTimeout(() => setBlError(null), 4000);
    } finally {
      if (isOrQuestion) {
        setIsGeneratingOrBl(false);
      } else {
        setIsGeneratingBl(false);
      }
    }
  };

  const handleTextChange = (val: string) => {
      let v = val;
      if (autoCapitalize) v = v.replace(/(?:^|\.\s+)\w/g, c => c.toUpperCase()); // Sentence case logic or user's requested 'first letter' logic? 
      // User said "auto capitalize first letter" in previous turn which usually means Title Case. 
      // In Editor.tsx I used /\b\w/g (Title Case). Let's stick to consistency or what works for questions.
      // Actually questions are sentences. But user asked for "auto capitalize" same as header.
      // Let's use the sentence case logic as requested
      if (autoCapitalize) v = v.replace(/(?:^|[.!?]\s+)\w/g, c => c.toUpperCase()); 
      if (allCaps) v = v.toUpperCase();
      
      // Keep existing logic for single char if neither is on? 
      // The previous logic was: if (val.length === 1) setText(val.toUpperCase()); meaning auto-cap first letter only.
      // I will override with new logic.
      setText(v);
  };
  
  const handleOrTextChange = (val: string) => {
      let v = val;
      if (autoCapitalize) v = v.replace(/(?:^|[.!?]\s+)\w/g, c => c.toUpperCase());
      if (allCaps) v = v.toUpperCase();
      setOrQuestionText(v);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    let v = value;
    if (autoCapitalize) v = v.replace(/(?:^|[.!?]\s+)\w/g, c => c.toUpperCase());
    if (allCaps) v = v.toUpperCase();
    newOptions[index] = v;
    setOptions(newOptions);
  };

  const addSubQuestion = () => {
      setSubQuestions([...subQuestions, {
          id: crypto.randomUUID(),
          text: "",
          marks: 0,
          type: 'short',
          bl: '1', co: '1', po: '1'
      }]);
      setHasSubQuestions(true);
  };

  const updateSubQuestion = (index: number, field: keyof Question, value: any) => {
      const newSubs = [...subQuestions];
      newSubs[index] = { ...newSubs[index], [field]: value };
      setSubQuestions(newSubs);
  };

  const removeSubQuestion = (index: number) => {
      const newSubs = subQuestions.filter((_, i) => i !== index);
      setSubQuestions(newSubs);
      if (newSubs.length === 0) setHasSubQuestions(false);
  };

  const inputStyle = { border: '1px solid #d1d5db', color: '#1a1a2e', background: '#fff' };
  const labelStyle = { color: '#374151' };

  const selectPoStyle = { ...inputStyle, width: '48px' };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>Question Text</label>
        <SpellCheckedTextarea
          value={text}
          onChange={(v) => {
            handleTextChange(v);
            checkRealTimeSuggestion(v, setMainSuggestion);
          }}
          placeholder="Enter your question here..."
          rows={3}
          as="textarea"
          className="w-full p-2 text-sm rounded-md"
          style={inputStyle}
        />
        <div className="flex items-center justify-between mt-1">
          {mainSuggestion ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md text-xs" style={{ background: '#f0f7f4', border: '1px solid #c4e5d3', color: '#2a7d5f' }}>
              <span className="opacity-70">Suggested:</span>
              <span className="font-semibold truncate max-w-[200px]">&ldquo;...{mainSuggestion.slice(-12)}&rdquo;</span>
              <button type="button" onClick={() => { setText(mainSuggestion); setMainSuggestion(null); }}
                className="font-bold underline hover:no-underline" style={{ color: '#1e6b4f' }}>Apply</button>
              <button type="button" onClick={() => setMainSuggestion(null)}
                className="opacity-50 hover:opacity-100" style={{ fontSize: '0.65rem' }}>✕</button>
            </div>
          ) : <span />}
          <p className="text-[10px] text-gray-400">Use 'br' for Page Break</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Type</label>
          <select
            value={type}
            onChange={(e) => {
              const newType = e.target.value as "short" | "long" | "mcq";
              setType(newType);
              if (!sectionDefaultMarks) {
                if (newType === 'mcq') setMarks(1);
                else if (newType === 'short' && ![2, 5].includes(marks)) setMarks(2);
                else if (newType === 'long' && ![15, 16].includes(marks)) setMarks(15);
              }
            }}
            className="w-full p-2 text-sm rounded-md"
            style={inputStyle}
          >
            <option value="short">Short Answer</option>
            <option value="long">Long Answer</option>
            <option value="mcq">Multiple Choice</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Marks</label>
          <select
            value={marks}
            onChange={(e) => setMarks(parseInt(e.target.value))}
            className="w-full p-2 text-sm rounded-md"
            style={inputStyle}
          >
            {type === 'mcq' && <option value="1">1</option>}
            {type === 'short' && (
              <>
                <option value="2">2</option>
                <option value="5">5</option>
              </>
            )}
            {type === 'long' && (
              <>
                <option value="15">15</option>
                <option value="16">16</option>
              </>
            )}
            {/* Fallbacks for existing valid numbers that don't match strict rules */}
            {![1, 2, 5, 15, 16].includes(marks) && (
              <option value={marks}>{marks}</option>
            )}
          </select>
        </div>
      </div>

      {showBlCoPo && (
      <div className="space-y-2">
        <div className="flex items-end gap-2 w-full">
          {/* Bloom's Level */}
          <div className="flex-[2] min-w-0">
            <label className="block text-xs font-medium mb-1 flex items-center justify-between" style={labelStyle}>
              <span>Bloom's Level</span>
              {blError && <span className="text-[10px] text-red-500 font-normal truncate ml-2" title={blError}>{blError}</span>}
            </label>
            <div className="flex gap-1">
              <select
                value={bl}
                onChange={(e) => setBl(e.target.value)}
                className="w-full p-1.5 text-sm rounded-md flex-1"
                style={inputStyle}
              >
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
          {/* CO */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium mb-1" style={labelStyle}>CO</label>
            <select value={co} onChange={(e) => setCo(e.target.value)} className="w-full p-1.5 text-sm rounded-md" style={inputStyle}>
              {[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          {/* PO */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium mb-1" style={labelStyle}>PO</label>
            <select value={po} onChange={(e) => setPo(e.target.value)} className="w-full p-1.5 text-sm rounded-md" style={inputStyle}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
      </div>
      )}

      {type === "mcq" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={labelStyle}>Options</label>
          {options.map((option, index) => (
            <input
              key={index}
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="w-full p-2 text-sm rounded-md"
              style={inputStyle}
            />
          ))}
        </div>
      )}

      {/* Advanced Features Toggles */}
      <div className="flex gap-4 pt-3" style={{ borderTop: '1px solid #e2e5ea' }}>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#4b5563' }}>
              <input type="checkbox" checked={hasOrQuestion} onChange={(e) => setHasOrQuestion(e.target.checked)} className="rounded" style={{ accentColor: '#2a7d5f' }} />
              Add OR Question
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#4b5563' }}>
              <input type="checkbox" checked={hasSubQuestions} onChange={(e) => {
                  setHasSubQuestions(e.target.checked);
                  if (e.target.checked && subQuestions.length === 0) addSubQuestion();
              }} className="rounded" style={{ accentColor: '#2a7d5f' }} />
              Add Sub-questions
          </label>
      </div>

      {/* OR Question Form */}
      {hasOrQuestion && (
          <div className="p-3 rounded-lg space-y-3" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
              <h4 className="text-sm font-semibold" style={{ color: '#4b5563' }}>OR Question Details</h4>
              <SpellCheckedTextarea
                value={orQuestionText}
                onChange={(v) => {
                  handleOrTextChange(v);
                  checkRealTimeSuggestion(v, setOrSuggestion);
                }}
                as="textarea"
                rows={2}
                placeholder="Alternative question text..."
                className="w-full p-2 text-sm rounded-md"
                style={inputStyle}
              />
              {orSuggestion && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md text-xs mt-1" style={{ background: '#f0f7f4', border: '1px solid #c4e5d3', color: '#2a7d5f' }}>
                  <span className="opacity-70">Suggested:</span>
                  <span className="font-semibold truncate max-w-[160px]">&ldquo;...{orSuggestion.slice(-12)}&rdquo;</span>
                  <button type="button" onClick={() => { setOrQuestionText(orSuggestion); setOrSuggestion(null); }}
                    className="font-bold underline hover:no-underline" style={{ color: '#1e6b4f' }}>Apply</button>
                  <button type="button" onClick={() => setOrSuggestion(null)}
                    className="opacity-50 hover:opacity-100" style={{ fontSize: '0.65rem' }}>✕</button>
                </div>
              )}
               {showBlCoPo && (
               <div className="space-y-2">
                  <div className="flex items-end gap-2 w-full">
                    <div className="flex-[2] min-w-0">
                      <label className="block text-xs font-medium mb-1" style={labelStyle}>Bloom's Level</label>
                      <div className="flex gap-1">
                        <select value={orQuestionBl} onChange={(e) => setOrQuestionBl(e.target.value)} className="w-full p-1 text-sm rounded-md flex-1" style={inputStyle}>
                          {[1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0"><label className="block text-xs font-medium mb-1" style={labelStyle}>CO</label><select value={orQuestionCo} onChange={(e) => setOrQuestionCo(e.target.value)} className="w-full p-1 text-sm rounded-md" style={inputStyle}>{[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                    <div className="flex-1 min-w-0"><label className="block text-xs font-medium mb-1" style={labelStyle}>PO</label><select value={orQuestionPo} onChange={(e) => setOrQuestionPo(e.target.value)} className="w-full p-1 text-sm rounded-md" style={inputStyle}>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                  </div>
               </div>
               )}
          </div>
      )}

      {/* Sub Questions Form */}
      {hasSubQuestions && (
          <div className="p-3 rounded-lg space-y-3" style={{ background: '#f8f9fb', border: '1px solid #e2e5ea' }}>
               <h4 className="text-sm font-semibold" style={{ color: '#4b5563' }}>Sub-questions (i, ii)</h4>
               {subQuestions.map((sub, idx) => (
                   <div key={sub.id} className="flex gap-2 items-start">
                       <span className="mt-2 text-xs font-mono font-bold" style={{ color: '#6b7280' }}>({['i','ii','iii','iv'][idx] || idx+1})</span>
                       <div className="flex-1 space-y-1">
                            <SpellCheckedTextarea
                                 value={sub.text}
                                 as="input"
                                 onChange={(v) => {
                                     let val = v;
                                     if (autoCapitalize) val = val.replace(/(?:^|[.!?]\s+)\w/g, c => c.toUpperCase());
                                     if (allCaps) val = val.toUpperCase();
                                     updateSubQuestion(idx, 'text', val);
                                     checkRealTimeSuggestion(val, (s) => setSubSuggestion(s ? { idx, value: s } : null));
                                 }}
                                 placeholder="Sub-question text"
                                 className="w-full p-1.5 text-sm rounded-md"
                                 style={inputStyle}
                            />
                            {subSuggestion?.idx === idx && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] mt-0.5" style={{ background: '#f0f7f4', border: '1px solid #c4e5d3', color: '#2a7d5f' }}>
                                <span className="opacity-70">Suggested:</span>
                                <span className="font-semibold truncate max-w-[120px]">&ldquo;...{subSuggestion.value.slice(-10)}&rdquo;</span>
                                <button type="button" onClick={() => { updateSubQuestion(idx, 'text', subSuggestion.value); setSubSuggestion(null); }}
                                  className="font-bold underline" style={{ color: '#1e6b4f' }}>Apply</button>
                                <button type="button" onClick={() => setSubSuggestion(null)}
                                  className="opacity-50">✕</button>
                              </div>
                            )}
                           <div className="flex gap-2">
                               <input type="number" placeholder="Marks (Opt)" value={sub.marks || ''} onChange={(e) => updateSubQuestion(idx, 'marks', e.target.value ? parseInt(e.target.value) : undefined)} className="w-20 p-1 text-xs rounded-md" style={inputStyle} />
                               {showBlCoPo && (<>
                               <select value={sub.bl || '1'} onChange={(e) => updateSubQuestion(idx, 'bl', e.target.value)} title="Bloom's Level" className="w-12 p-1 text-xs rounded-md" style={inputStyle}>{[1,2,3,4,5,6].map(i=><option key={i} value={i}>{i}</option>)}</select>
                               <select value={sub.co} onChange={(e) => updateSubQuestion(idx, 'co', e.target.value)} title="Course Outcome" className="w-12 p-1 text-xs rounded-md" style={inputStyle}>{[1,2,3,4,5].map(i=><option key={i} value={i}>{i}</option>)}</select>
                               <select value={sub.po} onChange={(e) => updateSubQuestion(idx, 'po', e.target.value)} title="Program Outcome" className="w-12 p-1 text-xs rounded-md" style={inputStyle}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(i=><option key={i} value={i}>{i}</option>)}</select>
                               </>)}
                           </div>
                       </div>
                       <button type="button" onClick={() => removeSubQuestion(idx)} className="mt-1 p-1 rounded transition-colors" style={{ color: '#c4c9d1' }}
                         onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                         onMouseLeave={(e) => (e.currentTarget.style.color = '#c4c9d1')}
                       ><Trash2 size={14}/></button>
                   </div>
               ))}
               <button type="button" onClick={addSubQuestion} className="text-xs transition-colors" style={{ color: '#2a7d5f' }}
                 onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                 onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
               >+ Add Sub-question</button>
          </div>
      )}

      <div className="flex gap-2 pt-2">
        {editingQuestion && (
            <button
                type="button"
                onClick={onCancelEdit}
                className="flex-1 font-medium py-2 px-4 rounded-md text-sm transition-colors"
                style={{ background: '#f1f3f6', color: '#4b5563', border: '1px solid #e2e5ea' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e5ea')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f1f3f6')}
            >
                Cancel
            </button>
        )}
        <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
            style={{ background: '#2a7d5f' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#236b50')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2a7d5f')}
        >
            <Plus size={18} />
            {editingQuestion ? "Update Question" : "Add Question"}
        </button>
      </div>
    </form>
  );
}
