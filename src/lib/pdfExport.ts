import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DentalCase, ClinicalProcedure, EvidenceFile } from '../types';
import { ENDO_STAGES, formatTeethDisplay, parseProcedureTeeth } from './macroSteps';
import { sendAnalyticsEvent } from './analytics';

interface ProcessedPdfImage {
  dataUrl: string;
  width: number;
  height: number;
  format: 'JPEG' | 'PNG';
  isSupportedImage: boolean;
}

/**
  * Safely generates a clean, human-readable export filename compatible with all OSs.
  * Pattern: DentaTrack - [Patient Name] - [Document Type] - [YYYY-MM-DD].pdf
  * Removes internal UUIDs, raw timestamp numbers, database keys, and unsafe path characters.
  */
export function generateExportFilename(
  patientName?: string,
  docType = 'Case Report',
  dateStr?: string
): string {
  const cleanPatient = (patientName || 'Patient')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ') || 'Patient';

  const cleanDocType = (docType || 'Case Report')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ') || 'Case Report';

  const cleanDate = dateStr || new Date().toISOString().split('T')[0];

  return `DentaTrack - ${cleanPatient} - ${cleanDocType} - ${cleanDate}.pdf`;
}

export interface PdfExportResult {
  success: boolean;
  method: 'share' | 'download' | 'share_cancelled';
  filename: string;
}

/**
 * Converts SVG data URLs or markup strings into crisp PNG raster data URLs.
 * Handles base64, utf8 URL-encoded strings, missing viewBox/dimensions, and XML namespaces.
 * Uses inline Data URIs and explicit Image element dimensions for 100% mobile WebKit/iOS compatibility.
 */
async function convertSvgToRaster(svgInput: string): Promise<ProcessedPdfImage | null> {
  return new Promise((resolve) => {
    try {
      let svgText = '';
      if (svgInput.includes('base64,')) {
        const base64Str = svgInput.split('base64,')[1];
        try {
          svgText = decodeURIComponent(escape(atob(base64Str)));
        } catch {
          svgText = atob(base64Str);
        }
      } else if (svgInput.includes('utf8,')) {
        svgText = decodeURIComponent(svgInput.split('utf8,')[1]);
      } else if (svgInput.includes('data:image/svg+xml,')) {
        svgText = decodeURIComponent(svgInput.split('data:image/svg+xml,')[1]);
      } else if (svgInput.trim().startsWith('<svg')) {
        svgText = svgInput.trim();
      }

      if (!svgText || !svgText.includes('<svg')) {
        return convertRasterImage(svgInput).then(resolve);
      }

      // Parse with DOMParser to fix dimensions and xmlns
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');

      if (!svgEl) {
        return convertRasterImage(svgInput).then(resolve);
      }

      if (!svgEl.hasAttribute('xmlns')) {
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      let width = parseFloat(svgEl.getAttribute('width') || '0');
      let height = parseFloat(svgEl.getAttribute('height') || '0');

      if (!width || !height || isNaN(width) || isNaN(height)) {
        const viewBox = svgEl.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/[\s,]+/).map(parseFloat);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            width = parts[2];
            height = parts[3];
          }
        }
      }

      if (!width || isNaN(width) || width <= 0) width = 800;
      if (!height || isNaN(height) || height <= 0) height = 800;

      svgEl.setAttribute('width', width.toString());
      svgEl.setAttribute('height', height.toString());

      const cleanedSvgStr = new XMLSerializer().serializeToString(svgEl);

      // Use clean Base64 Data URI instead of Blob URL to prevent WebKit / iOS canvas security errors
      let svgDataUri = '';
      try {
        svgDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(cleanedSvgStr)))}`;
      } catch {
        svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(cleanedSvgStr)}`;
      }

      const MAX_DIM = 1200;
      let targetW = width;
      let targetH = height;

      if (targetW > MAX_DIM || targetH > MAX_DIM) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * MAX_DIM) / targetW);
          targetW = MAX_DIM;
        } else {
          targetW = Math.round((targetW * MAX_DIM) / targetH);
          targetH = MAX_DIM;
        }
      }

      const img = new Image();
      img.width = targetW;
      img.height = targetH;

      const renderToCanvas = async () => {
        try {
          if ('decode' in img) {
            await img.decode().catch(() => {});
          }
        } catch {
          // Ignore decode errors and proceed to canvas
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const pngDataUrl = canvas.toDataURL('image/png', 0.95);

          resolve({
            dataUrl: pngDataUrl,
            width: targetW,
            height: targetH,
            format: 'PNG',
            isSupportedImage: true,
          });
        } else {
          resolve(null);
        }
      };

      img.onload = () => {
        renderToCanvas();
      };

      img.onerror = () => {
        convertRasterImage(svgInput).then(resolve);
      };

      img.src = svgDataUri;
    } catch (err) {
      console.warn('SVG rasterization notice:', err);
      convertRasterImage(svgInput).then(resolve);
    }
  });
}

/**
 * Handles JPEG, PNG, WebP, and standard base64/data URLs.
 * Downscales images exceeding 1200px max dimension.
 */
async function convertRasterImage(dataUrl: string): Promise<ProcessedPdfImage | null> {
  return new Promise((resolve) => {
    const img = new Image();

    // Only set crossOrigin for remote HTTP/HTTPS assets
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      const origW = img.naturalWidth || img.width || 800;
      const origH = img.naturalHeight || img.height || 600;

      const MAX_DIM = 1200;
      let targetW = origW;
      let targetH = origH;

      if (origW > MAX_DIM || origH > MAX_DIM) {
        if (origW > origH) {
          targetW = MAX_DIM;
          targetH = Math.round((origH * MAX_DIM) / origW);
        } else {
          targetH = MAX_DIM;
          targetW = Math.round((origW * MAX_DIM) / origH);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const isPng = dataUrl.startsWith('data:image/png');
        const format: 'JPEG' | 'PNG' = isPng ? 'PNG' : 'JPEG';
        const resizedDataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.88);

        resolve({
          dataUrl: resizedDataUrl,
          width: targetW,
          height: targetH,
          format,
          isSupportedImage: true,
        });
      } else {
        resolve({
          dataUrl,
          width: origW,
          height: origH,
          format: 'JPEG',
          isSupportedImage: true,
        });
      }
    };

    img.onerror = () => {
      resolve({
        dataUrl: '',
        width: 0,
        height: 0,
        format: 'JPEG',
        isSupportedImage: false,
      });
    };

    img.src = dataUrl;
  });
}

/**
 * Universal Image Preparation Pipeline for PDF generation.
 * Decodes and standardizes real uploads (JPG/PNG/WebP) and demo SVG data URLs.
 */
async function prepareImageForPdf(dataUrl?: string): Promise<ProcessedPdfImage | null> {
  if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.trim().length === 0) {
    return null;
  }

  let normalizedUrl = dataUrl.trim();

  // Normalize raw base64 or unformatted SVG strings if missing data URI headers
  if (!normalizedUrl.startsWith('data:') && !normalizedUrl.startsWith('http') && !normalizedUrl.startsWith('blob:')) {
    if (normalizedUrl.includes('<svg') || normalizedUrl.startsWith('PHN2Zy')) {
      normalizedUrl = normalizedUrl.includes('<svg')
        ? `data:image/svg+xml;utf8,${encodeURIComponent(normalizedUrl)}`
        : `data:image/svg+xml;base64,${normalizedUrl}`;
    } else if (normalizedUrl.startsWith('/9j/')) {
      normalizedUrl = `data:image/jpeg;base64,${normalizedUrl}`;
    } else if (normalizedUrl.startsWith('iVBORw0KGgo')) {
      normalizedUrl = `data:image/png;base64,${normalizedUrl}`;
    } else {
      normalizedUrl = `data:image/jpeg;base64,${normalizedUrl}`;
    }
  }

  const isSvg = normalizedUrl.includes('image/svg+xml') || normalizedUrl.includes('<svg');

  if (isSvg) {
    return convertSvgToRaster(normalizedUrl);
  } else {
    return convertRasterImage(normalizedUrl);
  }
}

function drawAttachmentFallbackBox(
  doc: jsPDF,
  fileName: string,
  category: string,
  fileSize: number,
  yPos: number,
  pageWidth: number
): number {
  const boxWidth = pageWidth - 28;
  const boxHeight = 22;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Attachment: ${fileName}`, 18, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const sizeKb = fileSize > 0 ? `${(fileSize / 1024).toFixed(1)} KB` : 'Local File';
  doc.text(`Category: ${category}  •  Size: ${sizeKb}`, 18, yPos + 13);
  
  doc.setTextColor(225, 29, 72);
  doc.setFont('helvetica', 'bold');
  doc.text('Unable to preview attachment image in PDF report', 18, yPos + 18);

  return yPos + boxHeight + 6;
}

interface RenderAttachmentParams {
  doc: jsPDF;
  title: string;
  subLabel?: string;
  category?: string;
  fileDataUrl?: string;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
  isRubric?: boolean;
  yPos: number;
  pageWidth: number;
  pageHeight: number;
  ensureSpace: (neededHeight: number) => number;
}

/**
 * Reusable Attachment Block Renderer.
 * Treats the Title, Sublabel, Image, and Caption/Metadata as a SINGLE logical unit.
 * Calculates total block height upfront and triggers page breaks before rendering,
 * guaranteeing labels are NEVER separated from their corresponding image.
 */
async function renderAttachmentBlock(params: RenderAttachmentParams): Promise<number> {
  const {
    doc,
    title,
    subLabel,
    category,
    fileDataUrl,
    fileName,
    fileSize = 0,
    uploadedAt,
    isRubric = false,
    pageWidth,
    ensureSpace,
  } = params;

  // Process image
  const prepared = await prepareImageForPdf(fileDataUrl);

  const maxW = pageWidth - 28; // 182mm on A4
  const maxH = isRubric ? 150 : 105; // mm

  if (prepared && prepared.isSupportedImage && prepared.dataUrl) {
    const aspect = prepared.width / prepared.height || 1.33;
    let renderW = maxW;
    let renderH = maxW / aspect;

    if (renderH > maxH) {
      renderH = maxH;
      renderW = maxH * aspect;
    }

    // Total vertical space needed for complete attachment block:
    // Title (6mm) + Sublabel (5mm if present) + Top Pad (3mm) + Image (renderH) + Bottom Pad (3mm) + Caption (8mm) + Block Gap (8mm)
    const headerH = 6 + (subLabel ? 5 : 0);
    const captionH = 8;
    const padding = 6;
    const gap = 8;
    const totalBlockHeight = headerH + padding + renderH + captionH + gap;

    // Check pagination upfront for the ENTIRE block
    let currentY = ensureSpace(totalBlockHeight);

    // 1. Draw Section Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, 14, currentY);
    currentY += 5;

    // 2. Draw Sublabel if provided
    if (subLabel) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(subLabel, 14, currentY);
      currentY += 4.5;
    }

    currentY += 2;

    // 3. Draw Image Frame & Content (centered horizontally)
    const xPos = 14 + (maxW - renderW) / 2;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(xPos - 1, currentY - 1, renderW + 2, renderH + 2, 1.5, 1.5, 'FD');

    try {
      doc.addImage(
        prepared.dataUrl,
        prepared.format,
        xPos,
        currentY,
        renderW,
        renderH,
        undefined,
        'FAST'
      );
      currentY += renderH + 5;

      // 4. Draw Caption / Metadata directly below the image
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);

      const dateText = uploadedAt ? new Date(uploadedAt).toLocaleDateString() : new Date().toLocaleDateString();
      const metaText = `File: ${fileName}${category ? `  •  Category: ${category}` : ''}  •  Uploaded: ${dateText}`;
      doc.text(metaText, 14, currentY);
      currentY += 8;

      return currentY;
    } catch (err) {
      console.warn('Failed to embed image in PDF:', err);
      return drawAttachmentFallbackBox(doc, fileName, category || 'Clinical Photo', fileSize, currentY, pageWidth);
    }
  } else {
    // Fallback block if file is missing or corrupted
    const fallbackHeight = 28;
    const currentY = ensureSpace(fallbackHeight);
    return drawAttachmentFallbackBox(doc, fileName, category || 'Attachment', fileSize, currentY, pageWidth);
  }
}

/**
 * Generates an academic-grade clinical case report PDF for Moodle submission.
 */
export async function generateCaseMoodlePDF(dentalCase: DentalCase): Promise<PdfExportResult> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  const ensureSpace = (neededHeight: number): number => {
    if (yPos + neededHeight > pageHeight - 16) {
      doc.addPage();
      yPos = 20;
    }
    return yPos;
  };

  // Header Banner
  doc.setFillColor(2, 132, 199); // Dental Cyan #0284c7
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('5th-Year Dental Clinical Case File', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Faculty of Dentistry • Comprehensive Clinic Moodle Submission Dossier', 14, 19);

  yPos = 38;

  // Case Metadata Box
  doc.setFillColor(243, 246, 250);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, yPos, pageWidth - 28, 44, 3, 3, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Patient: ${dentalCase.patientName}`, 20, yPos + 10);
  doc.text(`File Number: #${dentalCase.fileNumber}`, 120, yPos + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Clinic Place: Clinic ${dentalCase.clinicPlace}`, 20, yPos + 18);
  doc.text(`Semester: ${dentalCase.semester} (${dentalCase.academicYear})`, 120, yPos + 18);

  doc.text(`Case Status: ${dentalCase.status}`, 20, yPos + 26);
  doc.text(
    `Comprehensive Case: ${dentalCase.isComprehensive ? 'YES (3+ Disciplines Verified)' : 'Single Discipline'}`,
    120,
    yPos + 26
  );

  doc.text(`Disciplines: ${dentalCase.disciplines.join(', ')}`, 20, yPos + 34);
  doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 120, yPos + 34);

  yPos += 52;

  // Procedures & Signed Rubrics Table Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(2, 132, 199);
  doc.text('Clinical Procedures & Rubric Sign-off Summary', 14, yPos);
  yPos += 6;

  for (let i = 0; i < dentalCase.procedures.length; i++) {
    const proc = dentalCase.procedures[i];

    ensureSpace(32);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, yPos, pageWidth - 28, 26, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${i + 1}. [${proc.discipline}] ${proc.title}`, 18, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${proc.date}  •  Status: ${proc.status}  •  Moodle: ${proc.moodleStatus}`, 18, yPos + 14);

    const rubricCount = proc.rubrics.length;
    const signedCount = proc.rubrics.filter((r) => r.status === 'Signed').length;
    const signees = proc.rubrics
      .filter((r) => r.status === 'Signed')
      .map((r) => `${r.instructorName} (${r.instructorRole || 'Instructor'})`)
      .join('; ');

    doc.text(
      `Rubrics: ${signedCount}/${rubricCount} signed ${signees ? `• Signed by: ${signees}` : ''}`,
      18,
      yPos + 21
    );

    yPos += 30;
  }

  // =========================================================================
  // DETAILED PROCEDURE ATTACHMENTS & RADIOGRAPHS SECTION
  // =========================================================================
  for (let i = 0; i < dentalCase.procedures.length; i++) {
    const proc = dentalCase.procedures[i];

    // Force page break per procedure for clean sectioning
    doc.addPage();
    yPos = 18;

    // Procedure Section Header Banner
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(148, 163, 184);
    doc.roundedRect(14, yPos, pageWidth - 28, 16, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`PROCEDURE ${i + 1}: [${proc.discipline}] ${proc.title}`, 18, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const toothInfo = proc.toothNumber ? formatTeethDisplay(proc.toothNumber) : 'General';
    doc.text(`Tooth / Arch: ${toothInfo}  •  Date: ${proc.date}  •  Status: ${proc.status}`, 18, yPos + 12);

    yPos += 22;

    // ENDODONTIC PROCEDURES: Render Structured Radiograph Stages
    if (proc.discipline === 'Endo') {
      const teeth = parseProcedureTeeth(proc.toothNumber);

      for (const toothLabel of teeth) {
        ensureSpace(18);

        // Tooth Sub-Header
        doc.setFillColor(2, 132, 199);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`ENDODONTIC RADIOGRAPHS – TOOTH ${toothLabel.toUpperCase()}`, 18, yPos + 5.5);

        yPos += 12;

        for (const stage of ENDO_STAGES) {
          const radiograph = proc.evidenceFiles.find((ev) => {
            if (ev.endoToothNumber && ev.endoStage) {
              return ev.endoToothNumber === toothLabel && ev.endoStage === stage.key;
            }
            if (teeth.length === 1 && ev.endoStage === stage.key) {
              return true;
            }
            return false;
          });

          if (radiograph) {
            yPos = await renderAttachmentBlock({
              doc,
              title: `Stage: ${stage.label}`,
              subLabel: `Tooth #${toothLabel}  •  Endodontic Workflow`,
              category: 'Radiograph',
              fileDataUrl: radiograph.fileDataUrl,
              fileName: radiograph.fileName,
              fileSize: radiograph.fileSize,
              uploadedAt: radiograph.uploadedAt,
              isRubric: false,
              yPos,
              pageWidth,
              pageHeight,
              ensureSpace,
            });
          }
        }
      }

      // Non-stage generic evidence for Endo procedures
      const genericEvidences = proc.evidenceFiles.filter((ev) => !ev.endoStage);
      if (genericEvidences.length > 0) {
        ensureSpace(15);
        doc.setTextColor(2, 132, 199);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Other Clinical Evidence & Photographs', 14, yPos);
        yPos += 8;

        for (const ev of genericEvidences) {
          yPos = await renderAttachmentBlock({
            doc,
            title: `[${ev.category}] ${ev.fileName}`,
            category: ev.category,
            fileDataUrl: ev.fileDataUrl,
            fileName: ev.fileName,
            fileSize: ev.fileSize,
            uploadedAt: ev.uploadedAt,
            isRubric: false,
            yPos,
            pageWidth,
            pageHeight,
            ensureSpace,
          });
        }
      }
    } else {
      // NON-ENDODONTIC PROCEDURES (Operative, Fixed, Perio, Surgery, Removable, etc.)
      if (proc.evidenceFiles.length > 0) {
        ensureSpace(15);
        doc.setTextColor(2, 132, 199);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Clinical Evidence & Photographs', 14, yPos);
        yPos += 8;

        for (const ev of proc.evidenceFiles) {
          yPos = await renderAttachmentBlock({
            doc,
            title: `[${ev.category}] ${ev.fileName}`,
            category: ev.category,
            fileDataUrl: ev.fileDataUrl,
            fileName: ev.fileName,
            fileSize: ev.fileSize,
            uploadedAt: ev.uploadedAt,
            isRubric: false,
            yPos,
            pageWidth,
            pageHeight,
            ensureSpace,
          });
        }
      }
    }

    // PROCEDURE SIGNED RUBRICS
    if (proc.rubrics.length > 0) {
      ensureSpace(15);
      doc.setTextColor(2, 132, 199);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Signed Clinical Rubrics', 14, yPos);
      yPos += 8;

      for (const rub of proc.rubrics) {
        yPos = await renderAttachmentBlock({
          doc,
          title: `Signed Evaluation Rubric: ${rub.title}`,
          subLabel: `Instructor: ${rub.instructorName} (${rub.instructorRole || 'Staff Doctor'})  •  Status: ${rub.status}  •  Signed: ${rub.signatureDate || 'Yes'}`,
          category: 'Rubric Sign-off',
          fileDataUrl: rub.fileDataUrl,
          fileName: rub.fileName || 'signed_rubric.jpg',
          fileSize: 512000,
          uploadedAt: rub.uploadedAt,
          isRubric: true,
          yPos,
          pageWidth,
          pageHeight,
          ensureSpace,
        });
      }
    }
  }

  // Multi-page footer pass
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `DentaTrack Clinical Dossier  •  Patient: ${dentalCase.patientName} (#${dentalCase.fileNumber})`,
      14,
      pageHeight - 6
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
  }

  const filename = generateExportFilename(dentalCase.patientName, 'Case Report');
  sendAnalyticsEvent('case_exported');

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

  if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: filename,
        });
        return { success: true, method: 'share', filename };
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('cancel') || err.message?.includes('cancellation')) {
        return { success: true, method: 'share_cancelled', filename };
      }
      console.warn('Native PDF share notice, falling back to download:', err);
    }
  }

  doc.save(filename);
  return { success: true, method: 'download', filename };
}

/**
 * Exports all case records, attachments, and rubrics into a structured ZIP archive.
 */
export async function exportCaseAsZip(dentalCase: DentalCase): Promise<void> {
  const zip = new JSZip();
  const folderName = `Case_${dentalCase.fileNumber}_${dentalCase.patientName.replace(/\s+/g, '_')}`;
  const root = zip.folder(folderName);

  if (!root) return;

  // 1. Text Summary Manifest
  const manifestContent = `5th-YEAR DENTAL CLINICAL CASE DOSSIER
===========================================
Patient Name: ${dentalCase.patientName}
Patient File Number: #${dentalCase.fileNumber}
Semester: ${dentalCase.semester} (${dentalCase.academicYear})
Clinic Location: Clinic ${dentalCase.clinicPlace}
Overall Status: ${dentalCase.status}
Is Comprehensive (3+ Disciplines): ${dentalCase.isComprehensive ? 'YES' : 'NO'}
Disciplines Included: ${dentalCase.disciplines.join(', ')}
Created: ${dentalCase.createdAt}
Next Visit Plan: ${dentalCase.targetNextVisitPlan || 'None specified'}
Notes: ${dentalCase.notes || 'None'}

CLINICAL PROCEDURES:
${dentalCase.procedures
  .map(
    (p, i) => `
${i + 1}. [${p.discipline}] ${p.title}
   Tooth / Arch: ${p.toothNumber || 'General'}
   Date: ${p.date}
   Status: ${p.status}
   Moodle Status: ${p.moodleStatus} ${p.moodleSubmissionRef ? `(Ref: ${p.moodleSubmissionRef})` : ''}
   Chairside Steps:
   ${p.steps.map((s) => `  - [${s.isCompleted ? 'X' : ' '}] ${s.title} ${s.completedDate ? `(${s.completedDate})` : ''}`).join('\n')}
   Evidence Files: ${p.evidenceFiles.length} attached
   ${p.evidenceFiles.map((ev) => `  - [${ev.category}] ${ev.endoToothNumber ? `${ev.endoToothNumber} ` : ''}${ev.endoStage ? `${ev.endoStage} ` : ''}${ev.fileName}`).join('\n')}
   Rubrics:
   ${p.rubrics.map((r) => `  - ${r.title}: ${r.status} by ${r.instructorName} on ${r.signatureDate || 'N/A'}`).join('\n')}
`
  )
  .join('\n')}
`;

  root.file('Case_Summary.txt', manifestContent);

  // 2. Separate folders by procedure for evidence & rubrics
  for (let idx = 0; idx < dentalCase.procedures.length; idx++) {
    const p = dentalCase.procedures[idx];
    const safeProcName = `${String(idx + 1).padStart(2, '0')}_${p.discipline}_${p.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const procFolder = root.folder(safeProcName);
    if (!procFolder) continue;

    // Save rubric images
    p.rubrics.forEach((rub, rIdx) => {
      if (rub.fileDataUrl) {
        if (rub.fileDataUrl.includes('base64,')) {
          const base64Data = rub.fileDataUrl.split('base64,')[1];
          const ext = rub.fileName?.endsWith('.pdf') ? 'pdf' : 'jpg';
          procFolder.file(`signed_rubric_${rIdx + 1}.${ext}`, base64Data, { base64: true });
        } else {
          procFolder.file(`signed_rubric_${rIdx + 1}.txt`, rub.fileDataUrl);
        }
      }
    });

    // Save evidence files
    p.evidenceFiles.forEach((ev, eIdx) => {
      if (ev.fileDataUrl) {
        if (ev.fileDataUrl.includes('base64,')) {
          const base64Data = ev.fileDataUrl.split('base64,')[1];
          const ext = ev.fileName?.split('.').pop() || 'jpg';
          const toothPrefix = ev.endoToothNumber ? `${ev.endoToothNumber.replace(/[^a-zA-Z0-9_-]/g, '')}_` : '';
          const stagePrefix = ev.endoStage ? `${ev.endoStage}_` : '';
          procFolder.file(
            `evidence_${eIdx + 1}_${toothPrefix}${stagePrefix}${ev.category}.${ext}`,
            base64Data,
            { base64: true }
          );
        } else {
          procFolder.file(`evidence_${eIdx + 1}_${ev.category}.txt`, ev.fileDataUrl);
        }
      }
    });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const zipFilename = generateExportFilename(dentalCase.patientName, 'Case Archive').replace('.pdf', '.zip');
  saveAs(blob, zipFilename);
  sendAnalyticsEvent('case_exported');
}
