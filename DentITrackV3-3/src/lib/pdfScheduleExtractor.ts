import * as pdfjsLib from 'pdfjs-dist';
import { ClinicSession, ClinicPlace, DisciplineType } from '../types';

// Configure local worker safely for Vite/offline browser execution
try {
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
} catch {
  // If worker URL resolution fails, pdf.js falls back to local main-thread execution
}

export const CLINICS: ClinicPlace[] = ['A', 'B', 'C', 'M', 'N', 'G'];
export const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export interface ExtractedStudentMeta {
  studentName?: string;
  studentId?: string;
  university?: string;
  faculty?: string;
  semester?: string;
  classStanding?: string;
}

export interface ExtractedScheduleResult {
  sessions: ClinicSession[]; // Clinical duty sessions (primary focus for dental students)
  allSessions: ClinicSession[]; // All timetable sessions including lectures and labs
  studentMeta: ExtractedStudentMeta;
  fileName: string;
  source: 'offline-pdf-parser';
  message: string;
}

interface PdfItemWithCoord {
  str: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  page: number;
}

/**
 * Parses 12-hour or 24-hour time ranges into standard 24h "HH:MM"
 * e.g. "9:00 AM - 12:00 PM" -> { startTime: "09:00", endTime: "12:00" }
 * e.g. "12:00 PM - 3:00 PM" -> { startTime: "12:00", endTime: "15:00" }
 * e.g. "11:30 AM - 2:30 PM" -> { startTime: "11:30", endTime: "14:30" }
 */
export function parseTimeInterval(text: string): { startTime: string; endTime: string } | null {
  const match = text.match(/(\d{1,2})[:.](\d{2})\s*(AM|PM)?\s*(?:-|to|–)\s*(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i);
  if (!match) {
    // Check simple hour ranges like "9 - 12", "9am - 12pm", "1 - 4 pm"
    const simpleHourMatch = text.match(/\b(\d{1,2})\s*(AM|PM)?\s*(?:-|to|–)\s*(\d{1,2})\s*(AM|PM)?\b/i);
    if (simpleHourMatch) {
      let sH = parseInt(simpleHourMatch[1], 10);
      let sP = (simpleHourMatch[2] || '').toUpperCase();
      let eH = parseInt(simpleHourMatch[3], 10);
      let eP = (simpleHourMatch[4] || '').toUpperCase();

      if (!sP && eP) {
        sP = eP === 'PM' && (sH === 12 || (sH >= 7 && sH <= 11)) ? 'AM' : eP;
      } else if (!sP && !eP) {
        sP = sH < 7 ? 'PM' : 'AM';
        eP = eH < 7 ? 'PM' : 'AM';
      }

      if (sP === 'PM' && sH < 12) sH += 12;
      if (sP === 'AM' && sH === 12) sH = 0;
      if (eP === 'PM' && eH < 12) eH += 12;
      if (eP === 'AM' && eH === 12) eH = 0;

      return {
        startTime: `${sH.toString().padStart(2, '0')}:00`,
        endTime: `${eH.toString().padStart(2, '0')}:00`,
      };
    }
    return null;
  }

  let sH = parseInt(match[1], 10);
  const sM = match[2];
  let sP = (match[3] || '').toUpperCase();

  let eH = parseInt(match[4], 10);
  const eM = match[5];
  let eP = (match[6] || '').toUpperCase();

  // Infer missing periods
  if (!sP && eP) {
    if (eP === 'PM') {
      sP = sH === 12 || (sH >= 7 && sH <= 11) ? 'AM' : 'PM';
    } else {
      sP = 'AM';
    }
  } else if (!sP && !eP) {
    sP = sH < 7 ? 'PM' : 'AM';
    eP = eH < 7 ? 'PM' : 'AM';
  }

  if (sP === 'PM' && sH < 12) sH += 12;
  if (sP === 'AM' && sH === 12) sH = 0;

  if (eP === 'PM' && eH < 12) eH += 12;
  if (eP === 'AM' && eH === 12) eH = 0;

  return {
    startTime: `${sH.toString().padStart(2, '0')}:${sM}`,
    endTime: `${eH.toString().padStart(2, '0')}:${eM}`,
  };
}

/**
 * Detects clinic station: 'A', 'B', 'C', 'M', 'N', 'G'
 */
export function detectClinicPlace(text: string): ClinicPlace {
  const upper = text.toUpperCase();

  // Look for "Clinic N", "Clinic M", "Clinic G", "Clinic A", "Clinic B", "Clinic C"
  const clinicMatch = upper.match(/CLINIC\s*[-–(]?\s*([ABCMNG])\b/i);
  if (clinicMatch) {
    return clinicMatch[1] as ClinicPlace;
  }

  // Look for station/hall designations like "Station M", "Hall N", "Clin. G"
  const stationMatch = upper.match(/(?:STATION|HALL|CLIN|ROOM)\s*([ABCMNG])\b/i);
  if (stationMatch) {
    return stationMatch[1] as ClinicPlace;
  }

  // Standalone uppercase letter surrounded by spaces/parentheses/pipes
  for (const c of CLINICS) {
    if (new RegExp(`(?:^|[\\s|/(\\[])${c}(?:[\\s|/)\\]]|$)`).test(upper)) {
      return c;
    }
  }

  return 'A';
}

/**
 * Maps course names and codes to canonical dental disciplines
 */
export function detectDiscipline(courseName: string, courseCode: string = ''): string {
  const combined = `${courseName} ${courseCode}`.toLowerCase();

  if (combined.includes('comprehensive') || combined.includes('ccc')) {
    return 'Comprehensive Clinic';
  }
  if (combined.includes('oral surg') || combined.includes('surgery') || combined.includes('osa')) {
    return 'Oral Surgery';
  }
  if (combined.includes('ped') || combined.includes('child') || combined.includes('pod501')) {
    return 'Pediatric Dentistry';
  }
  if (
    combined.includes('public health') ||
    combined.includes('preventive') ||
    combined.includes('pod521')
  ) {
    return 'Public Health & Preventive';
  }
  if (combined.includes('ortho') || combined.includes('pod511')) {
    return 'Orthodontics';
  }
  if (combined.includes('fixed') || combined.includes('crown') || combined.includes('bridge') || combined.includes('fpd')) {
    return 'Fixed';
  }
  if (combined.includes('operat') || combined.includes('resto') || combined.includes('conserv')) {
    return 'Operative';
  }
  if (combined.includes('endo') || combined.includes('root canal') || combined.includes('rct')) {
    return 'Endo';
  }
  if (combined.includes('remov') || combined.includes('prostho') || combined.includes('denture') || combined.includes('rpd')) {
    return 'Removable';
  }
  if (combined.includes('perio') || combined.includes('scaling') || combined.includes('prophylaxis')) {
    return 'Perio';
  }

  return 'Comprehensive Clinic';
}

/**
 * Extracts student metadata from header items
 */
export function extractStudentMetadata(items: PdfItemWithCoord[]): ExtractedStudentMeta {
  const meta: ExtractedStudentMeta = {};
  const wholeText = items.map((it) => it.str).join(' ');

  // University detection (e.g. "Misr International University")
  if (/Misr International/i.test(wholeText)) {
    meta.university = 'Misr International University';
  } else {
    const uniMatch = wholeText.match(/([A-Za-z\s]+(?:University|Faculty|College|Institute))/i);
    if (uniMatch) meta.university = uniMatch[1].trim();
  }

  // Student ID (e.g. "2022/00253" or "ID 2022/00253")
  const idMatch =
    wholeText.match(/Student\s*ID\s*[:\s]*([0-9/]+)/i) ||
    wholeText.match(/\b(\d{4}\/\d{4,6})\b/);
  if (idMatch) {
    meta.studentId = idMatch[1].trim();
  }

  // Faculty (e.g. "Faculty Dentistry I")
  const facMatch = wholeText.match(/Faculty\s*[:\s]*([A-Za-z0-9\s]+?)(?:Student|Semester|Status|Class|$)/i);
  if (facMatch) {
    meta.faculty = facMatch[1].trim();
  }

  // Semester (e.g. "FALL 2026")
  const semMatch =
    wholeText.match(/Semester\s*[:\s]*([A-Za-z0-9\s]+?)(?:Status|Class|$)/i) ||
    wholeText.match(/\b(FALL\s*\d{4}|SPRING\s*\d{4}|SUMMER\s*\d{4})\b/i);
  if (semMatch) {
    meta.semester = semMatch[1].trim();
  }

  // Student Name: find item following "Student Name"
  for (let i = 0; i < items.length; i++) {
    if (/Student\s*Name/i.test(items[i].str)) {
      // Collect subsequent text until next section header
      const nameParts: string[] = [];
      for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
        const str = items[j].str.trim();
        if (/^(Semester|Status|Class|Course|ID|Faculty)/i.test(str)) break;
        if (str && str.length > 2) {
          nameParts.push(str);
        }
      }
      if (nameParts.length > 0) {
        meta.studentName = nameParts.join(' ');
      }
      break;
    }
  }

  return meta;
}

/**
 * 2D Spatial Tabular Extractor
 * Identifies Day Columns (Saturday, Sunday, Monday, etc.) and Course Rows (CCC501, OSA501, etc.)
 * Extracts session blocks in each cell with exact time, clinic place (A, C, B, M, N, G), and discipline.
 */
function extract2DTabularSchedule(items: PdfItemWithCoord[]): {
  clinicalSessions: ClinicSession[];
  allSessions: ClinicSession[];
} {
  const allSessions: ClinicSession[] = [];
  const clinSessions: ClinicSession[] = [];

  // Group items by page
  const pages = Array.from(new Set(items.map((it) => it.page)));

  let sessionCounter = 0;

  for (const pageNum of pages) {
    const pageItems = items.filter((it) => it.page === pageNum);

    // 1. Find day column headers on this page
    const dayHeaders: { day: (typeof DAYS)[number]; x: number; y: number }[] = [];
    for (const it of pageItems) {
      const trimmed = it.str.trim();
      for (const d of DAYS) {
        if (trimmed.toLowerCase() === d.toLowerCase()) {
          dayHeaders.push({ day: d, x: it.x, y: it.y });
          break;
        }
      }
    }

    if (dayHeaders.length === 0) {
      continue;
    }

    dayHeaders.sort((a, b) => a.x - b.x);

    // Compute column bounding boxes [minX, maxX]
    const colBounds: { day: (typeof DAYS)[number]; minX: number; maxX: number }[] = [];
    const avgColWidth =
      dayHeaders.length > 1
        ? (dayHeaders[dayHeaders.length - 1].x - dayHeaders[0].x) / (dayHeaders.length - 1)
        : 90;

    for (let i = 0; i < dayHeaders.length; i++) {
      const cur = dayHeaders[i];
      const prev = dayHeaders[i - 1];
      const next = dayHeaders[i + 1];
      const minX = prev ? (prev.x + cur.x) / 2 : cur.x - avgColWidth * 0.45;
      const maxX = next ? (cur.x + next.x) / 2 : cur.x + avgColWidth * 0.55;
      colBounds.push({ day: cur.day, minX, maxX });
    }

    const firstColX = dayHeaders[0].x;

    // 2. Find Course Rows on the left side of day columns
    const leftItems = pageItems.filter((it) => it.x < firstColX);
    const courseCodeRegex = /\b([A-Z]{2,4}\s*\d{3})\b/;
    const detectedCourseRows: { code: string; y: number }[] = [];

    for (const it of leftItems) {
      const match = it.str.match(courseCodeRegex);
      if (match) {
        const code = match[1].replace(/\s+/g, '');
        // Avoid duplicate codes close to each other on Y
        if (!detectedCourseRows.some((r) => Math.abs(r.y - it.y) < 15)) {
          detectedCourseRows.push({ code, y: it.y });
        }
      }
    }

    detectedCourseRows.sort((a, b) => b.y - a.y); // top-to-bottom

    if (detectedCourseRows.length === 0) {
      continue;
    }

    // Build row boundaries [bottomY, topY] and associate course name
    const rowBounds: {
      code: string;
      courseName: string;
      topY: number;
      bottomY: number;
    }[] = [];

    for (let i = 0; i < detectedCourseRows.length; i++) {
      const cur = detectedCourseRows[i];
      const next = detectedCourseRows[i + 1];
      const topY = cur.y + 25;
      const bottomY = next ? (cur.y + next.y) / 2 : cur.y - 120;

      // Collect all text items in the Course Name column within this row
      const rowNameItems = leftItems.filter(
        (it) =>
          it.y <= topY &&
          it.y > bottomY &&
          !courseCodeRegex.test(it.str) &&
          !/^\d+$/.test(it.str.trim()) &&
          !/^(Course|Crd|Credit)/i.test(it.str)
      );

      rowNameItems.sort((a, b) => b.y - a.y || a.x - b.x);
      const courseName = rowNameItems.map((it) => it.str.trim()).join(' ') || cur.code;

      rowBounds.push({
        code: cur.code,
        courseName,
        topY,
        bottomY,
      });
    }

    // 3. Process each Cell (Row, Column)
    for (const row of rowBounds) {
      for (const col of colBounds) {
        const cellItems = pageItems.filter(
          (it) =>
            it.x >= col.minX &&
            it.x < col.maxX &&
            it.y <= row.topY &&
            it.y > row.bottomY
        );

        if (cellItems.length === 0) continue;

        // Order cell items top-to-bottom, left-to-right
        cellItems.sort((a, b) => b.y - a.y || a.x - b.x);

        // Find all time patterns inside this cell
        const timeIndices: number[] = [];
        cellItems.forEach((it, idx) => {
          if (parseTimeInterval(it.str)) {
            timeIndices.push(idx);
          }
        });

        // Cluster items around each time interval in the cell
        for (let t = 0; t < timeIndices.length; t++) {
          const tIdx = timeIndices[t];
          const prevT = timeIndices[t - 1];
          const nextT = timeIndices[t + 1];

          const startIdx = prevT !== undefined ? Math.floor((prevT + tIdx) / 2) + 1 : 0;
          const endIdx =
            nextT !== undefined ? Math.floor((tIdx + nextT) / 2) + 1 : cellItems.length;

          const cluster = cellItems.slice(startIdx, endIdx);
          const clusterText = cluster.map((c) => c.str).join(' ');
          const times = parseTimeInterval(cellItems[tIdx].str);

          if (!times) continue;

          // Determine session classification
          const lowerText = clusterText.toLowerCase();
          const isClinic =
            lowerText.includes('clinic') &&
            !cluster[0]?.str.toLowerCase().includes('lecture') &&
            !cluster[0]?.str.toLowerCase().includes('lab');
          const isLecture = lowerText.includes('lecture');
          const isLab = lowerText.includes('lab');

          const clinicPlace = detectClinicPlace(clusterText);
          const discipline = detectDiscipline(row.courseName, row.code);

          // Room or location note
          let roomInfo = '';
          const roomMatch = clusterText.match(/\b(S\d+|NB\d+|Clinic\s*[ABCMNG]|Hall\s*\w+)\b/i);
          if (roomMatch) {
            roomInfo = roomMatch[1];
          }

          sessionCounter++;
          const sessionItem: ClinicSession = {
            id: `sess-pdf-${Date.now()}-${sessionCounter}`,
            dayOfWeek: col.day,
            startTime: times.startTime,
            endTime: times.endTime,
            clinicPlace: isClinic ? clinicPlace : 'A',
            discipline,
            chairCount: 2,
            notes: `${row.code} ${isClinic ? `Clinic (${clinicPlace})` : isLecture ? 'Lecture' : isLab ? 'Lab' : 'Session'}${
              roomInfo && !roomInfo.includes(clinicPlace) ? ` • ${roomInfo}` : ''
            } — ${row.courseName}`,
          };

          allSessions.push(sessionItem);

          if (isClinic) {
            clinSessions.push(sessionItem);
          }
        }
      }
    }
  }

  return { clinicalSessions: clinSessions, allSessions };
}

/**
 * Fallback Text-Stream Parser
 * Used if coordinate bounding fails or for single-column/flat text PDFs
 */
function extractFallbackFromTextLines(lines: string[]): ClinicSession[] {
  const sessions: ClinicSession[] = [];
  let currentDay: (typeof DAYS)[number] = 'Saturday';
  let counter = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;

    for (const d of DAYS) {
      if (new RegExp(`\\b${d}\\b`, 'i').test(trimmed)) {
        currentDay = d;
        break;
      }
    }

    const times = parseTimeInterval(trimmed);
    if (times) {
      const lower = trimmed.toLowerCase();
      const isClinic = lower.includes('clinic') || lower.includes('clin');
      const clinicPlace = detectClinicPlace(trimmed);
      const discipline = detectDiscipline(trimmed);

      counter++;
      sessions.push({
        id: `sess-fallback-${Date.now()}-${counter}`,
        dayOfWeek: currentDay,
        startTime: times.startTime,
        endTime: times.endTime,
        clinicPlace,
        discipline,
        chairCount: 2,
        notes: trimmed.slice(0, 80),
      });
    }
  }

  return sessions;
}

/**
 * Extracts structured items with coordinates from PDF using pdfjs-dist in the browser (100% offline).
 */
async function extractItemsWithPdfJs(arrayBuffer: ArrayBuffer): Promise<PdfItemWithCoord[]> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const doc = await loadingTask.promise;
  const items: PdfItemWithCoord[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items as any[]) {
      if ('str' in item && item.str && item.str.trim()) {
        items.push({
          str: item.str,
          x: item.transform[4],
          y: Math.round(item.transform[5]),
          width: item.width,
          height: item.height,
          page: pageNum,
        });
      }
    }
  }

  return items;
}

/**
 * 100% Offline Doctor Schedule Extractor
 * Reads the PDF directly in browser memory without any network or online API requests.
 */
export async function extractScheduleFromDoctorPdf(file: File): Promise<ExtractedScheduleResult> {
  const fileName = file.name;
  const arrayBuffer = await file.arrayBuffer();

  let pdfItems: PdfItemWithCoord[] = [];

  try {
    pdfItems = await extractItemsWithPdfJs(arrayBuffer);
  } catch (err) {
    console.warn('pdfjs-dist extraction warning:', err);
  }

  // 1. Extract Student Metadata (Name, ID, University, Faculty, Semester)
  const studentMeta = extractStudentMetadata(pdfItems);

  // 2. Primary 2D Tabular Grid Extractor
  const { clinicalSessions, allSessions } = extract2DTabularSchedule(pdfItems);

  if (clinicalSessions.length > 0) {
    return {
      sessions: clinicalSessions,
      allSessions: allSessions.length > 0 ? allSessions : clinicalSessions,
      studentMeta,
      fileName,
      source: 'offline-pdf-parser',
      message: `Extracted ${clinicalSessions.length} clinical duty sessions from ${fileName}`,
    };
  }

  // 3. Fallback: line-based extraction if 2D grid didn't find day columns
  const lines = pdfItems.map((it) => it.str);
  const fallbackSessions = extractFallbackFromTextLines(lines);

  if (fallbackSessions.length > 0) {
    return {
      sessions: fallbackSessions,
      allSessions: fallbackSessions,
      studentMeta,
      fileName,
      source: 'offline-pdf-parser',
      message: `Extracted ${fallbackSessions.length} sessions offline from ${fileName}`,
    };
  }

  throw new Error(
    `No clinical timetable sessions could be parsed from "${fileName}". Please ensure the PDF is a Student Schedule with clinical sessions and clinic stations.`
  );
}
