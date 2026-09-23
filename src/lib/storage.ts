import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DentalCase, ClinicalProcedure, ProcedureTemplate, ClinicScheduleItem, StudentProfile, DisciplineType } from '../types';
import { safeLocalStorage } from './safeStorage';
import { APP_VERSION } from './patchNotes';
export { safeLocalStorage };

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

// Safe Base64 SVG Encoder for human-readable inline SVG attachments
export function svgToDataUrl(svgMarkup: string): string {
  try {
    const base64 = btoa(unescape(encodeURIComponent(svgMarkup.trim())));
    return `data:image/svg+xml;base64,${base64}`;
  } catch (e) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgMarkup.trim());
  }
}

const DEMO_RUBRIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#f8fafc"/>
  <rect x="25" y="25" width="550" height="550" rx="16" fill="none" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="80" rx="12" fill="#0284c7"/>
  <text x="300" y="70" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">DENTAL CLINICAL EVALUATION</text>
  <rect x="50" y="140" width="500" height="280" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <line x1="50" y1="210" x2="550" y2="210" stroke="#cbd5e1" stroke-width="2"/>
  <line x1="50" y1="280" x2="550" y2="280" stroke="#cbd5e1" stroke-width="2"/>
  <line x1="50" y1="350" x2="550" y2="350" stroke="#cbd5e1" stroke-width="2"/>
  <line x1="380" y1="140" x2="380" y2="420" stroke="#cbd5e1" stroke-width="2"/>
  <text x="70" y="180" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#1e293b">1. Infection Control &amp; Setup</text>
  <text x="465" y="180" font-family="Arial, sans-serif" font-size="15" font-weight="900" fill="#16a34a" text-anchor="middle">EXCELLENT (4/4)</text>
  <text x="70" y="250" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#1e293b">2. Diagnosis &amp; Treatment Plan</text>
  <text x="465" y="250" font-family="Arial, sans-serif" font-size="15" font-weight="900" fill="#16a34a" text-anchor="middle">APPROVED (4/4)</text>
  <text x="70" y="320" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#1e293b">3. Technical Clinical Execution</text>
  <text x="465" y="320" font-family="Arial, sans-serif" font-size="15" font-weight="900" fill="#16a34a" text-anchor="middle">APPROVED (4/4)</text>
  <text x="70" y="390" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#1e293b">4. Patient Management &amp; Ergonomics</text>
  <text x="465" y="390" font-family="Arial, sans-serif" font-size="15" font-weight="900" fill="#16a34a" text-anchor="middle">EXCELLENT (4/4)</text>
  <g transform="translate(420, 440) rotate(-10)">
    <rect x="-10" y="-10" width="160" height="90" rx="8" fill="none" stroke="#ef4444" stroke-width="4" stroke-dasharray="6 3"/>
    <text x="70" y="30" font-family="Arial" font-size="20" font-weight="900" fill="#ef4444" text-anchor="middle">VERIFIED</text>
    <text x="70" y="55" font-family="Arial" font-size="11" font-weight="bold" fill="#ef4444" text-anchor="middle">DR. TAREK HEGAZI</text>
    <text x="70" y="72" font-family="Arial" font-size="9" font-weight="bold" fill="#ef4444" text-anchor="middle">CLINICAL INSTRUCTOR</text>
  </g>
  <text x="60" y="470" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#475569">Signature Date: 2026-09-14</text>
  <text x="60" y="495" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#475569">Verification Code: DT-89A0F7</text>
  <circle cx="100" cy="545" r="20" fill="#f59e0b" opacity="0.8"/>
  <text x="100" y="549" font-family="Arial" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">OK</text>
</svg>`;

const DEMO_XRAY_PREOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#111827"/>
  <rect x="30" y="30" width="540" height="540" rx="24" fill="none" stroke="#374151" stroke-width="6"/>
  <path d="M40,460 Q300,380 560,460 L560,560 L40,560 Z" fill="#1f2937" opacity="0.8"/>
  <g transform="translate(300,300) scale(1.1)">
    <path d="M-80,-60 C-60,-130 -40,-130 -20,-135 C0,-135 20,-135 40,-130 C60,-130 80,-60 80,40 C80,100 70,120 40,160 C30,175 35,210 30,230 Q25,240 15,240 Q5,240 5,210 Q-5,160 -15,160 Q-25,160 -35,210 Q-35,240 -45,240 Q-55,240 -60,230 C-65,210 -60,175 -70,160 C-100,120 -100,100 -80,-60 Z" fill="#4b5563" stroke="#9ca3af" stroke-width="4"/>
    <path d="M-35,-50 C-15,-60 15,-60 35,-50 C25,-10 -25,-10 -35,-50 Z M-25,-10 C-20,30 -25,100 -40,190 Q-25,170 -20,130 C-15,90 -10,30 -10,-10 Z M25,-10 C20,30 25,100 40,190 Q25,170 20,130 C15,90 10,30 10,-10 Z" fill="#111827" stroke="#374151" stroke-width="2"/>
    <path d="M-80,-85 C-50,-80 -40,-105 -75,-115 Z" fill="#111827" stroke="#374151" stroke-width="2" opacity="0.9"/>
  </g>
  <text x="300" y="80" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#f3f4f6" text-anchor="middle" letter-spacing="1">STAGE 1: PRE-OPERATIVE DIAGNOSTIC X-RAY</text>
  <text x="300" y="110" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Tooth #36 • Deep disto-occlusal decay extending near pulp</text>
  <text x="60" y="520" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4b5563">R</text>
  <text x="540" y="520" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4b5563">L</text>
</svg>`;

const DEMO_XRAY_WL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#111827"/>
  <rect x="30" y="30" width="540" height="540" rx="24" fill="none" stroke="#374151" stroke-width="6"/>
  <path d="M40,460 Q300,380 560,460 L560,560 L40,560 Z" fill="#1f2937" opacity="0.8"/>
  <g transform="translate(300,300) scale(1.1)">
    <path d="M-80,-60 C-60,-130 -40,-130 -20,-135 C0,-135 20,-135 40,-130 C60,-130 80,-60 80,40 C80,100 70,120 40,160 C30,175 35,210 30,230 Q25,240 15,240 Q5,240 5,210 Q-5,160 -15,160 Q-25,160 -35,210 Q-35,240 -45,240 Q-55,240 -60,230 C-65,210 -60,175 -70,160 C-100,120 -100,100 -80,-60 Z" fill="#4b5563" stroke="#9ca3af" stroke-width="4"/>
    <path d="M-35,-50 C-15,-60 15,-60 35,-50 C25,-10 -25,-10 -35,-50 Z M-25,-10 C-20,30 -25,100 -40,190 Q-25,170 -20,130 C-15,90 -10,30 -10,-10 Z M25,-10 C20,30 25,100 40,190 Q25,170 20,130 C15,90 10,30 10,-10 Z" fill="#111827" stroke="#374151" stroke-width="2"/>
    <path d="M15,-100 L25,-10 L30,60 L38,205" fill="none" stroke="#facc15" stroke-width="3"/>
    <path d="M-15,-100 L-25,-10 L-25,60 L-40,205" fill="none" stroke="#3b82f6" stroke-width="3"/>
    <rect x="7" y="-125" width="16" height="25" fill="#facc15" rx="2"/>
    <rect x="-23" y="-125" width="16" height="25" fill="#3b82f6" rx="2"/>
  </g>
  <text x="300" y="80" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#f3f4f6" text-anchor="middle" letter-spacing="1">STAGE 2: ESTIMATED WORKING LENGTH</text>
  <text x="300" y="110" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Tooth #36 • ISO Endodontic Files inserted: Mesial 21.0mm, Distal 21.5mm</text>
  <text x="60" y="520" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4b5563">R</text>
  <text x="540" y="520" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4b5563">L</text>
</svg>`;

const DEMO_XRAY_MC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#111827"/>
  <rect x="30" y="30" width="540" height="540" rx="24" fill="none" stroke="#374151" stroke-width="6"/>
  <path d="M40,460 Q300,380 560,460 L560,560 L40,560 Z" fill="#1f2937" opacity="0.8"/>
  <g transform="translate(300,300) scale(1.1)">
    <path d="M-80,-60 C-60,-130 -40,-130 -20,-135 C0,-135 20,-135 40,-130 C60,-130 80,-60 80,40 C80,100 70,120 40,160 C30,175 35,210 30,230 Q25,240 15,240 Q5,240 5,210 Q-5,160 -15,160 Q-25,160 -35,210 Q-35,240 -45,240 Q-55,240 -60,230 C-65,210 -60,175 -70,160 C-100,120 -100,100 -80,-60 Z" fill="#4b5563" stroke="#9ca3af" stroke-width="4"/>
    <path d="M-35,-50 C-15,-60 15,-60 35,-50 C25,-10 -25,-10 -35,-50 Z M-25,-10 C-20,30 -25,100 -40,190 Q-25,170 -20,130 C-15,90 -10,30 -10,-10 Z M25,-10 C20,30 25,100 40,190 Q25,170 20,130 C15,90 10,30 10,-10 Z" fill="#111827" stroke="#374151" stroke-width="2"/>
    <path d="M-23,-2 L-28,95 L-40,198 Q-34,170 -24,130 L-15,-2 Z" fill="#fee2e2" stroke="#ffffff" stroke-width="1.5"/>
    <path d="M23,-2 L28,95 L40,198 Q34,170 24,130 L15,-2 Z" fill="#fee2e2" stroke="#ffffff" stroke-width="1.5"/>
  </g>
  <text x="300" y="80" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#f3f4f6" text-anchor="middle" letter-spacing="1">STAGE 3: MASTER CONE TRY-IN</text>
  <text x="300" y="110" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Tooth #36 • Gutta-Percha master cones fitted at 0.5mm short of apex</text>
  <text x="60" y="520" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4b5563">R</text>
  <text x="540" y="520" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4b5563">L</text>
</svg>`;

const DEMO_XRAY_POSTOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#111827"/>
  <rect x="30" y="30" width="540" height="540" rx="24" fill="none" stroke="#374151" stroke-width="6"/>
  <path d="M40,460 Q300,380 560,460 L560,560 L40,560 Z" fill="#1f2937" opacity="0.8"/>
  <g transform="translate(300,300) scale(1.1)">
    <path d="M-80,-60 C-60,-130 -40,-130 -20,-135 C0,-135 20,-135 40,-130 C60,-130 80,-60 80,40 C80,100 70,120 40,160 C30,175 35,210 30,230 Q25,240 15,240 Q5,240 5,210 Q-5,160 -15,160 Q-25,160 -35,210 Q-35,240 -45,240 Q-55,240 -60,230 C-65,210 -60,175 -70,160 C-100,120 -100,100 -80,-60 Z" fill="#4b5563" stroke="#9ca3af" stroke-width="4"/>
    <path d="M-35,-50 C-15,-60 15,-60 35,-50 C25,-10 -25,-10 -35,-50 Z M-25,-10 C-20,30 -25,100 -40,190 Q-25,170 -20,130 C-15,90 -10,30 -10,-10 Z M25,-10 C20,30 25,100 40,190 Q25,170 20,130 C15,90 10,30 10,-10 Z" fill="#111827" stroke="#374151" stroke-width="2"/>
    <path d="M-30,-40 C-15,-45 15,-45 30,-40 C20,-5 -20,-5 -30,-40 Z" fill="#ffffff"/>
    <path d="M-23,-2 L-28,95 L-40,198 Q-34,170 -24,130 L-15,-2 Z" fill="#ffffff"/>
    <path d="M23,-2 L28,95 L40,198 Q34,170 24,130 L15,-2 Z" fill="#ffffff"/>
    <path d="M-70,-105 Q-10,-95 50,-105 L45,-60 Q-10,-55 -65,-60 Z" fill="#ffffff" stroke="#e4e4e7" stroke-width="1.5"/>
  </g>
  <text x="300" y="80" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#f3f4f6" text-anchor="middle" letter-spacing="1">STAGE 4: OBTURATION &amp; POST-OP SEAL</text>
  <text x="300" y="110" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">Tooth #36 • Complete hermetic obturation &amp; coronal composite seal</text>
  <text x="60" y="520" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4b5563">R</text>
  <text x="540" y="520" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#4b5563">L</text>
</svg>`;

const DEMO_EVIDENCE_PREP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#f1f5f9"/>
  <rect x="25" y="25" width="550" height="550" rx="16" fill="none" stroke="#cbd5e1" stroke-width="4"/>
  <g transform="translate(300, 310) scale(1.2)">
    <path d="M-60,100 Q0,70 60,100 L50,10 L30,-50 Q0,-60 -30,-50 L-50,10 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="4"/>
    <path d="M-60,100 Q0,70 60,100" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="4 2"/>
    <text x="0" y="130" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="#ef4444" text-anchor="middle">1.5mm Chamfer Finish Line</text>
    <path d="M-30,-50 Q0,-60 30,-50" fill="none" stroke="#2563eb" stroke-width="3"/>
    <text x="0" y="-75" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="#2563eb" text-anchor="middle">2.0mm Occlusal Reduction</text>
  </g>
  <text x="300" y="75" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#1e293b" text-anchor="middle" letter-spacing="1">CROWN PREPARATION PROTOCOL</text>
  <text x="300" y="105" font-family="Arial, sans-serif" font-size="14" fill="#475569" text-anchor="middle">Tooth #14 • High definition chamfer reduction check</text>
</svg>`;

// Initial Sample Demo Data with Tooth-based procedures and clean Macro Milestones
const INITIAL_DEMO_CASES: DentalCase[] = [
  {
    id: 'case-demo-001',
    isDemo: true,
    patientName: 'Ahmed El-Sayed (Demo)',
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
            fileDataUrl: svgToDataUrl(DEMO_RUBRIC_SVG),
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
            fileDataUrl: svgToDataUrl(DEMO_EVIDENCE_PREP_SVG),
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
            fileDataUrl: svgToDataUrl(DEMO_EVIDENCE_PREP_SVG),
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
            fileDataUrl: svgToDataUrl(DEMO_RUBRIC_SVG),
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
            fileDataUrl: svgToDataUrl(DEMO_XRAY_PREOP_SVG),
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
            fileDataUrl: svgToDataUrl(DEMO_RUBRIC_SVG),
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
            fileDataUrl: svgToDataUrl(DEMO_RUBRIC_SVG),
            uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          },
        ],
        evidenceFiles: [
          {
            id: 'ev-endo-1',
            caseId: 'case-demo-001',
            procedureId: 'proc-004',
            fileName: 'wl_xray_preop_36.jpg',
            fileType: 'image/jpeg',
            fileSize: 480000,
            category: 'X-Ray',
            fileDataUrl: svgToDataUrl(DEMO_XRAY_PREOP_SVG),
            uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            endoToothNumber: 'Tooth #36',
            endoStage: 'preOp',
          },
          {
            id: 'ev-endo-2',
            caseId: 'case-demo-001',
            procedureId: 'proc-004',
            fileName: 'wl_xray_length_36.jpg',
            fileType: 'image/jpeg',
            fileSize: 480000,
            category: 'X-Ray',
            fileDataUrl: svgToDataUrl(DEMO_XRAY_WL_SVG),
            uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            endoToothNumber: 'Tooth #36',
            endoStage: 'estimatedWorkingLength',
          },
          {
            id: 'ev-endo-3',
            caseId: 'case-demo-001',
            procedureId: 'proc-004',
            fileName: 'wl_xray_mastercone_36.jpg',
            fileType: 'image/jpeg',
            fileSize: 480000,
            category: 'X-Ray',
            fileDataUrl: svgToDataUrl(DEMO_XRAY_MC_SVG),
            uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            endoToothNumber: 'Tooth #36',
            endoStage: 'masterCone',
          },
          {
            id: 'ev-endo-4',
            caseId: 'case-demo-001',
            procedureId: 'proc-004',
            fileName: 'wl_xray_postop_36.jpg',
            fileType: 'image/jpeg',
            fileSize: 480000,
            category: 'X-Ray',
            fileDataUrl: svgToDataUrl(DEMO_XRAY_POSTOP_SVG),
            uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            endoToothNumber: 'Tooth #36',
            endoStage: 'postOp',
          }
        ],
        moodleStatus: 'Not Submitted',
        notes: 'Master cone fit verified with radiograph. Ready for obturation in next clinic appointment.',
      },
    ],
  },
  {
    id: 'case-demo-002',
    isDemo: true,
    patientName: 'Sara Mahmoud (Demo)',
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
            fileDataUrl: svgToDataUrl(DEMO_RUBRIC_SVG),
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
            fileDataUrl: svgToDataUrl(DEMO_EVIDENCE_PREP_SVG),
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
    isDemo: true,
    patientName: 'Mahmoud Hassan (Demo)',
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
            fileDataUrl: svgToDataUrl(DEMO_RUBRIC_SVG),
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
  onboardingCompleted: false,
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

export async function restoreCase(dentalCase: DentalCase): Promise<void> {
  await saveCase(dentalCase);
}

export async function deleteProcedureFromCase(caseId: string, procedureId: string): Promise<DentalCase | null> {
  const dentalCase = await getCaseById(caseId);
  if (!dentalCase) return null;

  const updatedProcedures = dentalCase.procedures.filter(p => p.id !== procedureId);
  const updatedCase: DentalCase = {
    ...dentalCase,
    procedures: updatedProcedures,
    disciplines: Array.from(new Set(updatedProcedures.map(p => p.discipline))),
    isComprehensive: computeIsComprehensive(updatedProcedures),
    updatedAt: new Date().toISOString(),
  };

  await saveCase(updatedCase);
  return updatedCase;
}

export async function restoreProcedureToCase(
  caseId: string, 
  procedure: ClinicalProcedure, 
  originalIndex?: number
): Promise<DentalCase | null> {
  const dentalCase = await getCaseById(caseId);
  if (!dentalCase) return null;

  // Prevent duplicate insertion if already exists
  const existingIndex = dentalCase.procedures.findIndex(p => p.id === procedure.id);
  let updatedProcedures = [...dentalCase.procedures];

  if (existingIndex >= 0) {
    // Replace with the restored snapshot to ensure pristine state
    updatedProcedures[existingIndex] = procedure;
  } else if (typeof originalIndex === 'number' && originalIndex >= 0 && originalIndex <= updatedProcedures.length) {
    // Restore at the exact original index/position
    updatedProcedures.splice(originalIndex, 0, procedure);
  } else {
    updatedProcedures.push(procedure);
  }

  const updatedCase: DentalCase = {
    ...dentalCase,
    procedures: updatedProcedures,
    disciplines: Array.from(new Set(updatedProcedures.map(p => p.discipline))),
    isComprehensive: computeIsComprehensive(updatedProcedures),
    updatedAt: new Date().toISOString(),
  };

  await saveCase(updatedCase);
  return updatedCase;
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
  let profile: StudentProfile;

  if (allProfiles && allProfiles.length > 0) {
    profile = allProfiles[0];
  } else {
    profile = { ...INITIAL_PROFILE };
  }

  // Ensure toothNotation default
  if (!profile.toothNotation) {
    profile.toothNotation = 'palmer';
  }

  // Check and migrate name from safeLocalStorage if missing in DB
  const cachedName = safeLocalStorage.getItem('dentatrack_student_name');
  if ((!profile.studentName || profile.studentName.trim() === '') && cachedName && cachedName.trim() !== '') {
    profile.studentName = cachedName.trim();
    await db.put('profile', profile);
  } else if (profile.studentName && profile.studentName.trim() !== '') {
    // Keep cached name in sync
    safeLocalStorage.setItem('dentatrack_student_name', profile.studentName.trim());
  }

  // Check and migrate onboarding completion flag
  const legacyTutorialShown = safeLocalStorage.getItem('dentatrack_tutorial_shown');
  const cachedOnboarding = safeLocalStorage.getItem('dentatrack_onboarding_completed');
  if (profile.onboardingCompleted === undefined) {
    if (cachedOnboarding === 'true' || legacyTutorialShown === 'true') {
      profile.onboardingCompleted = true;
      safeLocalStorage.setItem('dentatrack_onboarding_completed', 'true');
      await db.put('profile', profile);
    } else {
      profile.onboardingCompleted = false;
    }
  } else if (profile.onboardingCompleted) {
    safeLocalStorage.setItem('dentatrack_onboarding_completed', 'true');
  }

  return profile;
}

export async function saveProfile(profile: StudentProfile): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const studentWithId: StudentProfile = {
    ...profile,
    studentId: profile.studentId || '2101233',
    updatedAt: now,
  };
  await db.put('profile', studentWithId);

  // Authoritative synchronous mirror in safe storage for instant hydration and multi-tab/PWA reliability
  if (profile.studentName && profile.studentName.trim() !== '') {
    safeLocalStorage.setItem('dentatrack_student_name', profile.studentName.trim());
  }
  if (profile.onboardingCompleted) {
    safeLocalStorage.setItem('dentatrack_onboarding_completed', 'true');
    safeLocalStorage.setItem('dentatrack_tutorial_shown', 'true');
  }
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
    version: APP_VERSION,
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
        if (p.studentName && p.studentName.trim() !== '') {
          safeLocalStorage.setItem('dentatrack_student_name', p.studentName.trim());
        }
        if (p.onboardingCompleted) {
          safeLocalStorage.setItem('dentatrack_onboarding_completed', 'true');
          safeLocalStorage.setItem('dentatrack_tutorial_shown', 'true');
        }
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

  // 1. Get all existing cases and filter out the ones that are demo cases
  const allCases = await db.getAll('cases');
  const userCases = allCases.filter((c) => !c.isDemo && !c.id.startsWith('case-demo-'));

  // 2. Clear cases store and write back user cases + fresh INITIAL_DEMO_CASES
  const tx = db.transaction(['cases', 'templates', 'schedules', 'profile'], 'readwrite');
  await tx.objectStore('cases').clear();
  
  // Put back user's real clinical cases
  for (const c of userCases) {
    await tx.objectStore('cases').put(c);
  }
  
  // Insert fresh demo cases
  for (const c of INITIAL_DEMO_CASES) {
    await tx.objectStore('cases').put(c);
  }

  // Preserve templates, schedules, and profile without wiping them!
  // If templates are empty, seed DEFAULT_TEMPLATES
  const templatesStore = tx.objectStore('templates');
  const templatesCount = await templatesStore.count();
  if (templatesCount === 0) {
    for (const t of DEFAULT_TEMPLATES) {
      await templatesStore.put(t);
    }
  }

  // If schedules are empty, seed INITIAL_SCHEDULES
  const schedulesStore = tx.objectStore('schedules');
  const schedulesCount = await schedulesStore.count();
  if (schedulesCount === 0) {
    for (const s of INITIAL_SCHEDULES) {
      await schedulesStore.put(s);
    }
  }

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
    onboardingCompleted: false,
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

