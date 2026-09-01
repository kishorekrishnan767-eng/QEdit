import { PaperData, Question, Section } from "@/types";
import React, { useState, useEffect, useRef, useMemo } from "react";
import katex from "katex";

const renderMathText = (text: string) => {
  if (!text) return null;
  let html = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  html = html.replace(/\$([\s\S]*?)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  html = html.replace(/\n/g, '<br/>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

interface PreviewProps {
  data: PaperData;
  showBlCoPo?: boolean;
  showWatermark?: boolean;
  showLogo?: boolean;
  watermarkOpacity?: number;
  logoSize?: number;
  watermarkSize?: number;
  showDate?: boolean;
}

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
};

const Preview = React.forwardRef<HTMLDivElement, PreviewProps>(({ data, showBlCoPo, showWatermark, showLogo, watermarkOpacity = 0.04, logoSize = 60, watermarkSize = 200, showDate = true }, ref) => {
  const [scale, setScale] = useState(0.75);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageGroups, setPageGroups] = useState<number[][] | null>(null);

  // Build flat content items + track manual break positions.
  const { contentNodes, breakBefore } = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    const breaks = new Set<number>();
    const regBoxCount = data.header.regNoBoxCount || 15;

    // Header
    nodes.push(
      <div key="header" className="relative" style={{ marginBottom: '1em', fontSize: `${data.settings?.headerFontSize ?? 12}pt`, lineHeight: 1.5 }}>
        {showLogo && data.header.logo && (
          <img src={data.header.logo} alt="Logo" style={{ position: 'absolute', top: 0, left: 0, width: `${logoSize}px`, height: `${logoSize}px`, objectFit: 'contain', filter: 'grayscale(100%)' }} />
        )}
        <div className="text-center">
          <h1 className="font-bold uppercase tracking-wide leading-tight" style={{ fontSize: '1.15em' }}>{data.header.institutionName}</h1>
          {data.header.college && <h2 className="font-bold uppercase leading-tight">{data.header.college}</h2>}
          {data.header.department && <h2 className="font-bold uppercase leading-tight">{data.header.department}</h2>}
          <h2 className="font-bold uppercase leading-tight">{data.header.examName}</h2>
          <h3 className="font-bold uppercase leading-tight" style={{ marginBottom: '1.5em' }}>
            {data.header.courseCode && <span>{data.header.courseCode} – </span>}
            {data.header.subject}
          </h3>
        </div>
        <div className="flex flex-col pb-0" style={{ gap: '0.25em', marginTop: '0.5em' }}>
          <div className="flex justify-between items-center">
            <span className="font-bold">Class: {data.header.class}</span>
            {showDate && data.header.date ? (
              <span className="font-bold">Date: {formatDateDisplay(data.header.date)}</span>
            ) : (
              <span></span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold">Semester: {data.header.semester}</span>
            <div className="flex items-center" style={{ gap: '0.5em' }}>
              <span className="font-bold">Reg. No:</span>
              <div style={{ display: 'flex', border: '1px solid #000', background: '#fff', transform: 'translateY(0.1em)' }}>
                {Array.from({ length: regBoxCount }).map((_, i) => (
                  <div key={i} style={{ width: '1.4em', height: '1.6em', borderRight: i < regBoxCount - 1 ? '1px solid #000' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.75em' }}>
                    {data.header.registerNumber ? data.header.registerNumber[i] || "" : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between font-bold" style={{ marginTop: '0.25em' }}>
          <span>Duration: {data.header.duration}</span>
          <span>Max. Marks: {data.header.totalMarks}</span>
        </div>
      </div>
    );

    // Sections & Questions
    let globalQIndex = 0;

    data.sections.forEach((section) => {
      nodes.push(
        <div key={`sec-${section.id}-header`} style={{ marginBottom: '0.25em', fontSize: `${data.settings?.headerFontSize ?? 12}pt`, lineHeight: 1.5 }}>
          <div className="flex justify-between items-end border-b border-black" style={{ marginBottom: '0.25em', marginTop: '0.5em', paddingBottom: '0.25em', gap: '0.5em' }}>
            <div className="flex items-baseline" style={{ gap: '0.5em' }}>
              <h4 className="font-bold uppercase whitespace-nowrap">Part {section.part}</h4>
              <span className="font-bold">
                {section.requiredCount === 'ALL' ? 'Answer ALL questions' : `Answer any ${section.requiredCount} questions`}
              </span>
            </div>
            {section.defaultMarks !== undefined && (
              <div className="font-bold whitespace-nowrap">
                <span>({section.requiredCount === 'ALL' ? section.questions.filter(q => q.type !== 'break').length : section.requiredCount} x {section.defaultMarks} = {(section.requiredCount === 'ALL' ? section.questions.filter(q => q.type !== 'break').length : parseInt(section.requiredCount)) * section.defaultMarks} Marks)</span>
              </div>
            )}
          </div>
          {showBlCoPo && (
            <div className="flex font-bold text-right" style={{ fontSize: '0.85em' }}>
              <div className="flex-1 text-left"></div>
              <div style={{ width: '2em', textAlign: 'center' }}>BL</div>
              <div style={{ width: '2em', textAlign: 'center' }}>CO</div>
              <div style={{ width: '2em', textAlign: 'center' }}>PO</div>
            </div>
          )}
        </div>
      );

      section.questions.forEach((question) => {
        if (question.type === 'break') {
          breaks.add(nodes.length);
        } else {
          globalQIndex++;
          const qNum = globalQIndex;
          nodes.push(
            <div key={question.id} className="flex break-inside-avoid" style={{ gap: '0.5em', marginBottom: '0.75em' }}>
              <span className="shrink-0 font-normal" style={{ width: '1.5em' }}>{qNum}.</span>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <div className="text-justify flex-1" style={{ paddingRight: '1em' }}>
                    <p>
                      {question.orQuestion && <span className="mr-2">A.</span>}
                      {renderMathText(question.text)}
                    </p>
                  </div>
                  {showBlCoPo && (
                    <div className="flex gap-0 shrink-0 font-mono font-bold" style={{ fontSize: '0.85em' }}>
                      <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{question.bl || '1'}</span>
                      <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{question.co}</span>
                      <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{question.po}</span>
                    </div>
                  )}
                </div>
                {question.subQuestions && question.subQuestions.length > 0 && (
                  <div className="space-y-1" style={{ marginTop: '0.25em' }}>
                    {question.subQuestions.map((sub, sIdx) => (
                      <div key={sub.id} className="flex justify-between items-baseline">
                        <div className="flex flex-1 text-justify" style={{ gap: '0.5em', paddingRight: '1em' }}>
                          <span className="text-right shrink-0" style={{ width: '1.5em' }}>{['i','ii','iii','iv'][sIdx] || sIdx+1})</span>
                          <div className="flex-1 flex justify-between">
                            <span>{renderMathText(sub.text)}</span>
                            <span className="font-mono ml-2 shrink-0 text-gray-600" style={{ fontSize: '0.85em' }}>
                              {sub.marks ? `[${sub.marks}]` : ''}
                            </span>
                          </div>
                        </div>
                        {showBlCoPo && (
                          <div className="flex gap-0 shrink-0 font-mono font-bold" style={{ fontSize: '0.85em' }}>
                            <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{sub.bl || '1'}</span>
                            <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{sub.co}</span>
                            <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{sub.po}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {question.orQuestion && (
                  <div className="my-2 text-center">
                    <span className="font-bold uppercase my-1 block">(OR)</span>
                    <div className="flex justify-between items-baseline text-left font-normal">
                      <p className="text-justify flex-1" style={{ paddingRight: '1em' }}>
                        <span className="mr-2">B.</span>
                        {renderMathText(question.orQuestion.text)}
                      </p>
                      {showBlCoPo && (
                        <div className="flex gap-0 shrink-0 font-mono font-bold" style={{ fontSize: '0.85em' }}>
                          <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{question.orQuestion.bl || '1'}</span>
                          <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{question.orQuestion.co}</span>
                          <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{question.orQuestion.po}</span>
                        </div>
                      )}
                    </div>
                    {question.orQuestion.subQuestions && question.orQuestion.subQuestions.length > 0 && (
                      <div className="space-y-1 text-left font-normal" style={{ marginTop: '0.25em' }}>
                        {question.orQuestion.subQuestions.map((sub, sIdx) => (
                          <div key={sub.id} className="flex justify-between items-baseline">
                            <div className="flex flex-1 text-justify" style={{ gap: '0.5em', paddingRight: '1em' }}>
                              <span className="text-right shrink-0" style={{ width: '1.5em' }}>{['i','ii','iii','iv'][sIdx] || sIdx+1})</span>
                              <div className="flex-1 flex justify-between">
                                <span>{renderMathText(sub.text)}</span>
                                <span className="font-mono ml-2 shrink-0 text-gray-600" style={{ fontSize: '0.85em' }}>
                                  {sub.marks ? `[${sub.marks}]` : ''}
                                </span>
                              </div>
                            </div>
                            {showBlCoPo && (
                              <div className="flex gap-0 shrink-0 font-mono font-bold" style={{ fontSize: '0.85em' }}>
                                <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{sub.bl || '1'}</span>
                                <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{sub.co}</span>
                                <span style={{ width: '2em', textAlign: 'center', display: 'block' }}>{sub.po}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Math Equation */}
                {question.mathEquation && (
                  <div style={{ marginTop: '0.35em', marginBottom: '0.2em', fontFamily: '"Times New Roman", Times, serif', fontSize: '1em', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                    {renderMathText(question.mathEquation)}
                  </div>
                )}
                {/* Diagram */}
                {question.diagram && (
                  <div style={{ marginTop: '0.5em', textAlign: question.diagramPosition || 'center' }}>
                    <img
                      src={question.diagram}
                      alt="Math diagram"
                      style={{ maxWidth: '80%', maxHeight: '180px', objectFit: 'contain', display: 'inline-block' }}
                    />
                  </div>
                )}
                {question.type === 'mcq' && question.options && (
                  <div className="grid grid-cols-2" style={{ columnGap: '2em', rowGap: '0.25em', marginTop: '0.25em', marginLeft: '1em' }}>
                    {question.options.map((opt, i) => (
                      <div key={i} className="flex" style={{ gap: '0.25em' }}>
                        <span className="font-bold">({String.fromCharCode(97 + i)})</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }
      });
    });

    return { contentNodes: nodes, breakBefore: breaks };
  }, [data, showBlCoPo, showLogo, logoSize, showDate]);

  const fontSize     = data.settings?.fontSize     ?? 12;
  const lineHeight   = data.settings?.lineHeight   ?? 1.5;
  const marginTop    = data.settings?.marginTop    ?? 15;
  const marginBottom = data.settings?.marginBottom ?? 15;
  const marginLeft   = data.settings?.marginLeft   ?? 15;
  const marginRight  = data.settings?.marginRight  ?? 15;

  useEffect(() => {
    if (contentNodes.length === 0) return;

    setPageGroups(null);

    let rafId: number;

    const timer = setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        const container = measureRef.current;
        if (!container) return;

        const children = Array.from(container.children) as HTMLElement[];
        if (children.length !== contentNodes.length) return;

        const pxPerMm = container.getBoundingClientRect().width / 210;
        const SAFETY_MM = 2;
        const usableHeightPx = (297 - marginTop - marginBottom - SAFETY_MM) * pxPerMm;

        const childHeights: number[] = children.map(child => {
          const cs = getComputedStyle(child);
          const mt = parseFloat(cs.marginTop)    || 0;
          const mb = parseFloat(cs.marginBottom) || 0;
          return child.getBoundingClientRect().height + mt + mb;
        });

        const groups: number[][] = [[]];
        let currentGroup = 0;
        let cursorPx = 0; 

        for (let i = 0; i < children.length; i++) {
          const itemHeight = childHeights[i];

          if (breakBefore.has(i) && groups[currentGroup].length > 0) {
            groups.push([]);
            currentGroup++;
            cursorPx = 0;
          }

          if (cursorPx + itemHeight > usableHeightPx && groups[currentGroup].length > 0) {
            groups.push([]);
            currentGroup++;
            cursorPx = 0;
          }

          groups[currentGroup].push(i);
          cursorPx += itemHeight;
        }

        setPageGroups(groups);
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [contentNodes, breakBefore, fontSize, lineHeight, marginTop, marginBottom, marginLeft, marginRight]);

  const actualPages = pageGroups
    ? pageGroups.map(group => group.map(i => contentNodes[i]))
    : [contentNodes];

  const pageStyle: React.CSSProperties = {
    width:         '210mm',
    height:        '297mm',
    paddingTop:    `${marginTop}mm`,
    paddingBottom: `${marginBottom}mm`,
    paddingLeft:   `${marginLeft}mm`,
    paddingRight:  `${marginRight}mm`,
    boxSizing:     'border-box',
    fontSize:      `${fontSize}pt`,
    lineHeight:     lineHeight,
    fontFamily:    '"Times New Roman", Times, serif',
    color:         '#000',
    overflow:      'hidden',
  };

  const measureStyle: React.CSSProperties = {
    position:    'absolute',
    top:          0,
    left:        '-99999px',
    visibility:  'hidden',
    width:        '210mm',
    paddingLeft: `${marginLeft}mm`,
    paddingRight:`${marginRight}mm`,
    boxSizing:   'border-box',
    fontSize:    `${fontSize}pt`,
    lineHeight:   lineHeight,
    fontFamily:  '"Times New Roman", Times, serif',
  };

  return (
    <div className="flex flex-col items-center relative" ref={ref}>
      <div ref={measureRef} aria-hidden="true" style={measureStyle}>
        {contentNodes}
      </div>

      <div className="space-y-8 print:space-y-0 pb-20 transition-transform origin-top print-reset-transform" style={{ transform: `scale(${scale})` }}>
        {actualPages.map((pageContent, pageIndex) => (
          <div
            key={pageIndex}
            data-page-index={pageIndex}
            className={`bg-white shadow-2xl print:shadow-none print:m-0 mx-auto relative group ${pageIndex < actualPages.length - 1 ? 'print:break-after-page break-after-page' : ''}`}
            style={pageStyle}
          >
            {showWatermark && data.header.logo && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${watermarkSize}px`,
                height: `${watermarkSize}px`,
                opacity: watermarkOpacity,
                pointerEvents: 'none',
                zIndex: 0,
              }}>
                <img src={data.header.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'grayscale(100%)' }} />
              </div>
            )}

            <div className="absolute bottom-2 right-4 text-xs text-gray-400 print:hidden">Page {pageIndex + 1}</div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {pageContent}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 right-6 flex items-center gap-3 px-3 py-2 rounded-lg print:hidden z-20" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e5ea', backdropFilter: 'blur(4px)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>Zoom</span>
        <input type="range" min="0.4" max="1.5" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-24 h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#2a7d5f' }} />
        <span className="text-xs font-mono w-10 text-right" style={{ color: '#4b5563' }}>{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(0.75)} className="text-xs transition-colors" style={{ color: '#2a7d5f' }}>Reset</button>
      </div>
    </div>
  );
});

Preview.displayName = 'Preview';

export default Preview;
