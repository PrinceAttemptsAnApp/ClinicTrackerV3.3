import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DentalCase } from '../types';

export async function generateCaseMoodlePDF(dentalCase: DentalCase): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

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

    if (yPos > pageHeight - 35) {
      doc.addPage();
      yPos = 20;
    }

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

  // Next: Embed Signed Rubric Photographs
  const rubricsWithImages = dentalCase.procedures.flatMap((p) =>
    p.rubrics.filter((r) => r.fileDataUrl && r.fileDataUrl.startsWith('data:image')).map((r) => ({
      ...r,
      procTitle: p.title,
      discipline: p.discipline,
    }))
  );

  if (rubricsWithImages.length > 0) {
    for (const rub of rubricsWithImages) {
      doc.addPage();
      yPos = 16;

      doc.setTextColor(2, 132, 199);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`Signed Clinical Rubric: ${rub.title}`, 14, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Procedure: ${rub.procTitle} (${rub.discipline})  |  Signee: ${rub.instructorName}  |  Signed: ${rub.signatureDate || 'Yes'}`,
        14,
        yPos
      );
      yPos += 8;

      try {
        // Embed rubric image
        doc.addImage(rub.fileDataUrl!, 'JPEG', 14, yPos, pageWidth - 28, 230, undefined, 'FAST');
      } catch (err) {
        doc.setTextColor(220, 38, 38);
        doc.text('Image attached in electronic archive.', 14, yPos + 10);
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
   Date: ${p.date}
   Status: ${p.status}
   Moodle Status: ${p.moodleStatus} ${p.moodleSubmissionRef ? `(Ref: ${p.moodleSubmissionRef})` : ''}
   Chairside Steps:
   ${p.steps.map((s) => `  - [${s.isCompleted ? 'X' : ' '}] ${s.title} ${s.completedDate ? `(${s.completedDate})` : ''}`).join('\n')}
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
        procFolder.file(`evidence_${eIdx + 1}_${ev.category}.${ext}`, base64Data, { base64: true });
      }
    });
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${folderName}_Archive.zip`);
}
