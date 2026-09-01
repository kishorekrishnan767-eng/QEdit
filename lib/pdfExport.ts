import { PaperData } from "@/types";
import { detectExamCategory } from "./examCategory";

export async function exportToPDF(
  previewElement: HTMLElement,
  paperData: PaperData
): Promise<boolean> {
  try {
    // Dynamic imports to avoid SSR issues
    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default;
    const { jsPDF } = await import("jspdf");

    // Temporarily reset the scale on the inner wrapper so html2canvas captures at full size
    const scaledWrapper = previewElement.querySelector(
      ".print-reset-transform"
    ) as HTMLElement | null;
    const prevTransform = scaledWrapper?.style.transform || "";
    if (scaledWrapper) scaledWrapper.style.transform = "none";

    // Fix for html2canvas: override Tailwind's lab() colors on captured elements
    const allEls = previewElement.querySelectorAll("*");
    allEls.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computed = getComputedStyle(htmlEl);
      if (
        computed.color.includes("lab(") ||
        computed.color.includes("oklch(")
      ) {
        htmlEl.style.color = "#000";
      }
      if (
        computed.backgroundColor.includes("lab(") ||
        computed.backgroundColor.includes("oklch(")
      ) {
        htmlEl.style.backgroundColor = "transparent";
      }
      if (
        computed.borderColor.includes("lab(") ||
        computed.borderColor.includes("oklch(")
      ) {
        htmlEl.style.borderColor = "#000";
      }
    });

    // Wait a frame for the layout to settle
    await new Promise((r) => setTimeout(r, 100));

    const pageElements = previewElement.querySelectorAll("[data-page-index]");
    if (pageElements.length === 0) {
      if (scaledWrapper) scaledWrapper.style.transform = prevTransform;
      return false;
    }

    const canvases: HTMLCanvasElement[] = [];
    for (let i = 0; i < pageElements.length; i++) {
      const el = pageElements[i] as HTMLElement;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      canvases.push(canvas);
    }

    // Restore scale
    if (scaledWrapper) scaledWrapper.style.transform = prevTransform;

    const examName = paperData.header.examName || "";
    const category = detectExamCategory(examName);
    const isCycleTest = category === "cycle_test_1" || category === "cycle_test_2";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdf: any;
    if (isCycleTest) {
      // Landscape A4: 297mm x 210mm
      const pdfWidth = 297;
      const pdfHeight = 210;
      pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const halfWidth = pdfWidth / 2;
      const padding = 3;

      // Each paper page gets its own landscape PDF page with two identical copies side by side
      for (let i = 0; i < canvases.length; i++) {
        if (i > 0) pdf.addPage();

        const pageCanvas = canvases[i];
        const aspect = pageCanvas.height / pageCanvas.width;
        const slotW = halfWidth - padding * 2;
        const slotH = pdfHeight - padding * 2;
        let imgW = slotW;
        let imgH = imgW * aspect;
        if (imgH > slotH) {
          imgH = slotH;
          imgW = imgH / aspect;
        }
        const offsetY = padding + (slotH - imgH) / 2;
        const imgDataUrl = pageCanvas.toDataURL("image/jpeg", 0.95);

        // Left copy
        const leftX = padding + (slotW - imgW) / 2;
        pdf.addImage(imgDataUrl, "JPEG", leftX, offsetY, imgW, imgH);

        // Right copy (identical)
        const rightX = halfWidth + padding + (slotW - imgW) / 2;
        pdf.addImage(imgDataUrl, "JPEG", rightX, offsetY, imgW, imgH);
      }
    } else {
      // Portrait A4: 210mm x 297mm (Standard vertical format for Model Exams)
      pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      for (let i = 0; i < canvases.length; i++) {
        if (i > 0) pdf.addPage();
        const canvas = canvases[i];
        
        const aspect = canvas.height / canvas.width;
        let imgW = 210;
        let imgH = 210 * aspect;
        
        // If the height exceeds A4 height, scale down to fit height
        if (imgH > 297) {
          imgH = 297;
          imgW = imgH / aspect;
        }
        
        // Center the image on the page
        const x = (210 - imgW) / 2;
        const y = (297 - imgH) / 2;

        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          x,
          y,
          imgW,
          imgH
        );
      }
    }

    pdf.save(`${paperData.header.subject || "question-paper"}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation failed:", err);
    return false;
  }
}
