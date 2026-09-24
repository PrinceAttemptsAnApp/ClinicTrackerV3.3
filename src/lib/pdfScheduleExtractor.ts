import { ClinicSession, ClinicPlace, DisciplineType } from '../types';

if (typeof Promise.try !== 'function') {
  (Promise as any).try = function (fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

export const CLINICS: ClinicPlace[] = ['A', 'B', 'C', 'M', 'N', 'G'];
export const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

export type DayOfWeek = (typeof DAYS)[number];

export interface ExtractedStudentMeta {
  studentName?: string;
  studentId?: string;
  university?: string;
  faculty?: string;
  semester?: string;
  classStanding?: string;
}

export interface ExtractedScheduleResult {
  sessions: ClinicSession[]; // Clinical duty sessions
  allSessions: ClinicSession[]; // All timetable sessions including lectures and labs
  studentMeta: ExtractedStudentMeta;
  fileName: string;
  source: 'offline-pdf-parser' | 'text-parser';
  message: string;
  warnings?: string[];
}

export interface PdfItemWithCoord {
  str: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  page: number;
}

// Map Arabic day names to standard English DayOfWeek
const ARABIC_DAY_MAP: Record<string, DayOfWeek> = {
  السبت: 'Saturday',
  الأحد: 'Sunday',
  الاحد: 'Sunday',
  الاثنين: 'Monday',
  الإثنين: 'Monday',
  الاتنين: 'Monday',
  الثلاثاء: 'Tuesday',
  التلاتاء: 'Tuesday',
  التلات: 'Tuesday',
  الأربعاء: 'Wednesday',
  الاربعاء: 'Wednesday',
  الاربع: 'Wednesday',
  الخميس: 'Thursday',
  الجمعة: 'Friday',
};

// Map short English day abbreviations
const SHORT_DAY_MAP: Record<string, DayOfWeek> = {
  sat: 'Saturday',
  saturday: 'Saturday',
  sun: 'Sunday',
  sunday: 'Sunday',
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
};

/**
 * Converts Eastern Arabic Numerals (٠-٩) to Western Arabic Numerals (0-9)
 */
export function convertArabicNumerals(str: string): string {
  if (!str) return '';
  return str.replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
}

/**
 * Detects Day of Week from English or Arabic text strings
 */
export function detectDayOfWeek(text: string): DayOfWeek | null {
  if (!text) return null;
  const clean = text.trim();

  // Arabic Day Match
  for (const [arDay, enDay] of Object.entries(ARABIC_DAY_MAP)) {
    if (clean.includes(arDay)) return enDay;
  }

  // English Day Match
  const lower = clean.toLowerCase();
  for (const [shortDay, enDay] of Object.entries(SHORT_DAY_MAP)) {
    if (new RegExp(`\\b${shortDay}\\b`, 'i').test(lower)) return enDay;
  }

  return null;
}

/**
 * Parses 12-hour or 24-hour time ranges into standard 24h "HH:MM"
 * Deterministic parsing supporting English & Arabic time indicators.
 */
export function parseTimeInterval(text: string): { startTime: string; endTime: string } | null {
  if (!text) return null;

  // Normalize numbers and dashes
  let normalized = convertArabicNumerals(text)
    .replace(/[–—]/g, '-')
    .replace(/إلى|الى|to/gi, '-')
    .replace(/صباحا|صباحاً|ص/gi, 'AM')
    .replace(/مساء|مساءً|م/gi, 'PM')
    .trim();

  // Pattern A: HH:MM [AM/PM] - HH:MM [AM/PM]
  const matchWithMinutes = normalized.match(
    /(\d{1,2})[:.](\d{2})\s*(AM|PM)?\s*(?:-|until)\s*(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i
  );

  if (matchWithMinutes) {
    let sH = parseInt(matchWithMinutes[1], 10);
    const sM = matchWithMinutes[2];
    let sP = (matchWithMinutes[3] || '').toUpperCase();

    let eH = parseInt(matchWithMinutes[4], 10);
    const eM = matchWithMinutes[5];
    let eP = (matchWithMinutes[6] || '').toUpperCase();

    // Infer missing AM/PM logic deterministically
    if (!sP && eP) {
      if (eP === 'PM') {
        sP = sH === 12 || (sH >= 7 && sH <= 11) ? 'AM' : 'PM';
      } else {
        sP = 'AM';
      }
    } else if (!sP && !eP) {
      sP = sH < 7 || sH === 12 ? 'PM' : 'AM';
      eP = eH < 7 || eH === 12 ? 'PM' : 'AM';
      if (sH >= 8 && sH <= 11 && eH >= 1 && eH <= 6) {
        sP = 'AM';
        eP = 'PM';
      }
    }

    if (sP === 'PM' && sH < 12) sH += 12;
    if (sP === 'AM' && sH === 12) sH = 0;
    if (eP === 'PM' && eH < 12) eH += 12;
    if (eP === 'AM' && eH === 12) eH = 0;

    const startTime = `${sH.toString().padStart(2, '0')}:${sM}`;
    const endTime = `${eH.toString().padStart(2, '0')}:${eM}`;

    if (sH < 24 && eH < 24 && parseInt(sM, 10) < 60 && parseInt(eM, 10) < 60) {
      return { startTime, endTime };
    }
  }

  // Pattern B: Simple Hour Ranges like "8 - 10", "9am - 12pm", "1 - 4 pm"
  const matchSimpleHours = normalized.match(
    /\b(\d{1,2})\s*(AM|PM)?\s*(?:-)\s*(\d{1,2})\s*(AM|PM)?\b/i
  );

  if (matchSimpleHours) {
    let sH = parseInt(matchSimpleHours[1], 10);
    let sP = (matchSimpleHours[2] || '').toUpperCase();
    let eH = parseInt(matchSimpleHours[3], 10);
    let eP = (matchSimpleHours[4] || '').toUpperCase();

    if (sH >= 1 && sH <= 24 && eH >= 1 && eH <= 24) {
      if (!sP && eP) {
        sP = eP === 'PM' && (sH === 12 || (sH >= 7 && sH <= 11)) ? 'AM' : eP;
      } else if (!sP && !eP) {
        sP = sH < 7 || sH === 12 ? 'PM' : 'AM';
        eP = eH < 7 || eH === 12 ? 'PM' : 'AM';
        if (sH >= 8 && sH <= 11 && eH >= 1 && eH <= 6) {
          sP = 'AM';
          eP = 'PM';
        }
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
  }

  return null;
}

/**
 * Detects clinic station: 'A', 'B', 'C', 'M', 'N', 'G'
 */
export function detectClinicPlace(text: string): { place: ClinicPlace; isUncertain: boolean } {
  if (!text) return { place: 'A', isUncertain: true };

  // Strip day names to avoid false positive 'أ' in 'الأحد' / 'الأربعاء'
  let cleanText = text;
  for (const arDay of Object.keys(ARABIC_DAY_MAP)) {
    cleanText = cleanText.replace(new RegExp(arDay, 'g'), '');
  }
  for (const enDay of DAYS) {
    cleanText = cleanText.replace(new RegExp(enDay, 'gi'), '');
  }

  const upper = convertArabicNumerals(cleanText).toUpperCase();

  // English Clinic designations: "Clinic A", "Clinic M", "Station N", "Hall G"
  const clinicMatch = upper.match(/(?:CLINIC|STATION|HALL|CLIN|ROOM)\s*[-–(]?\s*([ABCMNG])\b/i);
  if (clinicMatch) {
    return { place: clinicMatch[1] as ClinicPlace, isUncertain: false };
  }

  // Standalone Arabic clinic single-letters (أ, ب, ج, م, ن, غ)
  if (/(?:^|\s)أ(?:\s|$)/.test(cleanText)) return { place: 'A', isUncertain: false };
  if (/(?:^|\s)ب(?:\s|$)/.test(cleanText)) return { place: 'B', isUncertain: false };
  if (/(?:^|\s)ج(?:\s|$)/.test(cleanText)) return { place: 'C', isUncertain: false };
  if (/(?:^|\s)م(?:\s|$)/.test(cleanText)) return { place: 'M', isUncertain: false };
  if (/(?:^|\s)ن(?:\s|$)/.test(cleanText)) return { place: 'N', isUncertain: false };
  if (/(?:^|\s)غ(?:\s|$)/.test(cleanText)) return { place: 'G', isUncertain: false };

  // Standalone uppercase English letter
  for (const c of CLINICS) {
    if (new RegExp(`(?:^|[\\s|/(\\[])${c}(?:[\\s|/)\\]]|$)`).test(upper)) {
      return { place: c, isUncertain: false };
    }
  }

  // Default to Clinic A with uncertain flag
  return { place: 'A', isUncertain: true };
}

/**
 * Maps course names, codes, and Arabic subjects to canonical dental disciplines
 */
export function detectDiscipline(courseName: string, courseCode: string = ''): string {
  const combined = `${courseName} ${courseCode}`.toLowerCase();

  if (combined.includes('comprehensive') || combined.includes('ccc') || combined.includes('شاملة')) {
    return 'Comprehensive Clinic';
  }
  if (
    combined.includes('oral surg') ||
    combined.includes('surgery') ||
    combined.includes('osa') ||
    combined.includes('os') ||
    combined.includes('جراحة')
  ) {
    return 'Oral Surgery';
  }
  if (
    combined.includes('ped') ||
    combined.includes('child') ||
    combined.includes('pod501') ||
    combined.includes('pedo') ||
    combined.includes('أطفال') ||
    combined.includes('اطفال')
  ) {
    return 'Pediatric Dentistry';
  }
  if (
    combined.includes('public health') ||
    combined.includes('preventive') ||
    combined.includes('pod521') ||
    combined.includes('وقائي')
  ) {
    return 'Public Health & Preventive';
  }
  if (combined.includes('ortho') || combined.includes('pod511') || combined.includes('تقويم')) {
    return 'Orthodontics';
  }
  if (
    combined.includes('fixed') ||
    combined.includes('crown') ||
    combined.includes('bridge') ||
    combined.includes('fpd') ||
    combined.includes('ثابتة') ||
    combined.includes('فيكسد')
  ) {
    return 'Fixed';
  }
  if (
    combined.includes('operat') ||
    combined.includes('resto') ||
    combined.includes('conserv') ||
    combined.includes('حشو') ||
    combined.includes('تحفظي')
  ) {
    return 'Operative';
  }
  if (
    combined.includes('endo') ||
    combined.includes('root canal') ||
    combined.includes('rct') ||
    combined.includes('جذور') ||
    combined.includes('اندو')
  ) {
    return 'Endo';
  }
  if (
    combined.includes('remov') ||
    combined.includes('prostho') ||
    combined.includes('denture') ||
    combined.includes('rpd') ||
    combined.includes('متحركة') ||
    combined.includes('رموفابل')
  ) {
    return 'Removable';
  }
  if (
    combined.includes('perio') ||
    combined.includes('scaling') ||
    combined.includes('prophylaxis') ||
    combined.includes('لثة') ||
    combined.includes('بيريو')
  ) {
    return 'Perio';
  }

  return 'Comprehensive Clinic';
}

/**
 * Extracts student metadata (Name, ID, University, Faculty, Semester) from text items
 */
export function extractStudentMetadata(items: PdfItemWithCoord[]): ExtractedStudentMeta {
  const meta: ExtractedStudentMeta = {};
  const wholeText = items.map((it) => it.str).join(' ');

  if (/Misr International/i.test(wholeText) || /MIU/i.test(wholeText)) {
    meta.university = 'Misr International University';
  } else {
    const uniMatch = wholeText.match(/([A-Za-z\s]+(?:University|Faculty|College|Institute|جامعة|كلية))/i);
    if (uniMatch) meta.university = uniMatch[1].trim();
  }

  // Student ID (e.g. "2022/00253" or "ID: 2022/00253")
  const idMatch =
    wholeText.match(/Student\s*ID\s*[:\s]*([0-9/]+)/i) ||
    wholeText.match(/كود\s*الطالب\s*[:\s]*([0-9/]+)/i) ||
    wholeText.match(/\b(\d{4}\/\d{4,6})\b/);
  if (idMatch) {
    meta.studentId = idMatch[1].trim();
  }

  // Faculty
  const facMatch =
    wholeText.match(/Faculty\s*[:\s]*([A-Za-z0-9\s]+?)(?:Student|Semester|Status|Class|$)/i) ||
    wholeText.match(/كلية\s*[:\s]*([\u0600-\u06FF\s]+)/i);
  if (facMatch) {
    meta.faculty = facMatch[1].trim();
  }

  // Semester
  const semMatch =
    wholeText.match(/Semester\s*[:\s]*([A-Za-z0-9\s]+?)(?:Status|Class|$)/i) ||
    wholeText.match(/\b(FALL\s*\d{4}|SPRING\s*\d{4}|SUMMER\s*\d{4})\b/i);
  if (semMatch) {
    meta.semester = semMatch[1].trim();
  }

  // Student Name
  for (let i = 0; i < items.length; i++) {
    if (/Student\s*Name|اسم\s*الطالب/i.test(items[i].str)) {
      const nameParts: string[] = [];
      for (let j = i + 1; j < Math.min(items.length, i + 5); j++) {
        const str = items[j].str.trim();
        if (/^(Semester|Status|Class|Course|ID|Faculty|كلية|الفرقة)/i.test(str)) break;
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
 * Reconstructed horizontal line with item group and spatial coordinates
 */
export interface ReconstructedLine {
  text: string;
  items: PdfItemWithCoord[];
  y: number;
  minX: number;
  maxX: number;
  page: number;
}

/**
 * Reconstructs coherent horizontal text lines from raw PDF text items with coordinates
 */
export function groupPdfItemsIntoLines(items: PdfItemWithCoord[]): ReconstructedLine[] {
  const result: ReconstructedLine[] = [];
  const pages = Array.from(new Set(items.map((it) => it.page)));

  for (const pageNum of pages) {
    const pageItems = items.filter((it) => it.page === pageNum);
    // Sort top-to-bottom
    const sorted = [...pageItems].sort((a, b) => b.y - a.y || a.x - b.x);

    const bands: { y: number; items: PdfItemWithCoord[] }[] = [];

    for (const item of sorted) {
      let band = bands.find((b) => Math.abs(b.y - item.y) <= 6);
      if (!band) {
        band = { y: item.y, items: [] };
        bands.push(band);
      }
      band.items.push(item);
    }

    for (const band of bands) {
      band.items.sort((a, b) => a.x - b.x);

      const textParts: string[] = [];
      for (let i = 0; i < band.items.length; i++) {
        const cur = band.items[i];
        const prev = band.items[i - 1];
        if (prev && cur.x - (prev.x + (prev.width || 15)) > 15) {
          textParts.push('   ');
        } else if (prev && cur.x - (prev.x + (prev.width || 8)) > 2) {
          textParts.push(' ');
        }
        textParts.push(cur.str);
      }

      const fullText = textParts.join('').trim();
      if (fullText) {
        const minX = Math.min(...band.items.map((it) => it.x));
        const maxX = Math.max(...band.items.map((it) => it.x + (it.width || 20)));
        result.push({
          text: fullText,
          items: band.items,
          y: band.y,
          minX,
          maxX,
          page: pageNum,
        });
      }
    }
  }

  result.sort((a, b) => a.page - b.page || b.y - a.y);
  return result;
}

/**
 * STRATEGY 1: 2D Spatial Tabular Matrix Extractor (Universal Grid Parser)
 * Handles Day Column Headers with Time/Course Row Headers
 */
function extract2DTabularSchedule(items: PdfItemWithCoord[]): {
  clinicalSessions: ClinicSession[];
  allSessions: ClinicSession[];
} {
  const allSessions: ClinicSession[] = [];
  const clinSessions: ClinicSession[] = [];
  const pages = Array.from(new Set(items.map((it) => it.page)));

  let sessionCounter = 0;

  for (const pageNum of pages) {
    const pageItems = items.filter((it) => it.page === pageNum);

    // 1. Locate day column headers
    const dayHeaders: { day: DayOfWeek; x: number; y: number }[] = [];
    for (const it of pageItems) {
      const detected = detectDayOfWeek(it.str);
      if (detected) {
        if (!dayHeaders.some((d) => d.day === detected && Math.abs(d.x - it.x) < 25)) {
          dayHeaders.push({ day: detected, x: it.x, y: it.y });
        }
      }
    }

    if (dayHeaders.length === 0) continue;

    dayHeaders.sort((a, b) => a.x - b.x);

    const avgColWidth =
      dayHeaders.length > 1
        ? (dayHeaders[dayHeaders.length - 1].x - dayHeaders[0].x) / (dayHeaders.length - 1)
        : 100;

    const colBounds: { day: DayOfWeek; minX: number; maxX: number }[] = [];
    for (let i = 0; i < dayHeaders.length; i++) {
      const cur = dayHeaders[i];
      const prev = dayHeaders[i - 1];
      const next = dayHeaders[i + 1];
      const minX = prev ? (prev.x + cur.x) / 2 : cur.x - avgColWidth * 0.45;
      const maxX = next ? (cur.x + next.x) / 2 : cur.x + avgColWidth * 0.55;
      colBounds.push({ day: cur.day, minX, maxX });
    }

    const firstColX = dayHeaders[0].x;

    // 2. Locate Row Headers to the left or within rows
    const leftItems = pageItems.filter((it) => it.x < firstColX + 20);
    const courseCodeRegex = /\b([A-Za-z]{2,4}\s*\d{2,4})\b/;

    const detectedRows: { label: string; y: number; timeRange?: { startTime: string; endTime: string } }[] = [];

    for (const it of leftItems) {
      const courseMatch = it.str.match(courseCodeRegex);
      const timeMatch = parseTimeInterval(it.str);

      if (courseMatch) {
        const code = courseMatch[1].replace(/\s+/g, '');
        if (!detectedRows.some((r) => Math.abs(r.y - it.y) < 15)) {
          detectedRows.push({ label: code, y: it.y });
        }
      } else if (timeMatch) {
        if (!detectedRows.some((r) => Math.abs(r.y - it.y) < 15)) {
          detectedRows.push({ label: `${timeMatch.startTime}-${timeMatch.endTime}`, y: it.y, timeRange: timeMatch });
        }
      }
    }

    if (detectedRows.length === 0) {
      const yCoords = Array.from(new Set(pageItems.map((it) => Math.round(it.y / 20) * 20))).sort((a, b) => b - a);
      for (const y of yCoords) {
        detectedRows.push({ label: `Row_${y}`, y });
      }
    }

    detectedRows.sort((a, b) => b.y - a.y);

    if (detectedRows.length === 0) continue;

    const rowBounds: { label: string; courseName: string; topY: number; bottomY: number; timeRange?: { startTime: string; endTime: string } }[] = [];
    for (let i = 0; i < detectedRows.length; i++) {
      const cur = detectedRows[i];
      const next = detectedRows[i + 1];
      const topY = cur.y + 20;
      const bottomY = next ? (cur.y + next.y) / 2 : cur.y - 80;

      const rowNameItems = leftItems.filter(
        (it) => it.y <= topY && it.y > bottomY && !/^(Course|Crd|Credit|Time)/i.test(it.str)
      );

      rowNameItems.sort((a, b) => b.y - a.y || a.x - b.x);
      const courseName = rowNameItems.map((it) => it.str.trim()).join(' ') || cur.label;

      rowBounds.push({ label: cur.label, courseName, topY, bottomY, timeRange: cur.timeRange });
    }

    // 3. Process matrix cells
    for (const row of rowBounds) {
      for (const col of colBounds) {
        const cellItems = pageItems.filter(
          (it) => it.x >= col.minX && it.x < col.maxX && it.y <= row.topY && it.y > row.bottomY
        );

        if (cellItems.length === 0) continue;

        cellItems.sort((a, b) => b.y - a.y || a.x - b.x);
        const cellText = cellItems.map((c) => c.str).join(' ');

        const times = parseTimeInterval(cellText) || row.timeRange;
        if (!times) continue;

        const lowerText = cellText.toLowerCase();
        const isClinic =
          (lowerText.includes('clinic') ||
            lowerText.includes('clin') ||
            lowerText.includes('عيادة') ||
            lowerText.includes('ccc') ||
            lowerText.includes('osa') ||
            lowerText.includes('جراحة') ||
            lowerText.includes('حشو')) &&
          !lowerText.includes('lecture') &&
          !lowerText.includes('lab') &&
          !lowerText.includes('محاضرة');

        const isLecture = lowerText.includes('lecture') || lowerText.includes('محاضرة');
        const isLab = lowerText.includes('lab') || lowerText.includes('معمل');

        const { place: clinicPlace } = detectClinicPlace(cellText);
        const discipline = detectDiscipline(cellText, row.courseName);

        sessionCounter++;
        const sessionItem: ClinicSession = {
          id: `sess-2d-${Date.now()}-${sessionCounter}`,
          dayOfWeek: col.day,
          startTime: times.startTime,
          endTime: times.endTime,
          clinicPlace: isClinic ? clinicPlace : 'A',
          discipline,
          chairCount: 2,
          notes: `${row.label} ${isClinic ? `Clinic (${clinicPlace})` : isLecture ? 'Lecture' : isLab ? 'Lab' : 'Session'} — ${cellText.slice(0, 80)}`,
        };

        allSessions.push(sessionItem);
        if (isClinic || (!isLecture && !isLab)) {
          clinSessions.push(sessionItem);
        }
      }
    }
  }

  return { clinicalSessions: clinSessions, allSessions };
}

/**
 * STRATEGY 2: Agenda Section Header Extractor (Day-by-Day Block Extractor)
 */
function extractAgendaSchedule(lines: string[]): { clinicalSessions: ClinicSession[]; allSessions: ClinicSession[] } {
  const allSessions: ClinicSession[] = [];
  const clinSessions: ClinicSession[] = [];

  let currentDay: DayOfWeek | null = null;
  let sessionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const lineDay = detectDayOfWeek(line);
    if (lineDay) {
      currentDay = lineDay;
    }

    const times = parseTimeInterval(line);
    if (times) {
      const activeDay = lineDay || currentDay;
      if (!activeDay) continue;

      // Gather context of lines around this time entry
      const windowLines = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2));
      const contextText = windowLines.join(' ');
      const lower = contextText.toLowerCase();

      const isClinic =
        lower.includes('clinic') ||
        lower.includes('clin') ||
        lower.includes('عيادة') ||
        lower.includes('ccc') ||
        lower.includes('osa');
      const isLecture = lower.includes('lecture') || lower.includes('محاضرة');
      const isLab = lower.includes('lab') || lower.includes('معمل');

      const { place: lineClinicPlace, isUncertain: clinicUncertain } = detectClinicPlace(line);
      const clinicPlace = clinicUncertain ? detectClinicPlace(contextText).place : lineClinicPlace;

      const lineDiscipline = detectDiscipline(line);
      const discipline = lineDiscipline !== 'Comprehensive Clinic' ? lineDiscipline : detectDiscipline(contextText);

      sessionCounter++;
      const session: ClinicSession = {
        id: `sess-agenda-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${sessionCounter}`,
        dayOfWeek: activeDay,
        startTime: times.startTime,
        endTime: times.endTime,
        clinicPlace,
        discipline,
        chairCount: 2,
        notes: line.replace(/\s+/g, ' ').slice(0, 100).trim(),
      };

      allSessions.push(session);
      if (isClinic || (!isLecture && !isLab)) {
        clinSessions.push(session);
      }
    }
  }

  return { clinicalSessions: clinSessions, allSessions };
}

/**
 * STRATEGY 3: Spatial Proximity & Token Cluster Extractor (Fallback)
 * Scans reconstructed horizontal lines for any Day + Time + Course combinations
 */
function extractProximitySchedule(reconstructedLines: ReconstructedLine[]): {
  clinicalSessions: ClinicSession[];
  allSessions: ClinicSession[];
} {
  const allSessions: ClinicSession[] = [];
  const clinSessions: ClinicSession[] = [];
  let currentDay: DayOfWeek | null = null;
  let sessionCounter = 0;

  for (let i = 0; i < reconstructedLines.length; i++) {
    const line = reconstructedLines[i];
    const text = line.text;

    const detectedDay = detectDayOfWeek(text);
    if (detectedDay) {
      currentDay = detectedDay;
    }

    const times = parseTimeInterval(text);
    if (times) {
      const activeDay = detectedDay || currentDay;
      if (!activeDay) continue;

      const prevLine = reconstructedLines[i - 1]?.text || '';
      const nextLine = reconstructedLines[i + 1]?.text || '';
      const contextText = `${prevLine} ${text} ${nextLine}`;

      const lower = contextText.toLowerCase();
      const isLecture = lower.includes('lecture') || lower.includes('محاضرة');
      const isLab = lower.includes('lab') || lower.includes('معمل');
      const isClinic =
        lower.includes('clinic') ||
        lower.includes('clin') ||
        lower.includes('عيادة') ||
        lower.includes('ccc') ||
        lower.includes('osa') ||
        lower.includes('جراحة') ||
        lower.includes('حشو') ||
        (!isLecture && !isLab);

      const { place: clinicPlace } = detectClinicPlace(contextText);
      const discipline = detectDiscipline(contextText);

      sessionCounter++;
      const session: ClinicSession = {
        id: `sess-prox-${Date.now()}-${sessionCounter}`,
        dayOfWeek: activeDay,
        startTime: times.startTime,
        endTime: times.endTime,
        clinicPlace: isClinic ? clinicPlace : 'A',
        discipline,
        chairCount: 2,
        notes: text.slice(0, 100).trim(),
      };

      allSessions.push(session);
      if (isClinic) {
        clinSessions.push(session);
      }
    }
  }

  return { clinicalSessions: clinSessions, allSessions };
}

/**
 * Native Pure-JS Stream Extractor for fallback PDF parsing
 */
async function extractPdfItemsNatively(arrayBuffer: ArrayBuffer): Promise<PdfItemWithCoord[]> {
  const bytes = new Uint8Array(arrayBuffer);
  const items: PdfItemWithCoord[] = [];

  const rawString = new TextDecoder('latin1').decode(bytes);
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  let pageNum = 1;

  while ((match = streamRegex.exec(rawString)) !== null) {
    const streamStart = match.index + match[0].indexOf('\n') + 1;
    const streamEnd = match.index + match[0].lastIndexOf('endstream') - 1;
    if (streamEnd <= streamStart) continue;

    const streamSlice = bytes.subarray(streamStart, streamEnd);
    const precedingHeader = rawString.substring(Math.max(0, match.index - 300), match.index);
    const isFlate = /FlateDecode/i.test(precedingHeader);

    let textContent = '';

    if (isFlate && typeof DecompressionStream !== 'undefined') {
      for (const fmt of ['deflate', 'deflate-raw'] as const) {
        try {
          let input = streamSlice;
          if (fmt === 'deflate-raw' && streamSlice.length > 6 && streamSlice[0] === 0x78) {
            input = streamSlice.subarray(2, streamSlice.length - 4);
          }
          const ds = new DecompressionStream(fmt as any);
          const resp = new Response(input).body?.pipeThrough(ds);
          if (resp) {
            const buf = await new Response(resp).arrayBuffer();
            if (buf.byteLength > 0) {
              textContent = new TextDecoder('latin1').decode(new Uint8Array(buf));
              break;
            }
          }
        } catch {
          // ignore
        }
      }
    } else {
      textContent = new TextDecoder('latin1').decode(streamSlice);
    }

    if (!textContent) continue;

    let currentX = 50;
    let currentY = 500;

    const textLines = textContent.split(/\r?\n/);
    for (const tl of textLines) {
      const tmMatch = tl.match(/([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+Tm/);
      if (tmMatch) {
        currentX = parseFloat(tmMatch[5]);
        currentY = Math.round(parseFloat(tmMatch[6]));
      }

      const tdMatch = tl.match(/([-\d.]+)\s+([-\d.]+)\s+T[dD]/);
      if (tdMatch) {
        currentX += parseFloat(tdMatch[1]);
        currentY += Math.round(parseFloat(tdMatch[2]));
      }

      const tjMatches = tl.matchAll(/\(((?:\\\(|\\\)|[^()])*)\)\s*Tj/g);
      for (const m of tjMatches) {
        const str = convertArabicNumerals(m[1].replace(/\\([()\\])/g, '$1')).trim();
        if (str) {
          items.push({ str, x: currentX, y: currentY, page: pageNum });
        }
      }

      const tjArrayMatches = tl.matchAll(/\[(.*?)\]\s*TJ/g);
      for (const m of tjArrayMatches) {
        const inner = m[1];
        const strSegments = Array.from(inner.matchAll(/\(((?:\\\(|\\\)|[^()])*)\)/g))
          .map((seg) => seg[1].replace(/\\([()\\])/g, '$1'))
          .join('');
        const str = convertArabicNumerals(strSegments).trim();
        if (str) {
          items.push({ str, x: currentX, y: currentY, page: pageNum });
        }
      }
    }
    pageNum++;
  }

  return items;
}

async function parsePdfDocItems(doc: any): Promise<PdfItemWithCoord[]> {
  const items: PdfItemWithCoord[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items as any[]) {
      if ('str' in item && item.str && item.str.trim()) {
        items.push({
          str: convertArabicNumerals(item.str),
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

interface PdfExtractionResult {
  items: PdfItemWithCoord[];
  openedSuccessfully: boolean;
  errorReason?: 'encrypted' | 'corrupted' | 'unreadable';
  errorDetails?: string;
}

// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/**
 * Extracts structured items with coordinates using PDF.js (100% Offline with bundled worker & main-thread fallback)
 */
async function extractItemsWithPdfJs(arrayBuffer: ArrayBuffer): Promise<PdfExtractionResult> {
  const safeData = new Uint8Array(arrayBuffer.slice(0));

  let pdfjsLib: any;
  try {
    pdfjsLib = await import('pdfjs-dist');
  } catch (loadErr: any) {
    console.warn('Failed to dynamically import pdfjs-dist:', loadErr);
    return {
      items: [],
      openedSuccessfully: false,
      errorReason: 'unreadable',
      errorDetails: loadErr?.message || 'Failed to load PDF library',
    };
  }

  // Tier A: Try same-origin worker URL (Standard Vite asset URL - Works natively on WebKit / iOS PWA)
  try {
    console.info('Schedule PDF: attempting Tier A worker extraction...');
    if (pdfWorkerUrl) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      pdfjsLib.GlobalWorkerOptions.workerPort = null;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: safeData,
      useSystemFonts: true,
    });

    const doc = await Promise.race([
      loadingTask.promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF.js worker loading timeout')), 4000)
      ),
    ]);

    const items = await parsePdfDocItems(doc);
    console.info(`Schedule PDF: Tier A worker extraction succeeded with ${items.length} text items`);
    if (items.length > 0) {
      return { items, openedSuccessfully: true };
    }
  } catch (tierAErr: any) {
    console.warn('PDF.js Tier A (Same-Origin Worker) failed, attempting Tier B (Inline Worker):', tierAErr);
  }

  // Tier B: Try inline Blob worker
  try {
    console.info('Schedule PDF: attempting Tier B inline worker extraction...');
    // @ts-ignore
    const workerModule = await import('pdfjs-dist/build/pdf.worker.mjs?worker&inline');
    const PdfWorkerConstructor = workerModule.default || workerModule;
    if (typeof PdfWorkerConstructor === 'function') {
      const inlineWorker = new PdfWorkerConstructor();
      pdfjsLib.GlobalWorkerOptions.workerPort = inlineWorker;

      const loadingTask = pdfjsLib.getDocument({
        data: safeData,
        useSystemFonts: true,
      });

      const doc = await Promise.race([
        loadingTask.promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('PDF.js worker loading timeout')), 4000)
        ),
      ]);

      const items = await parsePdfDocItems(doc);
      console.info(`Schedule PDF: Tier B inline worker extraction succeeded with ${items.length} text items`);
      if (items.length > 0) {
        return { items, openedSuccessfully: true };
      }
    }
  } catch (tierBErr: any) {
    console.warn('PDF.js Tier B (Inline Worker) failed, attempting Tier C fallback:', tierBErr);
  }

  // Tier C: Fallback loading task
  try {
    console.info('Schedule PDF: attempting Tier C fallback extraction...');
    if (pdfWorkerUrl) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      pdfjsLib.GlobalWorkerOptions.workerPort = null;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: safeData,
      useSystemFonts: true,
      stopAtErrors: false,
    });

    const doc = await loadingTask.promise;
    const items = await parsePdfDocItems(doc);
    console.info(`Schedule PDF: Tier C extraction succeeded with ${items.length} text items`);
    return { items, openedSuccessfully: true };
  } catch (tierCErr: any) {
    console.warn('PDF.js Tier C failed:', tierCErr);

    const errMsg = (tierCErr?.message || tierCErr?.name || String(tierCErr)).toLowerCase();
    let errorReason: 'encrypted' | 'corrupted' | 'unreadable' = 'unreadable';

    if (tierCErr?.name === 'PasswordException' || errMsg.includes('password') || errMsg.includes('encrypt')) {
      errorReason = 'encrypted';
    } else if (
      tierCErr?.name === 'InvalidPDFException' ||
      tierCErr?.name === 'FormatError' ||
      errMsg.includes('invalid') ||
      errMsg.includes('corrupt') ||
      errMsg.includes('structure') ||
      errMsg.includes('pdf header')
    ) {
      errorReason = 'corrupted';
    }

    return { items: [], openedSuccessfully: false, errorReason, errorDetails: tierCErr?.message };
  }
}

/**
 * Main Offline Extractor Entry Point for Schedule Files (PDFs)
 */
export async function extractScheduleFromDoctorPdf(file: File): Promise<ExtractedScheduleResult> {
  const fileName = file.name;
  const arrayBuffer = await file.arrayBuffer();

  let pdfItems: PdfItemWithCoord[] = [];
  let openedSuccessfully = false;
  let extractionErrorReason: 'encrypted' | 'corrupted' | 'unreadable' | undefined;
  let extractionErrorDetails: string | undefined;

  // Tier 1: Try PDF.js (Worker + Main-Thread Fallback)
  try {
    const result = await extractItemsWithPdfJs(arrayBuffer);
    pdfItems = result.items;
    openedSuccessfully = result.openedSuccessfully;
    extractionErrorReason = result.errorReason;
    extractionErrorDetails = result.errorDetails;
  } catch (err: any) {
    console.warn('PDF.js extraction error:', err);
  }

  // Tier 2: Native PDF stream decoder
  if (pdfItems.length === 0 && extractionErrorReason !== 'encrypted') {
    try {
      pdfItems = await extractPdfItemsNatively(arrayBuffer);
      if (pdfItems.length > 0) {
        openedSuccessfully = true;
      }
    } catch (err) {
      console.warn('Native PDF decoder error:', err);
    }
  }

  const studentMeta = extractStudentMetadata(pdfItems);

  // Strategy 1: Universal 2D Tabular Grid Parser
  if (pdfItems.length > 0) {
    const { clinicalSessions, allSessions } = extract2DTabularSchedule(pdfItems);
    if (clinicalSessions.length > 0 || allSessions.length > 0) {
      const activeSessions = clinicalSessions.length > 0 ? clinicalSessions : allSessions;
      return {
        sessions: activeSessions,
        allSessions: allSessions.length > 0 ? allSessions : activeSessions,
        studentMeta,
        fileName,
        source: 'offline-pdf-parser',
        message: `Extracted ${activeSessions.length} sessions from ${fileName}`,
      };
    }
  }

  // Reconstruct spatial horizontal lines from PDF coordinates
  const reconstructedLines = groupPdfItemsIntoLines(pdfItems);
  const lineTexts = reconstructedLines.map((l) => l.text);

  // Strategy 2: Agenda Section Headers & Line Extractor
  if (lineTexts.length > 0) {
    const { clinicalSessions: agendaClin, allSessions: agendaAll } = extractAgendaSchedule(lineTexts);

    if (agendaClin.length > 0 || agendaAll.length > 0) {
      const activeSessions = agendaClin.length > 0 ? agendaClin : agendaAll;
      return {
        sessions: activeSessions,
        allSessions: agendaAll.length > 0 ? agendaAll : activeSessions,
        studentMeta,
        fileName,
        source: 'offline-pdf-parser',
        message: `Extracted ${activeSessions.length} sessions from ${fileName}`,
      };
    }
  }

  // Strategy 3: Spatial Proximity & Token Cluster Extractor (Fallback)
  if (reconstructedLines.length > 0) {
    const { clinicalSessions: proxClin, allSessions: proxAll } = extractProximitySchedule(reconstructedLines);

    if (proxClin.length > 0 || proxAll.length > 0) {
      const activeSessions = proxClin.length > 0 ? proxClin : proxAll;
      return {
        sessions: activeSessions,
        allSessions: proxAll.length > 0 ? proxAll : activeSessions,
        studentMeta,
        fileName,
        source: 'offline-pdf-parser',
        message: `Extracted ${activeSessions.length} sessions from ${fileName}`,
      };
    }
  }

  // Error Classification
  if (pdfItems.length === 0) {
    if (extractionErrorReason === 'encrypted') {
      throw new Error(
        `The PDF document "${fileName}" is password-protected or encrypted. Please remove password protection or paste your schedule text directly.`
      );
    }
    if (extractionErrorReason === 'corrupted') {
      throw new Error(
        `The PDF document "${fileName}" appears to be damaged or formatted incorrectly (${extractionErrorDetails || 'Invalid PDF structure'}). Try re-saving the PDF or paste your schedule text directly.`
      );
    }
    if (openedSuccessfully) {
      throw new Error(
        `The PDF document "${fileName}" appears to be scanned or image-based with no selectable text. Please upload a text-based schedule PDF or paste your schedule text directly.`
      );
    }
    throw new Error(
      `Could not read PDF document "${fileName}". Try pasting your schedule text directly.`
    );
  }

  throw new Error(
    `Extracted ${pdfItems.length} text items from "${fileName}", but no valid schedule sessions (days, times, clinics) were recognized. Please check the document format or paste your schedule text directly.`
  );
}

/**
 * Main Offline Extractor for Text / Copied Schedule Content
 */
export function extractScheduleFromText(text: string, fileName = 'Pasted_Schedule.txt'): ExtractedScheduleResult {
  const lines = text.split(/\r?\n/);
  const { clinicalSessions, allSessions } = extractAgendaSchedule(lines);

  if (allSessions.length === 0) {
    throw new Error('Could not detect valid schedule time ranges in the provided text.');
  }

  return {
    sessions: clinicalSessions.length > 0 ? clinicalSessions : allSessions,
    allSessions,
    studentMeta: {},
    fileName,
    source: 'text-parser',
    message: `Extracted ${allSessions.length} sessions from schedule text.`,
  };
}
