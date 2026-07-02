"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Question } from "@/types";

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

    let orQuestionObj: Question | undefined = undefined;
    if (hasOrQuestion && orQuestionText.trim()) {
        orQuestionObj = {
            id: crypto.randomUUID(),
            text: capitalizeFirstLetter(orQuestionText),
            marks: marks,
            type: type,
            bl: orQuestionBl,
            co: orQuestionCo,
            po: orQuestionPo
        };
    }

    const newQuestion: Question = {
      id: editingQuestion ? editingQuestion.id : crypto.randomUUID(),
      text: capitalizeFirstLetter(text),
      marks: sectionDefaultMarks || marks,
      type,
      options: type === "mcq" ? options.map(capitalizeFirstLetter).filter((opt) => opt.trim() !== "") : undefined,
      bl,
      co,
      po,
      orQuestion: orQuestionObj,
      subQuestions: hasSubQuestions ? subQuestions : undefined
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
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
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
      // Let's use the same logic as Editor.tsx for consistency if that's what they liked.
      if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase()); 
      if (allCaps) v = v.toUpperCase();
      
      // Keep existing logic for single char if neither is on? 
      // The previous logic was: if (val.length === 1) setText(val.toUpperCase()); meaning auto-cap first letter only.
      // I will override with new logic.
      setText(v);
  };
  
  const handleOrTextChange = (val: string) => {
      let v = val;
      if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase());
      if (allCaps) v = v.toUpperCase();
      setOrQuestionText(v);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    let v = value;
    if (autoCapitalize) v = v.replace(/\b\w/g, c => c.toUpperCase());
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
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full p-2 text-sm rounded-md"
          style={inputStyle}
          rows={3}
          placeholder="Enter your question here..."
        />
        <p className="text-[10px] text-gray-400 text-right mt-1">Use 'br' for Page Break</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Marks</label>
          <input
            type="number"
            min="1"
            value={sectionDefaultMarks || marks}
            onChange={(e) => !sectionDefaultMarks && setMarks(parseInt(e.target.value))}
            disabled={!!sectionDefaultMarks}
            className="w-full p-2 text-sm rounded-md"
            style={{ ...inputStyle, background: sectionDefaultMarks ? '#f1f3f6' : '#fff', cursor: sectionDefaultMarks ? 'not-allowed' : 'auto' }}
          />
           {sectionDefaultMarks && <p className="text-xs mt-1" style={{ color: '#2a7d5f' }}>Using section default</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "short" | "long" | "mcq")}
            className="w-full p-2 text-sm rounded-md"
            style={inputStyle}
          >
            <option value="short">Short Answer</option>
            <option value="long">Long Answer</option>
            <option value="mcq">Multiple Choice</option>
          </select>
        </div>
      </div>

      {showBlCoPo && (
      <div className="space-y-2">
        <div className="flex items-end gap-2 w-full">
          {/* BL */}
          <div className="flex-[4] min-w-0">
            <label className="block text-xs font-medium mb-1" style={labelStyle}>BL</label>
            <div className="flex gap-1 items-center">
              <select value={bl} onChange={(e) => setBl(e.target.value)} className="w-full p-1.5 text-sm rounded-md" style={inputStyle} title="Bloom's Level">
                {[1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <button
                type="button"
                onClick={() => generateBloomLevel(text, false)}
                disabled={isGeneratingBl}
                title="Auto-generate Bloom's Level using AI"
                className="flex items-center justify-center gap-1.5 rounded-md transition-all whitespace-nowrap"
                style={{
                  height: '34px', padding: '0 8px',
                  background: isGeneratingBl ? '#e2e5ea' : 'linear-gradient(135deg, #7c3aed, #2a7d5f)',
                  color: '#fff', border: 'none', cursor: isGeneratingBl ? 'not-allowed' : 'pointer',
                  fontSize: '11px', fontWeight: 600
                }}
              >
                {isGeneratingBl
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Sparkles size={14} />}
                Auto BL
              </button>
            </div>
          </div>
          {/* CO */}
          <div className="flex-[3] min-w-0">
            <label className="block text-xs font-medium mb-1" style={labelStyle}>CO</label>
            <select value={co} onChange={(e) => setCo(e.target.value)} className="w-full p-1.5 text-sm rounded-md" style={inputStyle}>
              {[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          {/* PO */}
          <div className="flex-[3] min-w-0">
            <label className="block text-xs font-medium mb-1" style={labelStyle}>PO</label>
            <select value={po} onChange={(e) => setPo(e.target.value)} className="w-full p-1.5 text-sm rounded-md" style={inputStyle}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
        {blError && (
          <p className="text-xs py-1 px-2 rounded-md" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
            ⚠ {blError}
          </p>
        )}
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
              <textarea
                value={orQuestionText}
                onChange={(e) => handleOrTextChange(e.target.value)}
                className="w-full p-2 text-sm rounded-md"
                style={inputStyle}
                rows={2}
                placeholder="Alternative question text..."
              />
               {showBlCoPo && (
               <div className="space-y-2">
                 <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs" style={labelStyle}>BL</label>
                    <div className="flex gap-1 items-center">
                      <select value={orQuestionBl} onChange={(e) => setOrQuestionBl(e.target.value)} className="flex-1 p-1 text-sm rounded-md" style={inputStyle}>{[1, 2, 3, 4, 5, 6].map(i => <option key={i} value={i}>{i}</option>)}</select>
                      <button
                        type="button"
                        onClick={() => generateBloomLevel(orQuestionText, true)}
                        disabled={isGeneratingOrBl}
                        title="Auto-generate Bloom's Level for OR question"
                        className="flex items-center justify-center rounded-md transition-all"
                        style={{
                          width: '26px', height: '26px', flexShrink: 0,
                          background: isGeneratingOrBl ? '#e2e5ea' : 'linear-gradient(135deg, #7c3aed, #2a7d5f)',
                          color: '#fff', border: 'none', cursor: isGeneratingOrBl ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isGeneratingOrBl
                          ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Sparkles size={11} />}
                      </button>
                    </div>
                  </div>
                  <div><label className="text-xs" style={labelStyle}>CO</label><select value={orQuestionCo} onChange={(e) => setOrQuestionCo(e.target.value)} className="w-full p-1 text-sm rounded-md" style={inputStyle}>{[1, 2, 3, 4, 5].map(i => <option key={i} value={i}>{i}</option>)}</select></div>
                  <div><label className="text-xs" style={labelStyle}>PO</label><select value={orQuestionPo} onChange={(e) => setOrQuestionPo(e.target.value)} className="w-full p-1 text-sm rounded-md" style={inputStyle}>{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <option key={i} value={i}>{i}</option>)}</select></div>
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
                           <input 
                                type="text" 
                                value={sub.text} 
                                onChange={(e) => updateSubQuestion(idx, 'text', e.target.value)}
                                className="w-full p-1.5 text-sm rounded-md" 
                                style={inputStyle}
                                placeholder="Sub-question text"
                           />
                           <div className="flex gap-2">
                               <input type="number" placeholder="Marks (Opt)" value={sub.marks || ''} onChange={(e) => updateSubQuestion(idx, 'marks', e.target.value ? parseInt(e.target.value) : undefined)} className="w-20 p-1 text-xs rounded-md" style={inputStyle} />
                               {showBlCoPo && (<>
                               <select value={sub.bl} onChange={(e) => updateSubQuestion(idx, 'bl', e.target.value)} title="Bloom's Level" className="w-12 p-1 text-xs rounded-md" style={inputStyle}>{[1,2,3,4,5,6].map(i=><option key={i} value={i}>{i}</option>)}</select>
                               <select value={sub.co} onChange={(e) => updateSubQuestion(idx, 'co', e.target.value)} title="Course Outcome" className="w-12 p-1 text-xs rounded-md" style={inputStyle}>{[1,2,3,4,5].map(i=><option key={i} value={i}>{i}</option>)}</select>
                               <select value={sub.po} onChange={(e) => updateSubQuestion(idx, 'po', e.target.value)} title="Program Outcome" className="w-12 p-1 text-xs rounded-md" style={inputStyle}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(i=><option key={i} value={i}>{i}</option>)}</select>
                               </>)}\r\n                           </div>
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
