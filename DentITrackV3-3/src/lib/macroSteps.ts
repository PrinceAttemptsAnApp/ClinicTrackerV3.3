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
  // Extract digits or tooth identification (e.g. "#14" -> "14", "tooth 15" -> "15")
  const digitsMatch = raw.match(/\b([1-8][1-8]|[A-T]|[1-3]?[0-9])\b/i);
  const probe = digitsMatch ? digitsMatch[1].toUpperCase() : raw.replace(/[#\s]/g, '');

  const permanentMatch = PERMANENT_TEETH.find(
    (t) => t.fdi === probe || t.universal === probe || `#${t.fdi}` === raw || t.palmer === probe
  );
  if (permanentMatch) {
    return {
      cleanId: `#${permanentMatch.fdi}`,
      tooth: permanentMatch,
      displayName: `#${permanentMatch.fdi} • ${permanentMatch.name}`,
      display: `#${permanentMatch.fdi}`,
      quadrantBadge: permanentMatch.quadrantName,
      isSpecificTooth: true,
    };
  }

  const deciduousMatch = DECIDUOUS_TEETH.find(
    (t) => t.fdi === probe || t.universal.toUpperCase() === probe || `#${t.fdi}` === raw
  );
  if (deciduousMatch) {
    return {
      cleanId: `#${deciduousMatch.fdi}`,
      tooth: deciduousMatch,
      displayName: `#${deciduousMatch.fdi} • ${deciduousMatch.name}`,
      display: `#${deciduousMatch.fdi}`,
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
