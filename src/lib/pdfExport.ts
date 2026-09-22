import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DentalCase, ClinicalProcedure, EvidenceFile } from '../types';
import { ENDO_STAGES, formatTeethDisplay, parseProcedureTeeth } from './macroSteps';

interface ProcessedPdfImage {
  dataUrl: string;
  width: number;
  height: number;
  format: 'JPEG' | 'PNG';
  isSupportedImage: boolean;
}

/**
 * Prepares an image for PDF embedding:
 * - Downscales large images to max dimension 1200px on an offscreen canvas.
 * - Extracts width, height, and format.
 * - Keeps original data intact in IndexedDB.
 */
async function prepareImageForPdf(dataUrl?: string): Promise<ProcessedPdfImage | null> {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  const isDataImage = dataUrl.startsWith('data:image/');
  if (!isDataImage) {
    return {
      dataUrl: '',
      width: 0,
      height: 0,
      format: 'JPEG',
      isSupportedImage: false,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
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
  doc.text(
    `Category: ${category}  •  Size: ${(fileSize / 1024).toFixed(1)} KB`,
    18,
    yPos + 13
  );
  doc.setTextColor(225, 29, 72);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'File attached separately / unsupported preview format',
    18,
    yPos + 18
  );

  return yPos + boxHeight + 6;
}

export async function generateCaseMoodlePDF(dentalCase: DentalCase): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  const ensureSpace = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - 15) {
      doc.addPage();
      yPos = 20;
    }
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

  const statusText = dentalCase.status;
  doc.text(`Case Status: ${statusText}`, 20, yPos + 26);
  doc.text(
    `Comprehensive Case: ${dentalCase.isComprehensive ? 'YES (3+ Disciplines Verified)' : 'Single Discipline'}`,
    120,
    yPos + 26
  );

  doc.text(`Disciplines: ${dentalCase.disciplines.join(', ')}`, 20, yPos + 34);
  doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 120, yPos + 34);

  yPos += 52;

  // Procedures & Signed Rubrics Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(2, 132, 199);
  doc.text('Clinical Procedures & Rubric Sign-off Summary', 14, yPos);
  yPos += 6;

  for (let i = 0; i < dentalCase.procedures.length; i++) {
    const proc = dentalCase.procedures[i];

    ensureSpace(35);

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

    // IF ENDODONTIC PROCEDURE: Render Structured Radiograph Stages per Tooth
    if (proc.discipline === 'Endo') {
      const teeth = parseProcedureTeeth(proc.toothNumber);

      for (const toothLabel of teeth) {
        ensureSpace(20);

        // Tooth Section Banner
        doc.setFillColor(2, 132, 199);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`ENDODONTIC RADIOGRAPHS – ${toothLabel.toUpperCase()}`, 18, yPos + 5.5);

        yPos += 12;

        for (const stage of ENDO_STAGES) {
          // Find matching radiograph for this tooth and stage
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
            ensureSpace(20);

            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`${stage.label}`, 14, yPos);
            yPos += 5;

            const prepared = await prepareImageForPdf(radiograph.fileDataUrl);

            if (prepared && prepared.isSupportedImage && prepared.dataUrl) {
              const maxW = pageWidth - 28; // 182mm
              const maxH = 110; // Max height in mm

              const aspect = prepared.width / prepared.height;
              let renderW = maxW;
              let renderH = maxW / aspect;

              if (renderH > maxH) {
                renderH = maxH;
                renderW = maxH * aspect;
              }

              ensureSpace(renderH + 12);

              try {
                doc.addImage(
                  prepared.dataUrl,
                  prepared.format,
                  14,
                  yPos,
                  renderW,
                  renderH,
                  undefined,
                  'FAST'
                );
                yPos += renderH + 5;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(
                  `File: ${radiograph.fileName}  •  Stage: ${stage.label}  •  Tooth: ${toothLabel}`,
                  14,
                  yPos
                );
                yPos += 8;
              } catch (err) {
                yPos = drawAttachmentFallbackBox(
                  doc,
                  radiograph.fileName,
                  stage.label,
                  radiograph.fileSize,
                  yPos,
                  pageWidth
                );
              }
            } else {
              yPos = drawAttachmentFallbackBox(
                doc,
                radiograph.fileName,
                stage.label,
                radiograph.fileSize,
                yPos,
                pageWidth
              );
            }
          }
        }
      }

      // Check if there are non-endo generic evidence files on this Endo procedure
      const genericEvidences = proc.evidenceFiles.filter((ev) => !ev.endoStage);
      if (genericEvidences.length > 0) {
        ensureSpace(15);
        doc.setTextColor(2, 132, 199);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Other Clinical Evidence & Photographs', 14, yPos);
        yPos += 8;

        for (const ev of genericEvidences) {
          ensureSpace(15);

          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text(`[${ev.category}] ${ev.fileName}`, 14, yPos);
          yPos += 5;

          const prepared = await prepareImageForPdf(ev.fileDataUrl);
          if (prepared && prepared.isSupportedImage && prepared.dataUrl) {
            const maxW = pageWidth - 28;
            const maxH = 110;
            const aspect = prepared.width / prepared.height;
            let renderW = maxW;
            let renderH = maxW / aspect;

            if (renderH > maxH) {
              renderH = maxH;
              renderW = maxH * aspect;
            }

            ensureSpace(renderH + 12);

            try {
              doc.addImage(
                prepared.dataUrl,
                prepared.format,
                14,
                yPos,
                renderW,
                renderH,
                undefined,
                'FAST'
              );
              yPos += renderH + 5;

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(100, 116, 139);
              doc.text(`Category: ${ev.category}  •  File: ${ev.fileName}`, 14, yPos);
              yPos += 8;
            } catch (err) {
              yPos = drawAttachmentFallbackBox(
                doc,
                ev.fileName,
                ev.category,
                ev.fileSize,
                yPos,
                pageWidth
              );
            }
          } else {
            yPos = drawAttachmentFallbackBox(
              doc,
              ev.fileName,
              ev.category,
              ev.fileSize,
              yPos,
              pageWidth
            );
          }
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
          ensureSpace(15);

          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text(`[${ev.category}] ${ev.fileName}`, 14, yPos);
          yPos += 5;

          const prepared = await prepareImageForPdf(ev.fileDataUrl);
          if (prepared && prepared.isSupportedImage && prepared.dataUrl) {
            const maxW = pageWidth - 28;
            const maxH = 110;
            const aspect = prepared.width / prepared.height;
            let renderW = maxW;
            let renderH = maxW / aspect;

            if (renderH > maxH) {
              renderH = maxH;
              renderW = maxH * aspect;
            }

            ensureSpace(renderH + 12);

            try {
              doc.addImage(
                prepared.dataUrl,
                prepared.format,
                14,
                yPos,
                renderW,
                renderH,
                undefined,
                'FAST'
              );
              yPos += renderH + 5;

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(100, 116, 139);
              doc.text(`Category: ${ev.category}  •  File: ${ev.fileName}`, 14, yPos);
              yPos += 8;
            } catch (err) {
              yPos = drawAttachmentFallbackBox(
                doc,
                ev.fileName,
                ev.category,
                ev.fileSize,
                yPos,
                pageWidth
              );
            }
          } else {
            yPos = drawAttachmentFallbackBox(
              doc,
              ev.fileName,
              ev.category,
              ev.fileSize,
              yPos,
              pageWidth
            );
          }
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
        ensureSpace(15);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Rubric: ${rub.title}`, 14, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(
          `Instructor: ${rub.instructorName} (${rub.instructorRole || 'Staff Doctor'})  •  Status: ${rub.status}  •  Signed: ${rub.signatureDate || 'Yes'}`,
          14,
          yPos
        );
        yPos += 6;

        if (rub.fileDataUrl) {
          const prepared = await prepareImageForPdf(rub.fileDataUrl);
          if (prepared && prepared.isSupportedImage && prepared.dataUrl) {
            const maxW = pageWidth - 28;
            const maxH = 170; // Allow larger height for rubric sheets
            const aspect = prepared.width / prepared.height;
            let renderW = maxW;
            let renderH = maxW / aspect;

            if (renderH > maxH) {
              renderH = maxH;
              renderW = maxH * aspect;
            }

            ensureSpace(renderH + 10);

            try {
              doc.addImage(
                prepared.dataUrl,
                prepared.format,
                14,
                yPos,
                renderW,
                renderH,
                undefined,
                'FAST'
              );
              yPos += renderH + 8;
            } catch (err) {
              yPos = drawAttachmentFallbackBox(
                doc,
                rub.fileName || 'signed_rubric.pdf',
                'Signed Rubric',
                10240,
                yPos,
                pageWidth
              );
            }
          } else {
            yPos = drawAttachmentFallbackBox(
              doc,
              rub.fileName || 'signed_rubric.pdf',
              'Signed Rubric',
              10240,
              yPos,
              pageWidth
            );
          }
        }
      }
    }
  }

  const safePatientName = dentalCase.patientName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Case_File_${dentalCase.fileNumber}_${safePatientName}_Moodle.pdf`;
  doc.save(filename);
}

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
  dentalCase.procedures.forEach((p, idx) => {
    const safeProcName = `${String(idx + 1).padStart(2, '0')}_${p.discipline}_${p.title.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const procFolder = root.folder(safeProcName);
    if (!procFolder) return;

    // Save rubric images
    p.rubrics.forEach((rub, rIdx) => {
      if (rub.fileDataUrl && rub.fileDataUrl.includes('base64,')) {
        const base64Data = rub.fileDataUrl.split('base64,')[1];
        const ext = rub.fileName?.endsWith('.pdf') ? 'pdf' : 'jpg';
        procFolder.file(`signed_rubric_${rIdx + 1}.${ext}`, base64Data, { base64: true });
      }
    });

    // Save evidence files
    p.evidenceFiles.forEach((ev, eIdx) => {
      if (ev.fileDataUrl && ev.fileDataUrl.includes('base64,')) {
        const base64Data = ev.fileDataUrl.split('base64,')[1];
        const ext = ev.fileName?.split('.').pop() || 'jpg';
        const toothPrefix = ev.endoToothNumber ? `${ev.endoToothNumber.replace(/[^a-zA-Z0-9_-]/g, '')}_` : '';
        const stagePrefix = ev.endoStage ? `${ev.endoStage}_` : '';
        procFolder.file(
          `evidence_${eIdx + 1}_${toothPrefix}${stagePrefix}${ev.category}.${ext}`,
          base64Data,
          { base64: true }
        );
      }
    });
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${folderName}_Archive.zip`);
}
