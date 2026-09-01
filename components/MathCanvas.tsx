/**
 * MathCanvas.tsx
 * A canvas-based drawing tool for math diagrams with pre-built shapes.
 * Stores the result as a base64 PNG string via onSave callback.
 */
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Minus, Circle, Square, Triangle, Move, Pen, Eraser,
  Undo2, Trash2, Download, Check, X, ArrowRight,
  Grid3X3, CornerDownRight
} from "lucide-react";

type Tool =
  | "freehand"
  | "line"
  | "arrow"
  | "rect"
  | "square_shape"
  | "circle"
  | "triangle"
  | "right_triangle"
  | "angle"
  | "axes"
  | "grid"
  | "eraser";

interface Point { x: number; y: number }

interface MathCanvasProps {
  initialData?: string; // base64 PNG
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const TOOLS: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: "freehand",      label: "Freehand",       icon: <Pen size={16} /> },
  { id: "eraser",        label: "Eraser",          icon: <Eraser size={16} /> },
  { id: "line",          label: "Straight Line",   icon: <Minus size={16} /> },
  { id: "arrow",         label: "Arrow",           icon: <ArrowRight size={16} /> },
  { id: "circle",        label: "Circle",          icon: <Circle size={16} /> },
  { id: "rect",          label: "Rectangle",       icon: <Square size={16} /> },
  { id: "square_shape",  label: "Square",          icon: <Square size={16} strokeWidth={2.5} /> },
  { id: "triangle",      label: "Triangle",        icon: <Triangle size={16} /> },
  { id: "right_triangle",label: "Right Triangle",  icon: <CornerDownRight size={16} /> },
  { id: "angle",         label: "Angle Mark",      icon: <CornerDownRight size={16} strokeWidth={1.5} /> },
  { id: "axes",          label: "XY Axes",         icon: <Move size={16} /> },
  { id: "grid",          label: "Grid Paper",      icon: <Grid3X3 size={16} /> },
];

const COLORS = ["#000000", "#1e3a8a", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777"];
const SIZES  = [1, 2, 3, 5, 8];

export default function MathCanvas({ initialData, onSave, onClose }: MathCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [tool, setTool]       = useState<Tool>("freehand");
  const [color, setColor]     = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPt, setStartPt] = useState<Point>({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [previewCrop, setPreviewCrop] = useState<string | null>(null);

  // Snapshot helper
  const snapshot = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    const img = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHistory(h => [...h.slice(-30), img]);
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (initialData) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0); };
      img.src = initialData;
    }
  }, [initialData]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const drawShape = (ctx: CanvasRenderingContext2D, sp: Point, ep: Point) => {
    ctx.strokeStyle = color;
    ctx.lineWidth   = lineWidth;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    const dx = ep.x - sp.x;
    const dy = ep.y - sp.y;
    const size = Math.max(Math.abs(dx), Math.abs(dy));

    ctx.beginPath();
    switch (tool) {
      case "line":
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(ep.x, ep.y);
        ctx.stroke();
        break;

      case "arrow": {
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(ep.x, ep.y);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(dy, dx);
        const hl = 14;
        ctx.beginPath();
        ctx.moveTo(ep.x, ep.y);
        ctx.lineTo(ep.x - hl * Math.cos(angle - Math.PI / 6), ep.y - hl * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(ep.x, ep.y);
        ctx.lineTo(ep.x - hl * Math.cos(angle + Math.PI / 6), ep.y - hl * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        break;
      }

      case "rect":
        ctx.strokeRect(sp.x, sp.y, dx, dy);
        break;

      case "square_shape": {
        const s = Math.sign(dx) * size;
        ctx.strokeRect(sp.x, sp.y, s, Math.sign(dy) * size);
        break;
      }

      case "circle": {
        const rx = Math.abs(dx) / 2;
        const ry = Math.abs(dy) / 2;
        const cx = sp.x + dx / 2;
        const cy = sp.y + dy / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case "triangle": {
        ctx.moveTo(sp.x + dx / 2, sp.y);
        ctx.lineTo(sp.x, ep.y);
        ctx.lineTo(ep.x, ep.y);
        ctx.closePath();
        ctx.stroke();
        break;
      }

      case "right_triangle": {
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x, ep.y);
        ctx.lineTo(ep.x, ep.y);
        ctx.closePath();
        ctx.stroke();
        // Small right-angle mark
        const markSize = 10;
        ctx.beginPath();
        ctx.moveTo(sp.x + markSize, ep.y);
        ctx.lineTo(sp.x + markSize, ep.y - markSize);
        ctx.lineTo(sp.x, ep.y - markSize);
        ctx.stroke();
        break;
      }

      case "angle": {
        // Draw an arc angle mark at start point
        const r = Math.hypot(dx, dy) * 0.3;
        ctx.arc(sp.x, sp.y, r, 0, Math.PI / 3);
        ctx.stroke();
        // Two rays
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x + r * 2, sp.y);
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x + r * 2 * Math.cos(Math.PI / 3), sp.y - r * 2 * Math.sin(Math.PI / 3));
        ctx.stroke();
        break;
      }

      case "axes": {
        // X axis
        ctx.moveTo(sp.x, ep.y);
        ctx.lineTo(ep.x, ep.y);
        // Arrowhead X
        ctx.lineTo(ep.x - 10, ep.y - 5);
        ctx.moveTo(ep.x, ep.y);
        ctx.lineTo(ep.x - 10, ep.y + 5);
        // Y axis
        ctx.moveTo(sp.x, ep.y);
        ctx.lineTo(sp.x, sp.y);
        // Arrowhead Y
        ctx.lineTo(sp.x - 5, sp.y + 10);
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x + 5, sp.y + 10);
        ctx.stroke();
        // Labels
        ctx.font = `${lineWidth + 11}px serif`;
        ctx.fillStyle = color;
        ctx.fillText("x", ep.x + 4, ep.y + 4);
        ctx.fillText("y", sp.x - 14, sp.y + 4);
        ctx.fillText("O", sp.x - 14, ep.y + 14);
        break;
      }

      case "grid": {
        const cols = Math.abs(Math.round(dx / 20));
        const rows = Math.abs(Math.round(dy / 20));
        const gw   = dx / (cols || 1);
        const gh   = dy / (rows || 1);
        ctx.globalAlpha = 0.4;
        for (let c = 0; c <= cols; c++) {
          ctx.moveTo(sp.x + c * gw, sp.y);
          ctx.lineTo(sp.x + c * gw, ep.y);
        }
        for (let r = 0; r <= rows; r++) {
          ctx.moveTo(sp.x, sp.y + r * gh);
          ctx.lineTo(ep.x, sp.y + r * gh);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    setIsDrawing(true);
    setStartPt(pos);
    snapshot();

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (tool === "freehand" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (tool === "freehand") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth   = lineWidth;
      ctx.lineCap     = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = lineWidth * 6;
      ctx.lineCap   = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      // Restore previous snapshot then redraw shape preview
      if (history.length > 0) {
        ctx.putImageData(history[history.length - 1], 0, 0);
      }
      ctx.globalCompositeOperation = "source-over";
      drawShape(ctx, startPt, pos);
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.globalCompositeOperation = "source-over";
      if (tool !== "freehand" && tool !== "eraser") {
        if (history.length > 0) ctx.putImageData(history[history.length - 1], 0, 0);
        drawShape(ctx, startPt, pos);
      }
    }
    setIsDrawing(false);
  };

  const undo = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || history.length === 0) return;
    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory(h => h.slice(0, -1));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    snapshot();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasContent = false;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        // Check if not white (r=255, g=255, b=255)
        if (data[i] !== 255 || data[i+1] !== 255 || data[i+2] !== 255) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasContent = true;
        }
      }
    }
    
    if (!hasContent) {
      setPreviewCrop(canvas.toDataURL("image/png"));
      return;
    }
    
    // Add padding
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);
    
    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;
    
    cropCtx.fillStyle = "#ffffff";
    cropCtx.fillRect(0, 0, cropWidth, cropHeight);
    cropCtx.putImageData(ctx.getImageData(minX, minY, cropWidth, cropHeight), 0, 0);
    
    setPreviewCrop(cropCanvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="flex flex-col rounded-xl overflow-hidden shadow-2xl" style={{ background: "#1a1a2e", width: "min(98vw, 900px)", maxHeight: "95vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#0f172a", borderBottom: "1px solid #2a3a5e" }}>
          <span className="text-white font-semibold text-sm">
            {previewCrop ? "✨ Confirm Cropped Diagram" : "📐 Math Diagram Canvas"}
          </span>
          <div className="flex gap-2">
            {!previewCrop && (
              <>
                <button type="button" onClick={undo} title="Undo" className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-300 hover:text-white transition-colors">
                  <Undo2 size={14} /> Undo
                </button>
                <button type="button" onClick={clearCanvas} title="Clear" className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 size={14} /> Clear
                </button>
                <button type="button" onClick={handleSave} className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium text-white transition-colors" style={{ background: "#2a7d5f" }}>
                  <Check size={14} /> Auto-Crop
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-[480px]">
          {previewCrop ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0f172a]">
              <div className="text-white text-lg font-medium mb-2">Preview Cropped Diagram</div>
              <div className="text-gray-400 text-sm mb-6">The empty space around your diagram has been removed.</div>
              <div className="bg-[#e8ecf0] p-6 rounded-lg overflow-auto shadow-lg flex items-center justify-center max-w-full" style={{ maxHeight: "calc(100% - 150px)" }}>
                <img src={previewCrop} alt="Cropped Preview" className="shadow-md rounded border border-gray-300 bg-white max-w-full" style={{ maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setPreviewCrop(null)} className="px-6 py-2 rounded font-medium text-white transition-colors hover:bg-opacity-80" style={{ background: "#475569" }}>
                  Back to Edit
                </button>
                <button type="button" onClick={() => onSave(previewCrop)} className="flex items-center gap-2 px-6 py-2 rounded font-medium text-white transition-colors hover:bg-opacity-80" style={{ background: "#2a7d5f" }}>
                  <Check size={18} /> Confirm Insert
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Left Toolbar */}
              <div className="flex flex-col gap-1 p-2 overflow-y-auto shrink-0" style={{ background: "#0f1a2e", width: "90px", borderRight: "1px solid #2a3a5e" }}>
                <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1 text-center">Tools</p>
                {TOOLS.map(t => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    title={t.label}
                    className="flex flex-col items-center justify-center gap-0.5 rounded py-1.5 text-[10px] transition-all"
                    style={{
                      background: tool === t.id ? "#2a7d5f" : "transparent",
                      color: tool === t.id ? "#fff" : "#9ca3af",
                      border: tool === t.id ? "1px solid #3aae88" : "1px solid transparent",
                    }}
                  >
                    {t.icon}
                    <span style={{ fontSize: "9px", lineHeight: 1.2, textAlign: "center" }}>{t.label}</span>
                  </button>
                ))}

                <div className="mt-3">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1 text-center">Color</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {COLORS.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        className="rounded-full transition-transform hover:scale-125"
                        style={{
                          width: 16, height: 16, background: c,
                          outline: color === c ? "2px solid #fff" : "2px solid transparent",
                          outlineOffset: "1px",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1 text-center">Size</p>
                  <div className="flex flex-col gap-1 items-center">
                    {SIZES.map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setLineWidth(s)}
                        className="flex items-center justify-center rounded transition-colors w-12 h-6"
                        style={{
                          background: lineWidth === s ? "#1e3a5f" : "transparent",
                          border: lineWidth === s ? "1px solid #3b82f6" : "1px solid transparent",
                        }}
                      >
                        <div className="rounded-full bg-gray-300" style={{ width: `${Math.min(s * 5, 40)}px`, height: `${s}px` }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-2" style={{ background: "#e8ecf0" }}>
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={480}
                  style={{ cursor: tool === "eraser" ? "cell" : "crosshair", border: "1px solid #cbd5e1", borderRadius: 4, background: "#fff", maxWidth: "100%", touchAction: "none" }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={() => setIsDrawing(false)}
                />
              </div>
            </>
          )}
        </div>

        {/* Status bar */}
        {!previewCrop && (
          <div className="px-4 py-1.5 text-[10px] text-gray-500" style={{ background: "#0a1020", borderTop: "1px solid #2a3a5e" }}>
            Active: <span className="text-blue-400 font-medium">{TOOLS.find(t => t.id === tool)?.label}</span>
            &nbsp;·&nbsp; Click &amp; drag to draw shapes &nbsp;·&nbsp; Hold shift for proportional shapes
          </div>
        )}
      </div>
    </div>
  );
}
