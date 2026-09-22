import { ClinicalStep, ClinicalProcedure } from '../types';
import { PERMANENT_TEETH, DECIDUOUS_TEETH, ToothInfo } from '../components/ToothDiagramSelector';

export interface MacroStepStatus {
  total: number;
  totalSteps: number;
  completedCount: number;
  percent: number;
  reachedStep: ClinicalStep | null;
  reachedStepIndex: number; // 0-based index of last completed step (-1 if none)
  currentStep: ClinicalStep | null; // active or first uncompleted step
  nextStep: ClinicalStep | null; // next step to perform
  isAllDone: boolean;
  statusBadgeText: string;
}

export interface ToothGroup {
  key: string;
  toothNumber: string;
  name: string;
  quadrant: string;
  isSpecificTooth: boolean;
  procedures: ClinicalProcedure[];
}

/**
 * Calculates the macro clinical step status for a procedure.
 * Accepts either a ClinicalProcedure or an array of ClinicalSteps.
 * Identifies the milestone the Dr has reached and what the next step is.
 */
export function getProcedureMacroStepStatus(
  input: ClinicalProcedure | ClinicalStep[] = []
): MacroStepStatus {
  const steps: ClinicalStep[] = Array.isArray(input) ? input : (input.steps || []);
  const total = steps.length;

  if (total === 0) {
    return {
      total: 0,
      totalSteps: 0,
      completedCount: 0,
      percent: 0,
      reachedStep: null,
      reachedStepIndex: -1,
      currentStep: null,
      nextStep: null,
      isAllDone: false,
      statusBadgeText: 'No steps defined',
    };
  }

  const completedIndices: number[] = [];
  steps.forEach((step, idx) => {
    if (step.isCompleted) completedIndices.push(idx);
  });

  const completedCount = completedIndices.length;
  const percent = Math.round((completedCount / total) * 100);
  const isAllDone = completedCount === total;

  const lastCompletedIndex = completedIndices.length > 0
    ? completedIndices[completedIndices.length - 1]
    : -1;

  const firstUncompletedIndex = steps.findIndex((s) => !s.isCompleted);

  const reachedStep = lastCompletedIndex !== -1 ? steps[lastCompletedIndex] : null;
  const currentStep = firstUncompletedIndex !== -1 ? steps[firstUncompletedIndex] : null;
  // If first uncompleted step is next, that's what the Dr needs to do next
  const nextStep = firstUncompletedIndex !== -1 ? steps[firstUncompletedIndex] : null;

  let statusBadgeText = '';
  if (isAllDone) {
    statusBadgeText = `All ${total} macro steps completed ✓`;
  } else if (reachedStep) {
    statusBadgeText = `Reached: ${reachedStep.title} (Step ${lastCompletedIndex + 1} of ${total})`;
  } else {
    statusBadgeText = `Ready to start: ${steps[0].title}`;
  }

  return {
    total,
    totalSteps: total,
    completedCount,
    percent,
    reachedStep,
    reachedStepIndex: lastCompletedIndex,
    currentStep,
    nextStep,
    isAllDone,
    statusBadgeText,
  };
}

/**
 * Cleans any redundantly baked tooth string from procedure title
 * (e.g. "Fixed Procedure (Teeth UR4, UR5)" -> "Fixed Procedure").
 */
export function cleanProcedureTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*\((?:teeth|tooth|#)?[^)]+\)\s*$/i, '')
    .trim() || title;
}

/**
 * Formats multiple teeth or notation into a clean, unified display string
 * e.g., "Teeth UR4, UR5" -> "UR4 · UR5"
 * e.g., "Tooth UR4" -> "UR4"
 * e.g., "Teeth #14, #15" -> "#14 · #15"
 */
export function formatTeethDisplay(raw?: string): string {
  if (!raw || !raw.trim()) return '';
  const trimmed = raw.trim();

  // Check for Digital Palmer matches (e.g. UR4, UR5, LL6)
  const palmerMatches = trimmed.match(/\b(U[LR][1-8A-E]|L[LR][1-8A-E])\b/gi);
  if (palmerMatches && palmerMatches.length > 0) {
    const unique = Array.from(new Set(palmerMatches.map((m) => m.toUpperCase())));
    return unique.join(' · ');
  }

  // Check for FDI with # (e.g. #14, #15)
  const fdiMatches = trimmed.match(/#[1-8][1-8]/g);
  if (fdiMatches && fdiMatches.length > 0) {
    const unique = Array.from(new Set(fdiMatches));
    return unique.join(' · ');
  }

  // If Arch / Jaw or Full Mouth
  if (/maxillary|mandibular|arch|jaw|full\s*mouth/i.test(trimmed)) {
    return trimmed;
  }

  // Fallback: strip leading "Teeth ", "Tooth ", and replace commas with " · "
  const cleaned = trimmed
    .replace(/^teeth\s+/i, '')
    .replace(/^tooth\s+/i, '')
    .replace(/,\s*/g, ' · ')
    .trim();

  return cleaned || trimmed;
}

/**
 * Aggregates all unique involved teeth across all procedures in a case.
 */
export function getCaseInvolvedTeeth(procedures: ClinicalProcedure[] = []): string[] {
  const teethSet = new Set<string>();
  procedures.forEach((p) => {
    if (!p.toothNumber) return;
    const formatted = formatTeethDisplay(p.toothNumber);
    if (!formatted) return;
    formatted.split(' · ').forEach((t) => {
      const trimmed = t.trim();
      if (trimmed) teethSet.add(trimmed);
    });
  });
  return Array.from(teethSet);
}

/**
 * Resolves dental tooth metadata (name, quadrant, anatomical description)
 * from standard notation string (e.g., "#14", "14", "36", "UR 1st Premolar").
 */
export function resolveToothInfo(toothNotation?: string): {
  cleanId: string;
  tooth?: ToothInfo;
  displayName: string;
  display: string;
  quadrantBadge?: string;
  isSpecificTooth: boolean;
} {
  if (!toothNotation || !toothNotation.trim()) {
    return {
      cleanId: 'General / Non-Tooth Specific',
      displayName: 'General / Arch-Level Procedure',
      display: 'General',
      isSpecificTooth: false,
    };
  }

  const raw = toothNotation.trim();
  // Check if it matches Digital Palmer (e.g. "UL3", "LL5", "LR6", "UR1", "Tooth UL3")
  const dpMatch = raw.match(/\b(U[LR][1-8A-E]|L[LR][1-8A-E])\b/i);
  const dpProbe = dpMatch ? dpMatch[1].toUpperCase() : null;

  // Extract digits or tooth identification (e.g. "#14" -> "14", "tooth 15" -> "15")
  const digitsMatch = raw.match(/\b([1-8][1-8]|[A-T]|[1-3]?[0-9])\b/i);
  const probe = dpProbe || (digitsMatch ? digitsMatch[1].toUpperCase() : raw.replace(/[#\s]/g, ''));

  const permanentMatch = PERMANENT_TEETH.find(
    (t) =>
      (dpProbe && t.digitalPalmer.toUpperCase() === dpProbe) ||
      t.digitalPalmer.toUpperCase() === probe ||
      t.fdi === probe ||
      t.universal === probe ||
      `#${t.fdi}` === raw ||
      t.palmer === probe
  );
  if (permanentMatch) {
    return {
      cleanId: permanentMatch.digitalPalmer,
      tooth: permanentMatch,
      displayName: `${permanentMatch.digitalPalmer} (#${permanentMatch.fdi}) • ${permanentMatch.name}`,
      display: permanentMatch.digitalPalmer,
      quadrantBadge: permanentMatch.quadrantName,
      isSpecificTooth: true,
    };
  }

  const deciduousMatch = DECIDUOUS_TEETH.find(
    (t) =>
      (dpProbe && t.digitalPalmer.toUpperCase() === dpProbe) ||
      t.digitalPalmer.toUpperCase() === probe ||
      t.fdi === probe ||
      t.universal.toUpperCase() === probe ||
      `#${t.fdi}` === raw
  );
  if (deciduousMatch) {
    return {
      cleanId: deciduousMatch.digitalPalmer,
      tooth: deciduousMatch,
      displayName: `${deciduousMatch.digitalPalmer} (#${deciduousMatch.fdi}) • ${deciduousMatch.name}`,
      display: deciduousMatch.digitalPalmer,
      quadrantBadge: deciduousMatch.quadrantName,
      isSpecificTooth: true,
    };
  }

  const isSpecific = /^#?\d+$/.test(raw);
  const cleanId = raw.startsWith('#') ? raw : `#${raw}`;

  return {
    cleanId,
    displayName: raw.startsWith('#') ? raw : `Tooth #${raw}`,
    display: cleanId,
    isSpecificTooth: isSpecific,
    quadrantBadge: isSpecific ? 'Treated Tooth' : undefined,
  };
}

/**
 * Groups clinical procedures by their tooth notation.
 * Returns an array of ToothGroups suitable for hierarchical display.
 */
export function groupProceduresByTooth(procedures: ClinicalProcedure[]): ToothGroup[] {
  const groupsMap = new Map<string, ToothGroup>();

  procedures.forEach((proc) => {
    const rawTooth = proc.toothNumber?.trim() || '';
    const resolved = resolveToothInfo(rawTooth);
    const key = resolved.cleanId;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key,
        toothNumber: resolved.cleanId,
        name: resolved.tooth?.name || resolved.displayName,
        quadrant: resolved.quadrantBadge || (resolved.isSpecificTooth ? 'Treated Tooth' : 'General / Arch'),
        isSpecificTooth: resolved.isSpecificTooth,
        procedures: [],
      });
    }

    groupsMap.get(key)!.procedures.push(proc);
  });

  return Array.from(groupsMap.values());
}

export const ENDO_STAGES = [
  { key: 'preOp', label: 'Pre-operative X-ray', shortLabel: 'Pre-op', category: 'Pre-Op' },
  { key: 'estimatedWorkingLength', label: 'Estimated Working Length X-ray', shortLabel: 'Working Length', category: 'Intra-Op' },
  { key: 'masterCone', label: 'Master Cone X-ray', shortLabel: 'Master Cone', category: 'Intra-Op' },
  { key: 'postOp', label: 'Post-operative X-ray', shortLabel: 'Post-op', category: 'Post-Op' },
] as const;

export type EndoStageKey = typeof ENDO_STAGES[number]['key'];

/**
 * Splits procedure.toothNumber into clean individual tooth identifiers.
 * e.g., "36, 37" -> ["Tooth #36", "Tooth #37"]
 */
export function parseProcedureTeeth(toothNumber?: string): string[] {
  if (!toothNumber || !toothNumber.trim()) return ['Tooth #1'];
  const formatted = formatTeethDisplay(toothNumber);
  if (!formatted) return ['Tooth #1'];

  if (/maxillary|mandibular|arch|jaw|full\s*mouth/i.test(formatted) && !/\d/.test(formatted)) {
    return [formatted];
  }

  const parts = formatted
    .split(/\s*·\s*|\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) return ['Tooth #1'];

  return parts.map((p) => {
    if (/^tooth/i.test(p)) return p;
    if (/^(u[lr]|l[lr])/i.test(p)) return `Tooth ${p.toUpperCase()}`;
    if (p.startsWith('#')) return `Tooth ${p}`;
    return `Tooth #${p}`;
  });
}
