import { PaperData, Question, Section } from "@/types";
import React, { useState, useEffect, useRef, useMemo } from "react";

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

  // Build flat content items + track manual break positions
  const { contentNodes, breakBefore } = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    const breaks = new Set<number>();
    const regBoxCount = data.header.regNoBoxCount || 15;

    // Header
    nodes.push(
      <div key="header" className="mb-4 relative">
        {showLogo && data.header.logo && (
          <img src={data.header.logo} alt="Logo" style={{ position: 'absolute', top: 0, left: 0, width: `${logoSize}px`, height: `${logoSize}px`, objectFit: 'contain', filter: 'grayscale(100%)' }} />
        )}
        <div className="text-center">
          <h1 className="font-bold uppercase tracking-wide leading-tight" style={{ fontSize: '1.15em' }}>{data.header.institutionName}</h1>
          {data.header.college && <h2 className="font-bold uppercase leading-tight">{data.header.college}</h2>}
          {data.header.department && <h2 className="font-bold uppercase leading-tight">{data.header.department}</h2>}
          <h2 className="font-bold uppercase leading-tight">{data.header.examName}</h2>
          <h3 className="font-bold uppercase leading-tight mb-6">
            {data.header.courseCode && <span>{data.header.courseCode} – </span>}
            {data.header.subject}
          </h3>
        </div>
        <div className="flex flex-col gap-1 mt-2 pb-0">
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
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ lineHeight: '24px' }}>Reg. No:</span>
              <div className="flex border border-black bg-white">
                {Array.from({ length: regBoxCount }).map((_, i) => (
                  <div key={i} className="w-5 h-6 border-r last:border-r-0 border-black flex items-center justify-center font-mono font-bold" style={{ fontSize: '0.75em' }}>
                    {data.header.registerNumber ? data.header.registerNumber[i] || "" : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between font-bold mt-1">
          <span>Duration: {data.header.duration}</span>
          <span>Max. Marks: {data.header.totalMarks}</span>
        </div>
      </div>
    );

    // Continuous question numbering across all parts
    let globalQIndex = 0;

    data.sections.forEach((section) => {
      // Section header
      nodes.push(
        <div key={`sec-${section.id}-header`} className="mb-4">
          <div className="flex justify-between items-baseline mb-2 mt-2 border-b border-black pb-1">
            <div className="flex items-baseline gap-2">
              <h4 className="font-bold uppercase">Part {section.part}</h4>
              <span className="font-bold">
                {section.requiredCount === 'ALL' ? 'Answer ALL questions' : `Answer any ${section.requiredCount} questions`}
              </span>
            </div>
            {section.defaultMarks !== undefined && (
              <div className="font-bold">
                <span>({section.requiredCount === 'ALL' ? section.questions.filter(q => q.type !== 'break').length : section.requiredCount} x {section.defaultMarks} = {(section.requiredCount === 'ALL' ? section.questions.filter(q => q.type !== 'break').length : parseInt(section.requiredCount)) * section.defaultMarks} Marks)</span>
              </div>
            )}
          </div>
          {showBlCoPo && (
            <div className="flex font-bold mb-2 text-right" style={{ fontSize: '0.85em' }}>
              <div className="flex-1 text-left"></div>
              <div className="w-8 text-center">BL</div>
              <div className="w-8 text-center">CO</div>
              <div className="w-8 text-center">PO</div>
            </div>
          )}
        </div>
      );

      section.questions.forEach((question) => {
        if (question.type === 'break') {
          breaks.add(nodes.length); // break BEFORE the next item
        } else {
          globalQIndex++;
          const qNum = globalQIndex;
          nodes.push(
            <div key={question.id} className="flex gap-2 mb-3 break-inside-avoid">
              <span className="w-6 shrink-0 font-normal">{qNum}.</span>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <div className="text-justify pr-4 flex-1">
                    <p>
                      {question.orQuestion && <span className="font-bold mr-2">A.</span>}
                      {question.text}
                    </p>
                    {question.subQuestions && question.subQuestions.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {question.subQuestions.map((sub, sIdx) => (
                          <div key={sub.id} className="flex gap-2">
                            <span className="w-6 text-right shrink-0">{['i','ii','iii','iv'][sIdx] || sIdx+1})</span>
                            <div className="flex-1 flex justify-between">
                              <span>{sub.text}</span>
                              <span className="font-mono ml-2 shrink-0 text-gray-600" style={{ fontSize: '0.85em' }}>
                                {sub.marks ? `[${sub.marks}]` : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {showBlCoPo && (
                    <div className="flex gap-0 shrink-0 font-mono font-bold" style={{ fontSize: '0.85em' }}>
                      <span className="w-8 text-center block">{question.bl}</span>
                      <span className="w-8 text-center block">{question.co}</span>
                      <span className="w-8 text-center block">{question.po}</span>
                    </div>
                  )}
                </div>
                {question.orQuestion && (
                  <div className="my-2 text-center">
                    <span className="font-bold uppercase my-1 block">(OR)</span>
                    <div className="flex justify-between items-baseline text-left font-normal">
                      <p className="text-justify pr-4 flex-1">
                        <span className="font-bold mr-2">B.</span>
                        {question.orQuestion.text}
                      </p>
                      {showBlCoPo && (
                        <div className="flex gap-0 shrink-0 font-mono font-bold" style={{ fontSize: '0.85em' }}>
                          <span className="w-8 text-center block">{question.orQuestion.bl}</span>
                          <span className="w-8 text-center block">{question.orQuestion.co}</span>
                          <span className="w-8 text-center block">{question.orQuestion.po}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {question.type === 'mcq' && question.options && (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-1 ml-4">
                    {question.options.map((opt, i) => (
                      <div key={i} className="flex gap-1">
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

  // Measure content and auto-paginate
  useEffect(() => {
    if (!measureRef.current || contentNodes.length === 0) return;

    // Small delay to ensure DOM is fully laid out
    const timer = setTimeout(() => {
      const container = measureRef.current;
      if (!container) return;
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length !== contentNodes.length) return;

      const containerRect = container.getBoundingClientRect();
      const paddingTop = parseFloat(getComputedStyle(container).paddingTop);

      // Calculate usable page height: container width = 210mm
      const pxPerMm = containerRect.width / 210;
      const marginTop = data.settings?.marginTop ?? 15;
      const marginBottom = data.settings?.marginBottom ?? 15;
      // Add 2mm safety buffer so content doesn't press against the bottom margin
      const safetyBuffer = 0.5;
      const usableHeight = (297 - marginTop - marginBottom - safetyBuffer) * pxPerMm;

      // Use cumulative offsets from the container to properly account for margins
      const contentAreaTop = containerRect.top + paddingTop;

      // Get the bottom edge position of each child relative to content area start
      const childBottoms: number[] = [];
      const childTops: number[] = [];
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        childTops.push(rect.top - contentAreaTop);
        childBottoms.push(rect.bottom - contentAreaTop);
      }

      const groups: number[][] = [[]];
      let currentGroup = 0;
      let pageStartOffset = 0; // tracks where the current page starts in the measuring container

      for (let i = 0; i < children.length; i++) {
        // Height this child would occupy on the current page
        const relativeBottom = childBottoms[i] - pageStartOffset;

        // Manual break
        if (breakBefore.has(i) && groups[currentGroup].length > 0) {
          groups.push([]);
          currentGroup++;
          pageStartOffset = childTops[i];
        }

        // Auto overflow: if this child's bottom exceeds usable height from page start
        const relativeBottomUpdated = childBottoms[i] - pageStartOffset;
        if (relativeBottomUpdated > usableHeight && groups[currentGroup].length > 0) {
          groups.push([]);
          currentGroup++;
          pageStartOffset = childTops[i];
        }

        groups[currentGroup].push(i);
      }

      setPageGroups(groups);
    }, 50);

    return () => clearTimeout(timer);
  }, [contentNodes, breakBefore, data.settings]);

  // Build final pages
  const actualPages = pageGroups
    ? pageGroups.map(group => group.map(i => contentNodes[i]))
    : [contentNodes]; // fallback before measurement

  const pageStyle = {
    width: '210mm',
    height: '297mm',
    paddingTop: `${data.settings?.marginTop ?? 15}mm`,
    paddingBottom: `${data.settings?.marginBottom ?? 15}mm`,
    paddingLeft: `${data.settings?.marginLeft ?? 15}mm`,
    paddingRight: `${data.settings?.marginRight ?? 15}mm`,
    boxSizing: 'border-box' as const,
    fontSize: `${data.settings?.fontSize ?? 12}pt`,
    lineHeight: data.settings?.lineHeight || 1.5,
    fontFamily: '"Times New Roman", Times, serif',
    color: '#000',
    overflow: 'hidden' as const,
  };

  return (
    <div className="flex flex-col items-center relative" ref={ref}>
      {/* Hidden measuring container */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '-99999px',
          visibility: 'hidden' as const,
          width: '210mm',
          paddingLeft: `${data.settings?.marginLeft ?? 15}mm`,
          paddingRight: `${data.settings?.marginRight ?? 15}mm`,
          paddingTop: `${data.settings?.marginTop ?? 15}mm`,
          boxSizing: 'border-box',
          fontSize: `${data.settings?.fontSize ?? 12}pt`,
          lineHeight: data.settings?.lineHeight || 1.5,
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        {contentNodes}
      </div>

      {/* Actual pages */}
      <div className="space-y-8 print:space-y-0 pb-20 transition-transform origin-top print-reset-transform" style={{ transform: `scale(${scale})` }}>
        {actualPages.map((pageContent, pageIndex) => (
          <div
            key={pageIndex}
            data-page-index={pageIndex}
            className={`bg-white shadow-2xl print:shadow-none print:m-0 mx-auto relative group ${pageIndex < actualPages.length - 1 ? 'print:break-after-page break-after-page' : ''}`}
            style={pageStyle}
          >
            {/* Watermark */}
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

            {/* Page Number */}
            <div className="absolute bottom-2 right-4 text-xs text-gray-400 print:hidden">Page {pageIndex + 1}</div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {pageContent}
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Control */}
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
