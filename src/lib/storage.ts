import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DentalCase, ProcedureTemplate, ClinicScheduleItem, StudentProfile, DisciplineType } from '../types';
import { safeLocalStorage } from './safeStorage';

interface DentaTrackDB extends DBSchema {
  cases: {
    key: string;
    value: DentalCase;
    indexes: {
      'by-semester': string;
      'by-patient': string;
      'by-status': string;
      'by-fileNumber': string;
    };
  };
  templates: {
    key: string;
    value: ProcedureTemplate;
  };
  schedules: {
    key: string;
    value: ClinicScheduleItem;
  };
  profile: {
    key: string;
    value: StudentProfile;
  };
  blobs: {
    key: string;
    value: {
      id: string;
      fileName: string;
      fileType: string;
      dataUrl: string;
      uploadedAt: string;
    };
  };
}

const DB_NAME = 'dentatrack-5th-year-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DentaTrackDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<DentaTrackDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DentaTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Cases Store
        if (!db.objectStoreNames.contains('cases')) {
          const caseStore = db.createObjectStore('cases', { keyPath: 'id' });
          caseStore.createIndex('by-semester', 'semester');
          caseStore.createIndex('by-patient', 'patientName');
          caseStore.createIndex('by-status', 'status');
          caseStore.createIndex('by-fileNumber', 'fileNumber');
        }
        // Templates Store
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates', { keyPath: 'id' });
        }
        // Schedules Store
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        // Profile Store
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'studentId' });
        }
        // Blobs / files store
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// Default Templates for fast Chairside Procedure Creation - Clean Macro Milestones across all disciplines
export const DEFAULT_TEMPLATES: ProcedureTemplate[] = [
  // ================= FIXED PROSTHODONTICS =================
  {
    id: 'tmpl-fixed-single-crown',
    discipline: 'Fixed',
    name: 'Single Fixed Crown',
    rubricTitle: 'Single Crown Clinical Evaluation Rubric',
    defaultPoints: 15,
    defaultSteps: [
      'Temporisation index',
      'Reduction',
      'Temporary crown production',
      'Secondary impression',
      'Try-in',
      'Delivery',
    ],
  },
  {
    id: 'tmpl-fixed-bridge',
    discipline: 'Fixed',
    name: 'Fixed Partial Denture (Bridge)',
    rubricTitle: 'Fixed Bridge Clinical Evaluation Rubric',
    defaultPoints: 20,
    defaultSteps: [
      'Diagnostic index / temporisation matrix',
      'Abutment reduction',
      'Temporary bridge production',
      'Secondary impression',
      'Framework try-in',
      'Delivery',
    ],
  },
  {
    id: 'tmpl-fixed-post-core',
    discipline: 'Fixed',
    name: 'Post & Core Restoration',
    rubricTitle: 'Post & Core Build-up Rubric',
    defaultPoints: 12,
    defaultSteps: [
      'Gutta-percha de-obturation',
      'Post space preparation & try-in',
      'Post cementation & core build-up',
      'Core finish line refinement',
    ],
  },
  {
    id: 'tmpl-fixed-veneer',
    discipline: 'Fixed',
    name: 'Porcelain / Ceramic Veneer',
    rubricTitle: 'Laminate Veneer Clinical Rubric',
    defaultPoints: 15,
    defaultSteps: [
      'Diagnostic mock-up & index',
      'Enamel reduction & margin prep',
      'Provisional veneer production',
      'Secondary impression',
      'Try-in (shade & fit)',
      'Adhesive delivery & cementation',
    ],
  },
  {
    id: 'tmpl-fixed-endocrown',
    discipline: 'Fixed',
    name: 'Endocrown Restoration',
    rubricTitle: 'Endocrown Evaluation Rubric',
    defaultPoints: 14,
    defaultSteps: [
      'Pulp chamber base & preparation',
      'Butt margin reduction',
      'Secondary impression',
      'Try-in',
      'Delivery & bonding',
    ],
  },

  // ================= OPERATIVE / RESTORATIVE =================
  {
    id: 'tmpl-operative-class2',
    discipline: 'Operative',
    name: 'Class II Composite Restoration',
    rubricTitle: 'Class II Restorative Rubric',
    defaultPoints: 8,
    defaultSteps: [
      'Cavity preparation',
      'Matrix band & wedge adaptation',
      'Etching & adhesive bonding protocol',
      'Incremental composite restoration',
      'Finishing, occlusion adjustment & polish',
    ],
  },
  {
    id: 'tmpl-operative-class1',
    discipline: 'Operative',
    name: 'Class I Composite Restoration',
    rubricTitle: 'Class I Restorative Rubric',
    defaultPoints: 6,
    defaultSteps: [
      'Cavity preparation',
      'Etching & bonding protocol',
      'Composite placement & curing',
      'Occlusal adjustment & polishing',
    ],
  },
  {
    id: 'tmpl-operative-class4',
    discipline: 'Operative',
    name: 'Class IV Anterior Composite',
    rubricTitle: 'Class IV Aesthetic Restorative Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Shade mapping & palatal silicone index',
      'Enamel beveling & preparation',
      'Palatal shelf & dentin layering',
      'Finishing, texture carving & high polish',
    ],
  },
  {
    id: 'tmpl-operative-class5',
    discipline: 'Operative',
    name: 'Class V Cervical Restoration',
    rubricTitle: 'Class V Restorative Rubric',
    defaultPoints: 6,
    defaultSteps: [
      'Gingival retraction & cavity preparation',
      'Adhesive protocol (etch & bond)',
      'Composite restoration placement',
      'Cervical finishing & polishing',
    ],
  },
  {
    id: 'tmpl-operative-inlay',
    discipline: 'Operative',
    name: 'Inlay / Onlay Restoration',
    rubricTitle: 'Inlay/Onlay Clinical Rubric',
    defaultPoints: 12,
    defaultSteps: [
      'Cavity preparation & margin refinement',
      'Provisional restoration',
      'Secondary impression',
      'Try-in',
      'Adhesive delivery & cementation',
    ],
  },

  // ================= ENDODONTICS =================
  {
    id: 'tmpl-endo-rct',
    discipline: 'Endo',
    name: 'Root Canal Treatment',
    rubricTitle: 'Endodontics Clinical Workflow Rubric',
    defaultPoints: 20,
    defaultSteps: [
      'Rubber dam isolation & access cavity',
      'Working length determination & scouting',
      'Mechanical instrumentation & irrigation',
      'Master cone try-in',
      'Obturation',
      'Coronal seal',
    ],
  },
  {
    id: 'tmpl-endo-retreatment',
    discipline: 'Endo',
    name: 'Endodontic Retreatment',
    rubricTitle: 'Endodontic Retreatment Rubric',
    defaultPoints: 22,
    defaultSteps: [
      'Coronal access & de-obturation',
      'Canal re-instrumentation & medication',
      'Master cone try-in',
      'Re-obturation',
      'Coronal seal',
    ],
  },
  {
    id: 'tmpl-endo-pulpotomy',
    discipline: 'Endo',
    name: 'Vital Pulp Therapy / Pulpotomy',
    rubricTitle: 'Vital Pulp Therapy Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Isolation & caries removal',
      'Coronal pulp amputation & hemostasis',
      'Bioceramic / MTA placement',
      'Coronal seal & definitive restoration',
    ],
  },

  // ================= REMOVABLE PROSTHODONTICS =================
  {
    id: 'tmpl-removable-complete',
    discipline: 'Removable',
    name: 'Complete Denture',
    rubricTitle: 'Complete Denture Clinical Rubric',
    defaultPoints: 25,
    defaultSteps: [
      'Primary impression',
      'Secondary impression & border molding',
      'Jaw relation record',
      'Try-in (teeth in wax)',
      'Delivery & pressure spots relief',
      'Post-insertion follow-up',
    ],
  },
  {
    id: 'tmpl-removable-partial',
    discipline: 'Removable',
    name: 'Removable Partial Denture (RPD)',
    rubricTitle: 'RPD Clinical Rubric',
    defaultPoints: 20,
    defaultSteps: [
      'Primary impression & mouth preparation',
      'Secondary impression',
      'Metal framework try-in & jaw relation',
      'Wax try-in',
      'Delivery & clasp adjustment',
      'Post-insertion follow-up',
    ],
  },

  // ================= PERIODONTICS =================
  {
    id: 'tmpl-perio-srp',
    discipline: 'Perio',
    name: 'Full Mouth Scaling & Root Planing (SRP)',
    rubricTitle: 'Periodontal Therapy Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Periodontal probing & baseline charting',
      'Supragingival scaling',
      'Subgingival root planing',
      'Pocket irrigation & oral hygiene instructions',
      'Re-evaluation (4-6 weeks re-probing)',
    ],
  },
  {
    id: 'tmpl-perio-crown-lengthening',
    discipline: 'Perio',
    name: 'Crown Lengthening / Gingivectomy',
    rubricTitle: 'Periodontal Surgery Rubric',
    defaultPoints: 12,
    defaultSteps: [
      'Periodontal probing & bone sounding',
      'Surgical incision / flap reflection',
      'Osseous reduction & margin relocation',
      'Suturing & dressing',
      'Suture removal & healing check',
    ],
  },

  // ================= ORAL SURGERY =================
  {
    id: 'tmpl-surgery-simple-ext',
    discipline: 'Oral Surgery',
    name: 'Simple / Routine Tooth Extraction',
    rubricTitle: 'Oral Surgery Routine Extraction Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Pre-op radiographic evaluation & anesthesia',
      'Syndesmotomy & elevation',
      'Forceps delivery',
      'Socket debridement & hemostasis',
      'Post-extraction instructions',
    ],
  },
  {
    id: 'tmpl-surgery-surgical-ext',
    discipline: 'Oral Surgery',
    name: 'Surgical / Impacted Tooth Extraction',
    rubricTitle: 'Surgical Extraction Rubric',
    defaultPoints: 15,
    defaultSteps: [
      'Pre-op imaging & anesthesia',
      'Mucoperiosteal flap reflection',
      'Bone removal & tooth sectioning',
      'Root delivery & socket curettage',
      'Suturing & hemostasis',
      'Suture removal & post-op follow-up',
    ],
  },

  // ================= PEDIATRIC DENTISTRY =================
  {
    id: 'tmpl-pedia-pulpotomy-ssc',
    discipline: 'Pediatric Dentistry',
    name: 'Pulpotomy & Stainless Steel Crown (SSC)',
    rubricTitle: 'Pediatric Pulpotomy & SSC Rubric',
    defaultPoints: 12,
    defaultSteps: [
      'Coronal pulp amputation & hemostasis',
      'Pulp medicament & base placement',
      'Tooth reduction & slices',
      'SSC selection, crimping & try-in',
      'Cementation & clean-up',
    ],
  },
  {
    id: 'tmpl-pedia-restoration',
    discipline: 'Pediatric Dentistry',
    name: 'Pediatric Composite / Strip Crown',
    rubricTitle: 'Pediatric Operative Restoration Rubric',
    defaultPoints: 8,
    defaultSteps: [
      'Caries excavation & isolation',
      'Matrix / Strip crown adaptation',
      'Etching, bonding & composite placement',
      'Finishing & occlusion adjustment',
    ],
  },
  {
    id: 'tmpl-pedia-space-maintainer',
    discipline: 'Pediatric Dentistry',
    name: 'Space Maintainer (Band & Loop)',
    rubricTitle: 'Pediatric Space Maintainer Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Band fitting & impression',
      'Appliance try-in',
      'Cementation & clean-up',
    ],
  },

  // ================= ORTHODONTICS =================
  {
    id: 'tmpl-ortho-brackets',
    discipline: 'Orthodontics',
    name: 'Fixed Appliance (Brackets Bonding)',
    rubricTitle: 'Orthodontic Direct Bonding Rubric',
    defaultPoints: 15,
    defaultSteps: [
      'Diagnostic photos & records',
      'Enamel etching & primer application',
      'Bracket positioning & curing',
      'Archwire engagement & ligation',
      'Patient instructions & hygiene kit',
    ],
  },
  {
    id: 'tmpl-ortho-removable',
    discipline: 'Orthodontics',
    name: 'Removable Appliance (Hawley / Active Plate)',
    rubricTitle: 'Orthodontic Removable Appliance Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Alginate impression',
      'Appliance try-in & retention adjustment',
      'Delivery & activation instruction',
      'Follow-up & reactivation',
    ],
  },
];

// Helper: Calculate whether a case is comprehensive (>= 3 distinct disciplines)
export function computeIsComprehensive(procedures: { discipline: DisciplineType }[]): boolean {
  const distinctDisciplines = new Set(procedures.map(p => p.discipline));
  return distinctDisciplines.size >= 3;
}

// Initial Sample Demo Data with Tooth-based procedures and clean Macro Milestones
const INITIAL_DEMO_CASES: DentalCase[] = [
  {
    id: 'case-demo-001',
    patientName: 'Ahmed El-Sayed',
    fileNumber: '10482',
    patientPhone: '01019283746',
    semester: 'Semester 1',
    academicYear: '2026–2027',
    clinicPlace: 'A',
    status: 'In Progress',
    isComprehensive: true,
    disciplines: ['Fixed', 'Operative', 'Endo'],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    targetNextVisitDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    targetNextVisitPlan: 'Secondary impression for tooth #14 + Post placement check for #36',
    notes: 'Comprehensive case: Crown preparation & post & core on #14, cavity prep on #15 running alongside endo on #36.',
    procedures: [
      {
        id: 'proc-001',
        caseId: 'case-demo-001',
        discipline: 'Fixed',
        title: 'Single Fixed Crown #14',
        toothNumber: '#14',
        points: 15,
        status: 'In Progress',
        date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        steps: [
          { id: 's1-1', title: 'Temporisation index', isCompleted: true, completedDate: '2026-09-14' },
          { id: 's1-2', title: 'Reduction', isCompleted: true, completedDate: '2026-09-14' },
          { id: 's1-3', title: 'Temporary crown production', isCompleted: true, completedDate: '2026-09-14' },
          { id: 's1-4', title: 'Secondary impression', isCompleted: true, completedDate: '2026-09-16' },
          { id: 's1-5', title: 'Try-in', isCompleted: false },
          { id: 's1-6', title: 'Delivery', isCompleted: false },
        ],
        rubrics: [
          {
            id: 'rub-001',
            title: 'Single Crown Clinical Evaluation Rubric',
            discipline: 'Fixed',
            instructorName: 'Dr. Tarek Hegazi',
            instructorRole: 'Teaching Assistant (TA)',
            status: 'Signed',
            signatureDate: '2026-09-14',
            fileName: 'signed_rubric_crown_reduction_14.jpg',
            uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
        ],
        evidenceFiles: [
          {
            id: 'ev-001',
            caseId: 'case-demo-001',
            procedureId: 'proc-001',
            fileName: 'preop_14_reduction.jpg',
            fileType: 'image/jpeg',
            fileSize: 345000,
            category: 'Pre-Op',
            fileDataUrl: '',
            uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
          {
            id: 'ev-002',
            caseId: 'case-demo-001',
            procedureId: 'proc-001',
            fileName: 'crown_prep_finish_line.jpg',
            fileType: 'image/jpeg',
            fileSize: 420000,
            category: 'Intra-Op',
            fileDataUrl: '',
            uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          }
        ],
        moodleStatus: 'Not Submitted',
        notes: 'Chamfer finish line with 1.5mm occlusal reduction. Provisional crown cemented.',
      },
      {
        id: 'proc-002',
        caseId: 'case-demo-001',
        discipline: 'Fixed',
        title: 'Post & Core #14',
        toothNumber: '#14',
        points: 12,
        status: 'Signed',
        date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
        steps: [
          { id: 's2-1', title: 'Gutta-percha de-obturation', isCompleted: true, completedDate: '2026-09-11' },
          { id: 's2-2', title: 'Post space preparation & try-in', isCompleted: true, completedDate: '2026-09-11' },
          { id: 's2-3', title: 'Post cementation & core build-up', isCompleted: true, completedDate: '2026-09-11' },
          { id: 's2-4', title: 'Core finish line refinement', isCompleted: true, completedDate: '2026-09-11' },
        ],
        rubrics: [
          {
            id: 'rub-002',
            title: 'Post & Core Build-up Rubric',
            discipline: 'Fixed',
            instructorName: 'Dr. Mona Samir',
            instructorRole: 'PhD Holder',
            status: 'Signed',
            signatureDate: '2026-09-11',
            fileName: 'signed_rubric_post_core_14.jpg',
            uploadedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
          },
        ],
        evidenceFiles: [
          {
            id: 'ev-003',
            caseId: 'case-demo-001',
            procedureId: 'proc-002',
            fileName: 'post_tryin_radiograph.jpg',
            fileType: 'image/jpeg',
            fileSize: 512000,
            category: 'X-Ray',
            fileDataUrl: '',
            uploadedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
          },
        ],
        moodleStatus: 'Submitted',
        moodleSubmissionDate: '2026-09-12',
        moodleSubmissionRef: 'MOODLE-POST-2026-091',
        notes: 'Prefabricated fiberglass post size #2 cemented with dual-cure resin.',
      },
      {
        id: 'proc-003',
        caseId: 'case-demo-001',
        discipline: 'Operative',
        title: 'Class II MO Composite #15',
        toothNumber: '#15',
        points: 8,
        status: 'In Progress',
        date: new Date().toISOString().split('T')[0],
        steps: [
          { id: 's3-1', title: 'Cavity preparation', isCompleted: true, completedDate: '2026-09-17' },
          { id: 's3-2', title: 'Matrix band & wedge adaptation', isCompleted: true, completedDate: '2026-09-17' },
          { id: 's3-3', title: 'Etching & adhesive bonding protocol', isCompleted: false },
          { id: 's3-4', title: 'Incremental composite restoration', isCompleted: false },
          { id: 's3-5', title: 'Finishing, occlusion adjustment & polish', isCompleted: false },
        ],
        rubrics: [
          {
            id: 'rub-003',
            title: 'Class II Restorative Rubric',
            discipline: 'Operative',
            instructorName: 'Dr. Karim Adel',
            instructorRole: 'Teaching Assistant (TA)',
            status: 'Pending',
            uploadedAt: new Date().toISOString(),
          },
        ],
        evidenceFiles: [],
        moodleStatus: 'Not Submitted',
        notes: 'Cavity prepared with sectional matrix positioned. Ready for etching and bonding.',
      },
      {
        id: 'proc-004',
        caseId: 'case-demo-001',
        discipline: 'Endo',
        title: 'Root Canal Treatment #36',
        toothNumber: '#36',
        points: 20,
        status: 'In Progress',
        date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        steps: [
          { id: 's4-1', title: 'Rubber dam isolation & access cavity', isCompleted: true, completedDate: '2026-09-10' },
          { id: 's4-2', title: 'Working length determination & scouting', isCompleted: true, completedDate: '2026-09-10' },
          { id: 's4-3', title: 'Mechanical instrumentation & irrigation', isCompleted: true, completedDate: '2026-09-10' },
          { id: 's4-4', title: 'Master cone try-in', isCompleted: true, completedDate: '2026-09-10' },
          { id: 's4-5', title: 'Obturation', isCompleted: false },
          { id: 's4-6', title: 'Coronal seal', isCompleted: false },
        ],
        rubrics: [
          {
            id: 'rub-004',
            title: 'Endodontics Clinical Workflow Rubric',
            discipline: 'Endo',
            instructorName: 'Dr. Mona Samir',
            instructorRole: 'PhD Holder',
            status: 'Pending',
            uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          },
        ],
        evidenceFiles: [
          {
            id: 'ev-004',
            caseId: 'case-demo-001',
            procedureId: 'proc-004',
            fileName: 'wl_xray_36.jpg',
            fileType: 'image/jpeg',
            fileSize: 480000,
            category: 'X-Ray',
            fileDataUrl: '',
            uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          }
        ],
        moodleStatus: 'Not Submitted',
        notes: 'Master cone fit verified with radiograph. Ready for obturation in next clinic appointment.',
      },
    ],
  },
  {
    id: 'case-demo-002',
    patientName: 'Sara Mahmoud',
    fileNumber: '10891',
    patientPhone: '01224567890',
    semester: 'Semester 1',
    academicYear: '2026–2027',
    clinicPlace: 'C',
    status: 'In Progress',
    isComprehensive: false,
    disciplines: ['Removable'],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    targetNextVisitDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    targetNextVisitPlan: 'Border molding & Secondary impression lower arch',
    notes: 'Edentulous maxilla and partially edentulous mandible Kennedy Class I.',
    procedures: [
      {
        id: 'proc-005',
        caseId: 'case-demo-002',
        discipline: 'Removable',
        title: 'Complete Denture',
        toothNumber: 'Maxillary & Mandibular Arch',
        points: 25,
        status: 'In Progress',
        date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        steps: [
          { id: 's5-1', title: 'Primary impression', isCompleted: true, completedDate: '2026-09-15' },
          { id: 's5-2', title: 'Secondary impression & border molding', isCompleted: false },
          { id: 's5-3', title: 'Jaw relation record', isCompleted: false },
          { id: 's5-4', title: 'Try-in (teeth in wax)', isCompleted: false },
          { id: 's5-5', title: 'Delivery & pressure spots relief', isCompleted: false },
          { id: 's5-6', title: 'Post-insertion follow-up', isCompleted: false },
        ],
        rubrics: [
          {
            id: 'rub-005',
            title: 'Complete Denture Clinical Rubric',
            discipline: 'Removable',
            instructorName: 'Dr. Hisham Fouad',
            instructorRole: 'Staff Doctor',
            status: 'Signed',
            signatureDate: '2026-09-15',
            fileName: 'primary_impression_signed.jpg',
            uploadedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
        ],
        evidenceFiles: [
          {
            id: 'ev-005',
            caseId: 'case-demo-002',
            procedureId: 'proc-005',
            fileName: 'primary_cast_overview.jpg',
            fileType: 'image/jpeg',
            fileSize: 410000,
            category: 'Intra-Op',
            fileDataUrl: '',
            uploadedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          }
        ],
        moodleStatus: 'Not Submitted',
        notes: 'Primary impression completed. Custom tray fabricated and ready for green stick border molding.',
      },
    ],
  },
  {
    id: 'case-demo-003',
    patientName: 'Mahmoud Hassan',
    fileNumber: '11204',
    patientPhone: '01155667788',
    semester: 'Semester 1',
    academicYear: '2026–2027',
    clinicPlace: 'B',
    status: 'Finished',
    isComprehensive: false,
    disciplines: ['Perio'],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    notes: 'Generalized moderate chronic periodontitis, finished full mouth debridement.',
    procedures: [
      {
        id: 'proc-006',
        caseId: 'case-demo-003',
        discipline: 'Perio',
        title: 'Full Mouth Scaling & Root Planing (SRP)',
        toothNumber: 'Full Mouth',
        points: 10,
        status: 'Submitted',
        date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
        steps: [
          { id: 's6-1', title: 'Periodontal probing & baseline charting', isCompleted: true, completedDate: '2026-09-07' },
          { id: 's6-2', title: 'Supragingival scaling', isCompleted: true, completedDate: '2026-09-07' },
          { id: 's6-3', title: 'Subgingival root planing', isCompleted: true, completedDate: '2026-09-07' },
          { id: 's6-4', title: 'Pocket irrigation & oral hygiene instructions', isCompleted: true, completedDate: '2026-09-07' },
          { id: 's6-5', title: 'Re-evaluation (4-6 weeks re-probing)', isCompleted: true, completedDate: '2026-09-07' },
        ],
        rubrics: [
          {
            id: 'rub-006',
            title: 'Periodontal Therapy Rubric',
            discipline: 'Perio',
            instructorName: 'Dr. Youssef Nabil',
            instructorRole: 'PhD Holder',
            status: 'Signed',
            signatureDate: '2026-09-07',
            fileName: 'perio_rubric_signed.pdf',
            uploadedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          },
        ],
        evidenceFiles: [],
        moodleStatus: 'Submitted',
        moodleSubmissionDate: '2026-09-08',
        moodleSubmissionRef: 'MOODLE-PERIO-0908',
        notes: 'Post-op bleeding on probing reduced to <10%. Requirement submitted to Moodle.',
      },
    ],
  },
];

const INITIAL_SCHEDULES: ClinicScheduleItem[] = [
  {
    id: 'sch-1',
    dayOfWeek: 'Sunday',
    startTime: '09:00',
    endTime: '12:30',
    clinicPlace: 'A',
    discipline: 'Comprehensive Clinic (Fixed / Operative)',
    semester: 'Semester 1',
    notes: 'Main chairside session',
  },
  {
    id: 'sch-2',
    dayOfWeek: 'Tuesday',
    startTime: '09:00',
    endTime: '12:30',
    clinicPlace: 'C',
    discipline: 'Comprehensive Clinic (Removable / Endo)',
    semester: 'Semester 1',
    notes: 'Secondary chair available',
  },
  {
    id: 'sch-3',
    dayOfWeek: 'Thursday',
    startTime: '13:00',
    endTime: '16:00',
    clinicPlace: 'M',
    discipline: 'Oral Surgery / Periodontics Clinic',
    semester: 'Semester 1',
    notes: 'Surgical extractions & Perio referrals',
  },
];

export const INITIAL_PROFILE: StudentProfile = {
  studentName: '',
  studentId: '2101233',
  academicYear: '2026–2027',
  currentSemester: 'Semester 1',
  pointsTarget: 200,
  toothNotation: 'palmer',
};

// Seed initial database if empty or sync updated macro templates
export async function initStorage(): Promise<void> {
  const db = await getDB();
  const existingCount = await db.count('cases');
  if (existingCount === 0) {
    const tx = db.transaction(['cases', 'templates', 'schedules', 'profile'], 'readwrite');
    for (const c of INITIAL_DEMO_CASES) {
      await tx.objectStore('cases').put(c);
    }
    for (const t of DEFAULT_TEMPLATES) {
      await tx.objectStore('templates').put(t);
    }
    for (const s of INITIAL_SCHEDULES) {
      await tx.objectStore('schedules').put(s);
    }
    await tx.objectStore('profile').put(INITIAL_PROFILE);
    await tx.done;
  } else {
    // Sync DEFAULT_TEMPLATES so that newly updated macro-step templates are readily available
    try {
      const tx = db.transaction(['templates'], 'readwrite');
      for (const t of DEFAULT_TEMPLATES) {
        await tx.objectStore('templates').put(t);
      }
      await tx.done;

      // Also ensure case-demo-001 has the new multi-tooth macro procedures if it was from previous demo version
      const demo1 = await db.get('cases', 'case-demo-001');
      if (demo1 && (demo1.procedures.length < 4 || demo1.procedures[0]?.steps[0]?.title?.includes('Pre-op'))) {
        await db.put('cases', INITIAL_DEMO_CASES[0]);
      }
    } catch (err) {
      console.warn('Template sync notice:', err);
    }
  }
}

// Cases CRUD
export async function getAllCases(): Promise<DentalCase[]> {
  const db = await getDB();
  return db.getAll('cases');
}

export async function getCaseById(id: string): Promise<DentalCase | undefined> {
  const db = await getDB();
  return db.get('cases', id);
}

export async function saveCase(dentalCase: DentalCase): Promise<void> {
  const db = await getDB();
  // Auto calculate comprehensive classification
  dentalCase.isComprehensive = computeIsComprehensive(dentalCase.procedures);
  // Auto calculate disciplines present
  dentalCase.disciplines = Array.from(new Set(dentalCase.procedures.map(p => p.discipline)));
  dentalCase.updatedAt = new Date().toISOString();
  await db.put('cases', dentalCase);
}

export async function deleteCase(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('cases', id);
}

// Templates CRUD
export async function getAllTemplates(): Promise<ProcedureTemplate[]> {
  const db = await getDB();
  const stored = await db.getAll('templates');
  const templateMap = new Map<string, ProcedureTemplate>();
  // Pre-fill with DEFAULT_TEMPLATES
  DEFAULT_TEMPLATES.forEach(t => templateMap.set(t.id, t));
  // Overlay any custom or modified templates
  stored.forEach(t => templateMap.set(t.id, t));
  return Array.from(templateMap.values());
}

export async function saveTemplate(template: ProcedureTemplate): Promise<void> {
  const db = await getDB();
  await db.put('templates', template);
}

// Schedules CRUD
export async function getAllSchedules(): Promise<ClinicScheduleItem[]> {
  const db = await getDB();
  return db.getAll('schedules');
}

export async function saveSchedule(item: ClinicScheduleItem): Promise<void> {
  const db = await getDB();
  await db.put('schedules', item);
}

export async function deleteSchedule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('schedules', id);
}

// Student Profile CRUD
export async function getProfile(): Promise<StudentProfile> {
  const db = await getDB();
  const allProfiles = await db.getAll('profile');
  if (allProfiles && allProfiles.length > 0) {
    const profile = allProfiles[0];
    if (profile.studentName === 'Dr. Amir') {
      profile.studentName = '';
      await db.put('profile', profile);
    }
    if (!profile.toothNotation) {
      profile.toothNotation = 'palmer';
    }
    return profile;
  }
  return INITIAL_PROFILE;
}

export async function saveProfile(profile: StudentProfile): Promise<void> {
  const db = await getDB();
  const studentWithId = {
    ...profile,
    studentId: profile.studentId || '2101233',
  };
  await db.put('profile', studentWithId);
}

// Blob / Evidence Files Storage
export async function saveBlob(id: string, fileName: string, fileType: string, dataUrl: string): Promise<void> {
  const db = await getDB();
  await db.put('blobs', {
    id,
    fileName,
    fileType,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  });
}

export async function getBlob(id: string): Promise<{ dataUrl: string; fileName: string; fileType: string } | undefined> {
  const db = await getDB();
  return db.get('blobs', id);
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('blobs', id);
}

// Full Export / Backup & Restore
export async function exportFullBackup(): Promise<string> {
  const db = await getDB();
  const cases = await db.getAll('cases');
  const templates = await db.getAll('templates');
  const schedules = await db.getAll('schedules');
  const profile = await db.getAll('profile');
  const blobs = await db.getAll('blobs');

  const backupData = {
    app: 'DentaTrack',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    cases,
    templates,
    schedules,
    profile,
    blobs,
  };

  return JSON.stringify(backupData, null, 2);
}

export async function restoreFullBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.cases || !Array.isArray(data.cases)) {
      return { success: false, message: 'Invalid backup format: Missing cases dataset.' };
    }

    const db = await getDB();
    const tx = db.transaction(['cases', 'templates', 'schedules', 'profile', 'blobs'], 'readwrite');
    
    // Clear existing
    await tx.objectStore('cases').clear();
    for (const c of data.cases) {
      await tx.objectStore('cases').put(c);
    }
    if (Array.isArray(data.templates)) {
      await tx.objectStore('templates').clear();
      for (const t of data.templates) {
        await tx.objectStore('templates').put(t);
      }
    }
    if (Array.isArray(data.schedules)) {
      await tx.objectStore('schedules').clear();
      for (const s of data.schedules) {
        await tx.objectStore('schedules').put(s);
      }
    }
    if (Array.isArray(data.profile) && data.profile.length > 0) {
      await tx.objectStore('profile').clear();
      for (const p of data.profile) {
        await tx.objectStore('profile').put(p);
      }
    }
    if (Array.isArray(data.blobs)) {
      await tx.objectStore('blobs').clear();
      for (const b of data.blobs) {
        await tx.objectStore('blobs').put(b);
      }
    }

    await tx.done;
    return { success: true, message: `Successfully restored ${data.cases.length} cases and clinical records!` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Error parsing backup: ${msg}` };
  }
}

// Reset to demo data
export async function resetDemoData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['cases', 'templates', 'schedules', 'profile', 'blobs'], 'readwrite');
  await tx.objectStore('cases').clear();
  for (const c of INITIAL_DEMO_CASES) {
    await tx.objectStore('cases').put(c);
  }
  await tx.objectStore('templates').clear();
  for (const t of DEFAULT_TEMPLATES) {
    await tx.objectStore('templates').put(t);
  }
  await tx.objectStore('schedules').clear();
  for (const s of INITIAL_SCHEDULES) {
    await tx.objectStore('schedules').put(s);
  }
  await tx.objectStore('profile').clear();
  await tx.objectStore('profile').put(INITIAL_PROFILE);
  await tx.objectStore('blobs').clear();
  await tx.done;
}

// Complete wipe: Delete all clinical cases, templates, schedules, profile, and files
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['cases', 'templates', 'schedules', 'profile', 'blobs'], 'readwrite');
  await tx.objectStore('cases').clear();
  await tx.objectStore('templates').clear();
  for (const t of DEFAULT_TEMPLATES) {
    await tx.objectStore('templates').put(t);
  }
  await tx.objectStore('schedules').clear();
  await tx.objectStore('profile').clear();
  const blankProfile: StudentProfile = {
    studentName: '',
    studentId: '2101233',
    academicYear: '2026–2027',
    currentSemester: 'Semester 1',
    pointsTarget: 200,
    toothNotation: 'palmer',
  };
  await tx.objectStore('profile').put(blankProfile);
  await tx.objectStore('blobs').clear();
  await tx.done;

  // Clear all local storage keys
  safeLocalStorage.clear();
}

// Aliases and convenience methods
export const getStudentProfile = getProfile;
export const saveStudentProfile = saveProfile;
export const getProcedureTemplates = getAllTemplates;
export const resetToDefaultDemoData = resetDemoData;

export async function getClinicSchedule(): Promise<ClinicScheduleItem[]> {
  return getAllSchedules();
}

export async function saveClinicSchedule(schedules: ClinicScheduleItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('schedules', 'readwrite');
  await tx.objectStore('schedules').clear();
  for (const s of schedules) {
    await tx.objectStore('schedules').put(s);
  }
  await tx.done;
}

export async function exportAllDataBackup(): Promise<void> {
  const json = await exportFullBackup();
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const filename = `DentaTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importDataBackup(jsonString: string): Promise<void> {
  const res = await restoreFullBackup(jsonString);
  if (!res.success) {
    throw new Error(res.message);
  }
}

