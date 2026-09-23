export type ClinicPlace = 'A' | 'B' | 'C' | 'M' | 'N' | 'G';

export type Semester = 'Semester 1' | 'Semester 2';

export type DisciplineType = 
  | 'Operative'
  | 'Fixed'
  | 'Endo'
  | 'Removable'
  | 'Perio'
  | 'Oral Surgery'
  | 'Pediatric Dentistry'
  | 'Orthodontics';

export type CaseStatus = 
  | 'In Progress'
  | 'Finished'
  | 'Finished (Missing Signatures)'
  | 'Finished (Awaiting Signatures)'
  | 'Ready for Moodle'
  | 'Completed'
  | 'Abandoned';

export type ProcedureStatus = 
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Awaiting Signature'
  | 'Signed'
  | 'Ready for Moodle'
  | 'Submitted';

export type SignatureStatus = 'Not Required' | 'Pending' | 'Signed';

export type MoodleStatus = 'Not Submitted' | 'Submitted';

export interface ClinicalStep {
  id: string;
  title: string;
  isCompleted: boolean;
  completedDate?: string;
  notes?: string;
}

export interface RubricDocument {
  id: string;
  title: string;
  discipline: DisciplineType | string;
  instructorName: string;
  instructorRole?: 'Teaching Assistant (TA)' | 'PhD Holder' | 'Staff Doctor';
  status: SignatureStatus;
  signatureDate?: string;
  fileId?: string;
  fileName?: string;
  fileDataUrl?: string; // Cache / thumbnail for quick previews
  uploadedAt: string;
  notes?: string;
}

export type EndoStageKey = 'preOp' | 'estimatedWorkingLength' | 'masterCone' | 'postOp';

export interface EvidenceFile {
  id: string;
  caseId: string;
  procedureId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: 'X-Ray' | 'Pre-Op' | 'Intra-Op' | 'Post-Op' | 'Rubric' | 'Moodle Screenshot' | 'Other' | 'Endo Radiograph';
  fileDataUrl: string; // Base64 or Object URL for local presentation
  uploadedAt: string;
  notes?: string;
  isSignedRubric?: boolean;
  endoToothNumber?: string; // Tooth associated with this radiograph (e.g. "36", "UR6")
  endoStage?: EndoStageKey;  // 'preOp' | 'estimatedWorkingLength' | 'masterCone' | 'postOp'
}

export interface RemovableArchSelection {
  type: 'partial' | 'complete' | 'none';
  replacedTeeth: string[]; // FDI tooth numbers (e.g. ['14', '15', '16'])
}

export interface RemovableCaseConfig {
  maxillary: RemovableArchSelection;
  mandibular: RemovableArchSelection;
}

export interface ClinicalProcedure {
  id: string;
  caseId: string;
  discipline: DisciplineType;
  title: string;
  toothNumber?: string;
  removable?: RemovableCaseConfig;
  points?: number;
  status: ProcedureStatus;
  date: string;
  steps: ClinicalStep[];
  rubrics: RubricDocument[];
  evidenceFiles: EvidenceFile[];
  moodleStatus: MoodleStatus;
  moodleSubmissionDate?: string;
  moodleSubmissionRef?: string;
  moodleScreenshotUrl?: string;
  notes?: string;
}

export interface DentalCase {
  id: string;
  isDemo?: boolean;
  patientName: string;
  fileNumber: string;
  patientPhone?: string;
  semester: Semester;
  academicYear: string;
  clinicPlace: ClinicPlace;
  status: CaseStatus;
  isComprehensive: boolean; // Auto-derived if 3+ disciplines present
  disciplines: DisciplineType[];
  procedures: ClinicalProcedure[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  targetNextVisitDate?: string;
  targetNextVisitPlan?: string;
}

export interface ProcedureTemplate {
  id: string;
  discipline: DisciplineType;
  name: string;
  defaultSteps: string[];
  defaultPoints: number;
  rubricTitle: string;
}

export interface ClinicScheduleItem {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  clinicPlace: ClinicPlace;
  discipline: string;
  semester?: Semester;
  chairCount?: number;
  notes?: string;
}

export type ClinicSession = ClinicScheduleItem;

export interface StudentProfile {
  studentName: string;
  studentId?: string;
  academicYear: string;
  currentSemester: Semester;
  pointsTarget: number;
  university?: string;
  toothNotation?: 'palmer' | 'fdi';
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  schedulePdfUploaded?: boolean;
  schedulePdfMeta?: {
    fileName: string;
    uploadedAt: string;
    sessionCount: number;
    studentName?: string;
    studentId?: string;
    university?: string;
    faculty?: string;
    semester?: string;
  };
}

