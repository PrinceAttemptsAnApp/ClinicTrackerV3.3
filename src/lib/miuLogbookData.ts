import { ClinicalProcedure, DisciplineType, OfficialRubricDefinition, ProcedureTemplate } from '../types';

export const MIU_LOGBOOK_VERSION = 'MIU-2026-2027-v1';

/**
 * Official Fixed Prosthodontics Cumulative Stage Point Percentages
 * Source: MIU Practical Logbook 2026-2027, Page 6 ("For Evaluation / calculations")
 */
export const FIXED_STAGE_POINT_PERCENTAGES: { stage: string; cumulativePercent: number }[] = [
  { stage: 'Diagnosis & primary alginate & x-ray', cumulativePercent: 15 },
  { stage: 'Preparation & provisional', cumulativePercent: 60 },
  { stage: 'Secondary impression', cumulativePercent: 70 },
  { stage: 'Metal try-in and shade selection', cumulativePercent: 85 },
  { stage: 'Porcelain try-in and / or Delivery', cumulativePercent: 100 },
];

/**
 * Official Evidence & Photography Requirements by Discipline / Sub-type
 * Source: MIU Practical Logbook 2026-2027, Pages 7, 8-9, 10, 11, 33, 36
 */
export const MIU_EVIDENCE_REQUIREMENTS = {
  Perio_NonSurgical: [
    'Baseline evaluation photo with clear appearance to macroanatomy of gingiva',
    'Photo of site of highest attachment loss or probing depth measurement using periodontal probe',
    'Standard bitewing or periapical radiograph for site of highest attachment loss',
    'Full pre-operative Periodontal Chart (and post-op chart after 4 weeks for comprehensive cases, signed by PhD holder with diagnosis rationale)',
    'Oral Hygiene Motivation signed in front of Periodontics instructor',
  ],
  Perio_Surgical: [
    'Baseline and after-control-phase periodontal charts for site of surgery',
    'Fulfillment of periosurgery sheet (steps + instruments used + suturing techniques)',
    'Intra-operative photos of at least 3 steps within surgery + suturing photo',
    '1-month post-operative healing photograph',
    'Periodontist PhD holder approval signature (mandatory prerequisite before surgery)',
  ],
  Operative_Anterior: [
    'Pre-Op: Smiling frontal view, retracted frontal view, retracted lateral views, retracted shade selection view, periapical/panoramic X-ray',
    'Intra-Op: Cavity preparation & rubber dam isolation, matricing, teeth after bonding, composite build-up, finishing & polishing',
    'Post-Op: Smiling frontal view, retracted frontal view, retracted lateral views, retracted shade view, periapical X-ray',
  ],
  Operative_Posterior: [
    'Pre-Op: Occlusal view, occlusal view with articulating paper record, buccal view, periapical & bitewing X-ray(s)',
    'Intra-Op: Cavity preparation & rubber dam isolation, matricing, teeth after bonding, composite build-up, finishing & polishing',
    'Post-Op: Occlusal view, occlusal view with articulating paper record, buccal view, periapical & bitewing X-ray(s)',
  ],
  Operative_Assessment: [
    'Completed Caries Risk Assessment (CAMBRA) form (1 case with 3-month follow-up or 3 cases without follow-up)',
    'Completed Recording of Occlusion diagram (Centric MIP in Blue, Protrusion in Red, Lateral excursion in Green — pre & post treatment)',
  ],
  Endo_RCT: [
    'Intraoral photograph of access cavity preparation',
    'Pre-operative diagnostic periapical radiograph',
    'Working length periapical radiograph (with tooth data: estimating length, working length, reference point, initial file)',
    'Master-cone periapical radiograph (with MAF & Master Apical Cone recorded)',
    'Post-operative obturation periapical radiograph',
  ],
  Endo_Pulpotomy: [
    'Pre-operative periapical radiograph & pulp vitality assessment',
    'Intraoral photograph of access cavity preparation, isolation & hemostasis',
    'Intraoral photograph of MTA placement & adaptation',
    'Post-operative periapical radiograph showing MTA & coronal seal',
  ],
  Removable_General: [
    'Extraoral Photos (eyes hidden by black shading): Full-face at rest & smiling (with & without denture), right & left profile (with & without denture)',
    'Bench Photos: Primary impressions on napkin, secondary impressions on napkin, jaw relation (bite) on casts, try-in on articulator, delivery on napkin',
    'Intraoral Photos: Maxillary & mandibular occlusal views (with & without denture using mirror), frontal & R/L lateral teeth in occlusion',
    'Intraoral Step Photos: Jaw relation (bite) with cheek retractor, try-in with cheek retractor, delivery (frontal with retractor + R/L lateral with mirror)',
  ],
  Removable_Overdenture: [
    'Intraoral photo showing abutment teeth before and after preparation',
    'Pre-operative and post-operative periapical radiographs for the endodontic treatment of abutments',
    'Extraoral & intraoral removable prosthodontics photo series (eyes hidden by black shading)',
  ],
  Fixed_General: [
    'Pre-operative: Two sides retracted view + occlusal view + study model + periapical X-ray',
    'Diagnostic wax-up model photograph',
    'Secondary impression photograph',
    'Metal try-in photograph on cast and intraoral',
    'Post-operative: Two sides retracted view + occlusal view',
    'Signed laboratory sheet(s) and pre/post occlusal analysis',
  ],
};

/**
 * Official MIU 2026-2027 Rubrics Inventory
 * Extracted verbatim from Pages 29-32, 40, 42, and 45-54 of the MIU Practical Logbook
 */
export const OFFICIAL_MIU_RUBRICS: OfficialRubricDefinition[] = [
  // 1. ENDODONTICS — PRACTICAL CLINICAL SESSIONS RUBRIC (Pages 29-30)
  {
    id: 'rubric-miu-endo-rct',
    title: 'Rubric for Practical Clinical Sessions (Endodontics)',
    discipline: 'Endo',
    totalMarks: '20 Marks (Professionalism 1.5 + Patient Management 3.5 + Performance 15)',
    sections: [
      {
        sectionTitle: 'Professionalism',
        sectionMarks: '1.5 Marks',
        criteria: [
          {
            name: 'Adherence to dress code',
            maxMarks: '0.5',
            proper: '0.5: Adheres completely',
            partial: '0.25: Some deviation',
            improper: '0: No adherence',
          },
          {
            name: 'Accepts & acts on feedback',
            maxMarks: '0.5',
            proper: '0.5: Accepts & acts on feedback',
            partial: '0.25: Accepts some feedback',
            improper: '0: Does not accept feedback',
          },
          {
            name: 'Exhibit Courteous & ethical behavior',
            maxMarks: '1.0',
            proper: '1.0: Exhibit excellent behavior with peers & staff',
            partial: '0.5: Exhibit satisfactory behavior with peers & staff',
            improper: '0: Exhibit poor behavior with peers & staff',
          },
        ],
      },
      {
        sectionTitle: 'Patient Management',
        sectionMarks: '3.5 Marks',
        criteria: [
          {
            name: 'Explains the procedure in a simple and clear way',
            maxMarks: '0.5',
            proper: '0.5: Thorough & clear explanation of the procedure',
            partial: '0.25: Insufficient explanation of the procedure',
            improper: '0: Failed to clearly explain the procedure',
          },
          {
            name: 'Proper infection control protocol',
            maxMarks: '0.5',
            proper: '0.5: Proper wrapping and PPE',
            partial: '0.25: Unsatisfactory wrapping and PPE',
            improper: '0: Poor wrapping and PPE',
          },
          {
            name: 'Management of pain and/or anxiety',
            maxMarks: '0.5',
            proper: '0.5: Profound anesthesia and prescription of analgesics',
            partial: '0.25: Inadequate pain and/or anxiety control',
            improper: '0: Anesthesia failure and/or failure to manage anxiety',
          },
          {
            name: 'Time management',
            maxMarks: '0.5',
            proper: '0.5: Completely adheres to assigned procedure time',
            partial: '0.25: Partially adheres to assigned procedure time',
            improper: '0: Fails to adhere to assigned procedure time',
          },
          {
            name: 'Documentation of case',
            maxMarks: '1.0',
            proper: '1.0: All x-rays are present and patient data entry is completed',
            partial: '0.5: Some x-rays are missing or incomplete patient data',
            improper: '0: Most x-rays are missing or most patient data are missing',
          },
          {
            name: 'Demonstrates independence',
            maxMarks: '0.5',
            proper: '0.5: Adequately performs steps explained with minor guidance',
            partial: '0.25: Requires staff assistance only in some steps',
            improper: '0: Completely dependent through all clinical steps',
          },
        ],
      },
      {
        sectionTitle: 'Performance — Access Preparation',
        sectionMarks: '5 Marks',
        criteria: [
          {
            name: 'Outline Form: Shape & Location',
            maxMarks: '2.0',
            proper: '2.0: Correct Shape & Position',
            partial: '1.0: Some Deviations',
            improper: '0: Incorrect Shape & position',
          },
          {
            name: 'Extension',
            maxMarks: '1.0',
            proper: '1.0: Not Over / Under Extended',
            partial: '0.5: Over / Under Extended',
            improper: '0: Gross Over / Under Extended',
          },
          {
            name: 'De-roofing',
            maxMarks: '1.0',
            proper: '1.0: Complete De-roofing',
            partial: '0.5: Incomplete De-roofing',
            improper: '0: No De-roofing',
          },
          {
            name: 'Finishing Cavity Walls',
            maxMarks: '1.0',
            proper: '1.0: Smooth, Flared Wall',
            improper: '0: Rough, Unflared',
          },
        ],
      },
      {
        sectionTitle: 'Performance — Working Length',
        sectionMarks: '1 Mark',
        criteria: [
          {
            name: 'Accurate Working Length',
            maxMarks: '1.0',
            proper: '1.0: Properly Recorded',
            improper: '0: Inaccurate WL',
          },
        ],
      },
      {
        sectionTitle: 'Performance — Cleaning & Shaping',
        sectionMarks: '6 Marks',
        criteria: [
          {
            name: 'Extension of Preparation',
            maxMarks: '1.0',
            proper: '1.0: No Over/Under-Extension',
            partial: '0.5: Under-extended < 2 mm | 0.25: Under-extended > 2 mm',
            improper: '0: Over-extended',
          },
          {
            name: 'Apical Preparation',
            maxMarks: '1.5',
            proper: '1.5: 3 to 4 Sizes after Initial File',
            improper: '0: Inadequate Apical Preparation',
          },
          {
            name: 'Apical Stop',
            maxMarks: '2.5',
            proper: '2.5: Creation of Apical Seat',
            partial: '1.0: Partial Apical Seat',
            improper: '0: Apex violation',
          },
          {
            name: 'Coronal Flaring',
            maxMarks: '1.0',
            proper: '1.0: Adequate Flaring',
            partial: '0.5: Inadequate Flaring',
            improper: '0: No Flaring',
          },
        ],
      },
      {
        sectionTitle: 'Performance — Obturation',
        sectionMarks: '3 Marks',
        criteria: [
          {
            name: 'Master Cone',
            maxMarks: '1.5',
            proper: '1.5: 0.5-1 mm from the radiographic apex',
            partial: '1.0: 1.5-2.5 mm from radiographic apex or 0.5 mm overextended',
            improper: '0: > 2.5 mm from radiographic apex or 1 mm overextended',
          },
          {
            name: 'Canal filling',
            maxMarks: '1.5',
            proper: '1.5: No voids',
            partial: '1.0: Minimal voids',
            improper: '0: Extreme voids',
          },
        ],
      },
    ],
    difficultyModifiers: [
      {
        level: 'Moderate difficulty',
        bonus: '+10%',
        description: 'Moderately curved, narrow canals, difficult isolation, or limited mouth opening',
      },
      {
        level: 'Minimum difficulty',
        bonus: '+5%',
        description: 'Minor curvature, pulp stones, or anxious patient',
      },
      {
        level: 'No difficulty',
        bonus: '0%',
        description: 'Straightforward case',
      },
    ],
    fatalErrors: [
      { error: 'Coronal perforation', deduction: '100% of the access' },
      { error: 'Missed canal', deduction: '100% per canal', remarks: 'Continue steps on the other canals' },
      { error: 'Ledges', deduction: '100% per canal', remarks: 'In apical or middle 1/3 — complete obturation' },
      { error: 'Separated instrument', deduction: '100% per canal' },
      { error: 'Strip perforation', deduction: '100% per canal', remarks: 'Complete obturation' },
    ],
  },

  // 2. ENDODONTICS — VITAL PULP THERAPY RUBRIC (Pages 31-32)
  {
    id: 'rubric-miu-endo-vpt',
    title: 'Rubric For Vital Pulp Therapy',
    discipline: 'Endo',
    totalMarks: '20 Marks (Professionalism 1.5 + Patient Management 3.5 + Performance 15)',
    sections: [
      {
        sectionTitle: 'Professionalism & Patient Management',
        sectionMarks: '5 Marks',
        criteria: [
          {
            name: 'Professionalism (1.5 Marks)',
            proper: 'Dress code (0.5), Accepts feedback (0.5), Courteous & ethical behavior (1.0)',
            partial: 'Partial adherence (0.25 - 0.5)',
            improper: 'No adherence (0)',
          },
          {
            name: 'Patient Management (3.5 Marks)',
            proper: 'Clear explanation (0.5), Infection control & PPE (0.5), Pain/anxiety control (0.5), Time management (0.5), Complete X-rays & data (1.0), Independence (0.5)',
            partial: 'Partial fulfillment',
            improper: 'Failed criteria (0)',
          },
        ],
      },
      {
        sectionTitle: 'Performance — Access Preparation & Isolation',
        sectionMarks: '6 Marks',
        criteria: [
          {
            name: 'Access Preparation (5 Marks)',
            maxMarks: '5.0',
            proper: 'Outline Form: Shape & Location (2), Extension (1), Complete De-roofing (1), Smooth Flared Walls (1)',
            partial: 'Some deviations / incomplete de-roofing',
            improper: 'Incorrect shape, gross over/under-extension, no de-roofing, rough walls',
          },
          {
            name: 'Isolation and field control (1 Mark)',
            maxMarks: '1.0',
            proper: '1.0: Proper isolation & field control',
            improper: '0: Improper field control',
          },
        ],
      },
      {
        sectionTitle: 'Performance — Pulp Status and Hemostasis',
        sectionMarks: '6 Marks',
        criteria: [
          {
            name: 'Pulp vitality status',
            maxMarks: '1.0',
            proper: '1.0: Accurate',
            improper: '0: Inaccurate',
          },
          {
            name: 'Degree of inflammation',
            maxMarks: '1.0',
            proper: '1.0: Accurate',
            improper: '0: Inaccurate',
          },
          {
            name: 'Hemostasis',
            maxMarks: '2.0',
            proper: '2.0: Achieved',
            improper: '0: Improper',
          },
          {
            name: 'Pulp removal',
            maxMarks: '2.0',
            proper: '2.0: Complete removal of inflamed pulp',
            improper: '0: Remnant inflamed pulp',
          },
        ],
      },
      {
        sectionTitle: 'Performance — MTA Application',
        sectionMarks: '3 Marks',
        criteria: [
          {
            name: 'Manipulation',
            maxMarks: '1.5',
            proper: '1.5: Proper mix and application',
            improper: '0: Improper mix and application',
          },
          {
            name: 'Thickness',
            maxMarks: '1.5',
            proper: '1.5: Adequate thickness and adaptation',
            improper: '0: Inadequate thickness and adaptation',
          },
        ],
      },
    ],
  },

  // 3. OPERATIVE / RESTORATIVE — RUBRIC FOR RESTORATIONS EVALUATION (Page 40)
  {
    id: 'rubric-miu-operative-restoration',
    title: 'Rubric for Restorations Evaluation (Restorative Dentistry Department)',
    discipline: 'Operative',
    totalMarks: '100 Marks',
    sections: [
      {
        sectionTitle: 'Professional Skills',
        sectionMarks: '20 Marks',
        criteria: [
          {
            name: 'Infection control Measures',
            maxMarks: '4',
            proper: 'All measures followed (/4)',
            improper: 'No measures taken',
          },
          {
            name: 'Chair Position',
            maxMarks: '3',
            proper: 'Proper chair position (/3)',
            improper: 'Improper chair position',
          },
          {
            name: 'Time Management',
            maxMarks: '3',
            proper: 'Adequately managed (/3)',
            improper: 'Poorly managed',
          },
          {
            name: 'Oral Health Education',
            maxMarks: '3',
            proper: 'Instructions delivered to the patient (/3)',
            improper: 'Instructions not delivered',
          },
          {
            name: 'Communication Skills',
            maxMarks: '3',
            proper: 'Proper communication with staff members, patients and colleagues (/3)',
            improper: 'Improper communication with staff members, patients and colleagues',
          },
          {
            name: 'Type of restoration & justification',
            maxMarks: '4',
            proper: 'Proper selection of restoration (/4)',
            improper: 'Improper selection of restoration',
          },
        ],
      },
      {
        sectionTitle: 'Grading Criteria for Cavity Preparation',
        sectionMarks: 'Proper (7-6) | Partial (5-4) | Improper (<4)',
        criteria: [
          {
            name: 'Outline',
            proper: '7-6: Proper Extension',
            partial: '5-4: Slightly Over/Underextended',
            improper: '<4: Grossly Over/Underextended',
          },
          {
            name: 'Resistance & Retention Forms',
            proper: '7-6: Proper width, depth, cavity wall direction & CSA',
            partial: '5-4: One or more of the items are not present',
            improper: '<4: None of the items are present',
          },
          {
            name: 'Convenience Form',
            proper: '7-6: Cavity can be properly restored',
            partial: '5-4: Difficult to restore',
            improper: '<4: Cannot be restored',
          },
          {
            name: 'Caries Removal & Finishing of Cavity Walls',
            proper: '7-6: Proper adherence to caries removal principles & Proper Roundation',
            partial: '5-4: Partial adherence to caries removal principles & Partial Roundation',
            improper: '<4: No caries removed or iatrogenic pulp exposure & No Roundation',
          },
          {
            name: 'Protection of neighboring tooth & soft tissue',
            proper: '7-6: No damage',
            improper: '<4: Injury present',
          },
        ],
      },
      {
        sectionTitle: 'Grading Criteria for Restoration',
        sectionMarks: 'Proper (7-6) | Partial (5-4) | Improper (<4)',
        criteria: [
          {
            name: 'Isolation',
            proper: '7-6: Adequate isolation',
            partial: '5-4: Leakage present',
            improper: '<4: Contamination occurred',
          },
          {
            name: 'Occlusal Anatomy',
            proper: '7-6: Acceptable cuspal inclines & grooves',
            partial: '5-4: Partially accepted',
            improper: '<4: Poor anatomy',
          },
          {
            name: 'Proximal contact',
            proper: '7-6: Positive contact',
            partial: '5-4: Loose contact',
            improper: '<4: Poor or no contact',
          },
          {
            name: 'Margins',
            proper: '7-6: Non-detectable & no marginal flashes',
            partial: '5-4: Partial marginal ditch or some flashes',
            improper: '<4: Open margins or significant flashes around the margin',
          },
          {
            name: 'Occlusion, Finishing & polishing',
            proper: '7-6: Homogenous occlusal contacts & Lustrous Surface',
            partial: '5-4: Adjustable discrepancy & Finished not polished',
            improper: '<4: Major discrepancy & Rough Surface',
          },
        ],
      },
    ],
  },

  // 4. PERIODONTICS — RUBRIC FOR PERIODONTOLOGY CASES (Page 42)
  {
    id: 'rubric-miu-perio',
    title: 'Rubric for Periodontology Cases',
    discipline: 'Perio',
    totalMarks: '70 Marks (7 Categories × 10 Marks each)',
    sections: [
      {
        sectionTitle: 'Periodontal Clinical Evaluation (Each Category /10 Marks)',
        sectionMarks: '70 Marks',
        criteria: [
          {
            name: '1. Position (Dentist & Patient)',
            maxMarks: '10',
            proper: 'Very good (7.5-10): Optimal dentist & patient positioning',
            partial: 'Satisfactory (5-7.5) | Borderline (2.5-5)',
            improper: 'Unsatisfactory (0-2.5)',
          },
          {
            name: '2. Instrument (Selection, Grasp & support, Adaptation & angulation, Pressure & stroke)',
            maxMarks: '10',
            proper: 'Very good (7.5-10): Proper selection, grasp, adaptation, angulation & stroke',
            partial: 'Satisfactory (5-7.5) | Borderline (2.5-5)',
            improper: 'Unsatisfactory (0-2.5)',
          },
          {
            name: '3. Periodontal examination (Gingival criteria & Charting)',
            maxMarks: '10',
            proper: 'Very good (7.5-10): Accurate gingival assessment & complete charting',
            partial: 'Satisfactory (5-7.5) | Borderline (2.5-5)',
            improper: 'Unsatisfactory (0-2.5)',
          },
          {
            name: '4. Finalization of scaling (Supragingival & Subgingival)',
            maxMarks: '10',
            proper: 'Very good (7.5-10): Complete calculus/plaque removal supra- and subgingivally',
            partial: 'Satisfactory (5-7.5) | Borderline (2.5-5)',
            improper: 'Unsatisfactory (0-2.5)',
          },
          {
            name: '5. Infection control',
            maxMarks: '10',
            proper: 'Very good (7.5-10): Strict adherence to infection control',
            partial: 'Satisfactory (5-7.5) | Borderline (2.5-5)',
            improper: 'Unsatisfactory (0-2.5)',
          },
          {
            name: '6. Diagnostic sheet & treatment planning',
            maxMarks: '10',
            proper: 'Very good (7.5-10): Complete diagnostic sheet & rationale',
            partial: 'Satisfactory (5-7.5) | Borderline (2.5-5)',
            improper: 'Unsatisfactory (0-2.5)',
          },
          {
            name: '7. Patient management & communication (Build relationship, Gather info, Understand perspective, Shares info)',
            maxMarks: '10',
            proper: 'Very good (7.5-10): Excellent communication & oral hygiene motivation',
            partial: 'Satisfactory (5-7.5) | Borderline (2.5-5)',
            improper: 'Unsatisfactory (0-2.5)',
          },
        ],
      },
    ],
  },

  // 5. REMOVABLE PROSTHODONTICS — PRIMARY IMPRESSION RUBRIC (Pages 45-46)
  {
    id: 'rubric-miu-removable-primary-imp',
    title: 'Rubric for Primary Impression (Self-assessment) 2026-2027',
    discipline: 'Removable',
    totalMarks: '20 Marks (Mandibular /10 + Maxillary /10)',
    sections: [
      {
        sectionTitle: 'Primary Impression for Partially Edentulous Patients',
        sectionMarks: '10 Marks per Arch',
        criteria: [
          {
            name: 'Borders (4 Marks)',
            maxMarks: '4',
            proper: 'Peripheral extension reproduces functional vestibule depth & width; borders not too thick/thin; records frena; smooth & rounded; completely supported peripheral roll',
            partial: 'Some borders over/under-extended; partial thickness issues; some frena recorded; partially supported roll',
            improper: 'All borders over/under-extended; too thick/thin; no frena reproduction; rough & irregular; unsupported peripheral roll',
          },
          {
            name: 'Fitting Surface (3 Marks)',
            maxMarks: '3',
            proper: 'No voids; no pressure areas; no deficient parts',
            partial: 'Three or fewer voids < 5 mm; 1-2 pressure areas in non-critical areas; deficient part in non-critical areas',
            improper: 'Four+ voids < 5 mm or one void >= 5 mm; pressure areas in critical areas; deficient parts in critical areas',
          },
          {
            name: 'Distal extension (1 Mark)',
            maxMarks: '1',
            proper: 'Distal border covers maxillary tuberosity in upper and retromolar pad in lower',
            partial: 'Covers maxillary tuberosity or retromolar pad in one side only',
            improper: 'Does not cover maxillary tuberosity or retromolar pad in both sides',
          },
          {
            name: 'Centralization (1 Mark)',
            maxMarks: '1',
            proper: 'Centralized',
            partial: 'Partially centralized',
            improper: 'Uncentralized',
          },
          {
            name: 'Impression material (1 Mark)',
            maxMarks: '1',
            proper: 'Impression mix has homogenous color and uniform thickness',
            partial: 'Too thick or too thin impression material OR not well mixed',
            improper: 'Too thick or too thin impression material AND not well mixed',
          },
        ],
      },
    ],
    difficultyModifiers: [
      {
        level: 'Moderate Difficulty',
        bonus: '+10%',
        description: 'Abnormal ridge condition (flat/flabby/irregular/undercut), limited mouth opening, tongue tie, hearing problem, poor neuromuscular coordination, gagging',
      },
      {
        level: 'Minimum Difficulty',
        bonus: '+5%',
        description: 'Mild anatomical or patient management challenges',
      },
    ],
    fatalErrors: [
      { error: 'Using stock tray of opposing arch', deduction: '-50% to -75%' },
      { error: 'Wash impression', deduction: '-50% to -75%' },
    ],
  },

  // 6. REMOVABLE PROSTHODONTICS — SECONDARY IMPRESSION RUBRIC (Pages 47-48)
  {
    id: 'rubric-miu-removable-secondary-imp',
    title: 'Rubric for Secondary Impression (Self-assessment) 2026-2027',
    discipline: 'Removable',
    totalMarks: '20 Marks (Mandibular /10 + Maxillary /10)',
    sections: [
      {
        sectionTitle: 'Final Impression for Partially Edentulous Arches',
        sectionMarks: '10 Marks per Arch',
        criteria: [
          {
            name: 'Borders (4 Marks)',
            maxMarks: '4',
            proper: 'Peripheral extension reproduces functional vestibule (depth & width); completely supported peripheral roll; borders record frena; borders smooth & rounded',
            partial: 'Some borders over/under-extended; partially supported peripheral roll; some frena recorded',
            improper: 'All borders over/under-extended; unsupported peripheral roll; no reproduction of frena; rough & irregular',
          },
          {
            name: 'Impression material (1 Mark)',
            maxMarks: '1',
            proper: 'Homogenous color and uniform thickness',
            partial: 'Too thick/thin OR not well mixed',
            improper: 'Too thick/thin AND not well mixed',
          },
          {
            name: 'Fitting Surface (3 Marks)',
            maxMarks: '3',
            proper: 'No voids; no pressure areas; no deficient parts',
            partial: '<= 3 voids < 5 mm; 1-2 pressure areas in non-critical areas; deficient part in non-critical areas',
            improper: '>= 4 voids < 5 mm or void >= 5 mm; pressure/deficient areas in critical areas',
          },
          {
            name: 'Distal extension (1 Mark)',
            maxMarks: '1',
            proper: 'Covers maxillary tuberosity in upper and retromolar pad in lower',
            partial: 'Covers tuberosity or retromolar pad on one side only',
            improper: 'Does not cover tuberosity or retromolar pad on both sides',
          },
          {
            name: 'Centralization (1 Mark)',
            maxMarks: '1',
            proper: 'Centralized',
            partial: 'Partially centralized',
            improper: 'Not centralized',
          },
        ],
      },
    ],
    difficultyModifiers: [
      {
        level: 'Moderate Difficulty',
        bonus: '+10%',
        description: 'Abnormal ridge condition (flat/flabby/irregular/undercut), limited mouth opening, tongue tie, hearing problem, poor neuromuscular coordination, gagging',
      },
      {
        level: 'Minimum Difficulty',
        bonus: '+5%',
        description: 'Mild ridge or patient management difficulty',
      },
    ],
    fatalErrors: [
      { error: 'Wrong selection of impression material', deduction: '-50% to -75%' },
      { error: 'Making localized or uneven wash impression', deduction: '-50% to -75%' },
    ],
  },

  // 7. REMOVABLE PROSTHODONTICS — JAW RELATION RUBRIC (Page 49)
  {
    id: 'rubric-miu-removable-jaw-relation',
    title: 'Rubric for Jaw Relation (Edentulous Patients)',
    discipline: 'Removable',
    totalMarks: '10 Marks',
    sections: [
      {
        sectionTitle: 'Jaw Relation Record for Edentulous Patients',
        sectionMarks: '10 Marks',
        criteria: [
          {
            name: 'Record Base Extensions and Thickness',
            maxMarks: '1',
            proper: '1: All borders of denture base have proper extension and thickness',
            partial: '0.5: Some borders have proper extension and thickness',
            improper: '0: Borders are overextended or underextended',
          },
          {
            name: 'Maxillary Wax Rim Height',
            maxMarks: '2',
            proper: '2: Proper Height (2 mm wax appear from lips in maxillary wax rim)',
            partial: '1: Needs modification',
            improper: '0: Underextended / overextended',
          },
          {
            name: 'Facial Contour & Lip Support',
            maxMarks: '2',
            proper: '2: Properly supported',
            partial: '1: Needs modification',
            improper: '0: Over-contoured / under-contoured',
          },
          {
            name: 'Orientation of Occlusal plane',
            maxMarks: '1',
            proper: '1: Properly oriented',
            partial: '0.5: Needs modification',
            improper: '0: Wrong orientation',
          },
          {
            name: 'Vertical Dimension of Occlusion (V.D.O)',
            maxMarks: '2',
            proper: '2: Properly adjusted',
            partial: '1: Needs modification',
            improper: '0: High / low vertical dimension',
          },
          {
            name: 'Centric Relation Registration',
            maxMarks: '2',
            proper: '2: Properly recorded',
            partial: '1: Needs modification',
            improper: '0: Not recorded in centric',
          },
        ],
      },
    ],
  },

  // 8. REMOVABLE PROSTHODONTICS — TRY-IN RUBRIC (Pages 50-52)
  {
    id: 'rubric-miu-removable-try-in',
    title: 'Rubric for Try-in for Edentulous Patients',
    discipline: 'Removable',
    totalMarks: '15 Marks (Extraoral /5 + Intraoral Separate /6 + Intraoral Together /4)',
    sections: [
      {
        sectionTitle: 'Procedure 1: Checking trial denture bases on articulator (Extraoral)',
        sectionMarks: '5 Marks',
        criteria: [
          { name: 'a. Mounting rings secured', maxMarks: '1', proper: 'Secured', improper: 'Not secured' },
          { name: 'b. Incisal pin in place', maxMarks: '1', proper: 'Touching the incisal table', improper: 'Not touching' },
          { name: 'c. Wax spots on casts', maxMarks: '1', proper: 'Absence', improper: 'Presence' },
          { name: 'd. Trial denture bases stability on casts', maxMarks: '1', proper: 'Stable', partial: 'Needs modification', improper: 'Unstable' },
          { name: 'e. Intercuspation of teeth', maxMarks: '1', proper: 'Maximum intercuspation', partial: 'Needs modification', improper: 'Improper intercuspation' },
        ],
      },
      {
        sectionTitle: 'Procedure 2: Examination of trial denture bases in mouth separately (Intraoral)',
        sectionMarks: '6 Marks',
        criteria: [
          { name: 'a. Check occlusal plane', maxMarks: '1', proper: 'Properly oriented', partial: 'Needs modification', improper: 'Improperly oriented' },
          { name: 'b. Peripheral outline', maxMarks: '1', proper: 'Properly extended', partial: 'Needs modification', improper: 'Improperly extended' },
          { name: 'c. Retention', maxMarks: '1', proper: 'Retentive', partial: 'Needs modification', improper: 'Not retentive' },
          { name: 'd. Stability under occlusal stresses', maxMarks: '1', proper: 'Stable', partial: 'Needs modification', improper: 'Not stable' },
          { name: 'e. Tongue space', maxMarks: '1', proper: 'Not Cramped', partial: 'Needs modification', improper: 'Cramped' },
          { name: 'f. Height of occlusal plane', maxMarks: '1', proper: 'Upper: 2 mm of teeth appear; Lower: under level of tongue', partial: 'Needs modification', improper: 'Improper height of occlusal plane' },
        ],
      },
      {
        sectionTitle: 'Procedure 3: Examination of trial denture bases together (Intraoral)',
        sectionMarks: '4 Marks',
        criteria: [
          { name: 'a. Occlusion', maxMarks: '2', proper: 'Even occlusal pressure (bilaterally), occluded in centric relation', partial: 'Needs adjustment', improper: 'Uneven pressure / wrong centric' },
          { name: 'b. Appearance', maxMarks: '2', proper: 'Proper selection and setting of teeth', partial: 'Needs modification', improper: 'Improper selection and setting of teeth' },
        ],
      },
    ],
  },

  // 9. REMOVABLE PROSTHODONTICS — DELIVERY RUBRIC (Pages 53-54)
  {
    id: 'rubric-miu-removable-delivery',
    title: 'Rubric for Delivery (Self-assessment) 2026-2027',
    discipline: 'Removable',
    totalMarks: '36 Marks (Mandibular /18 + Maxillary /18)',
    sections: [
      {
        sectionTitle: 'Evaluation Extra-orally (Examination of Finished Dentures)',
        criteria: [
          { name: 'Polished surface', proper: 'Polished surface is smooth', partial: 'Some polished surfaces are smooth and rounded', improper: 'All polished surfaces are rough and irregular' },
          { name: 'Denture flanges', proper: 'No sharp angles and not too thick', partial: 'Partial sharp angles, too thick or too thin borders', improper: 'Too thick or too thin borders, flanges with sharp angles' },
          { name: 'Denture borders', proper: 'Rounded and smooth with no obvious overextension', partial: 'Some borders are smooth and rounded', improper: 'All borders are rough and irregular with overextension' },
        ],
      },
      {
        sectionTitle: 'Evaluation Intra-orally & Selective Grinding',
        criteria: [
          { name: 'Checking peripheral extension', proper: 'Rounded and smooth with no obvious overextension', partial: 'Some borders are rough, irregular and overextension', improper: 'All borders rough, irregular and overextension' },
          { name: 'Elimination of fitting surface errors', proper: 'Fitting surface has no pressure areas', partial: '1-2 pressure areas in non-critical areas', improper: 'Pressure areas in critical areas' },
          { name: 'Retention & Stability of denture (Upper & Lower)', proper: 'Retentive and stable in upper and lower arches', partial: 'Needs modification in upper or lower arch', improper: 'Not retentive / not stable' },
          { name: 'Centric Relation & Vertical Dimension', proper: 'Finished dentures exhibit correct Centric Relation and Vertical Dimension', partial: 'CR difference <= 1/4 cusp; VD slightly high', improper: 'Gross CR error (wrong centric); VD markedly high' },
          { name: 'Esthetics & Harmony of Occlusion (Selective grinding)', proper: 'Proper tooth arrangement; bilateral uniform harmonious occlusal contact in centric and eccentric', partial: 'Few premature contacts in centric/eccentric', improper: 'Multiple premature occlusal contacts' },
        ],
      },
      {
        sectionTitle: 'Instructions to Patients Receiving Complete Dentures',
        criteria: [
          { name: 'Patient Instructions (Eating, Cleaning, Wearing at night, Talking, Pain & soreness)', proper: 'All 5 instruction areas given thoroughly', partial: 'Missed 1 or 2 points', improper: 'Missed all points' },
        ],
      },
    ],
  },

  // 10. FIXED PROSTHODONTICS — EVALUATION & STAGE WEIGHTING (Page 6 & Pages 36-39)
  {
    id: 'rubric-miu-fixed',
    title: 'Fixed Prosthodontics Clinical Evaluation & Stage Weighting',
    discipline: 'Fixed',
    totalMarks: '100% Cumulative Stage Points',
    sections: [
      {
        sectionTitle: 'Official Cumulative Stage Point Calculation (Page 6)',
        sectionMarks: '100%',
        criteria: [
          { name: 'Step 1: Diagnosis & primary alginate & x-ray', maxMarks: '15%', proper: 'Complete diagnostic records, study cast & pre-op periapical radiograph (15% of points)', improper: 'Missing pre-op radiograph or study cast' },
          { name: 'Step 2: Preparation & provisional', maxMarks: '60%', proper: 'Abutment/crown preparation approved & provisional restoration cemented (reaches 60% of points)', improper: 'Undercuts, over-taper, or unsealed provisional' },
          { name: 'Step 3: Secondary impression', maxMarks: '70%', proper: 'Full-arch elastomeric impression capturing 360° finish line & beyond (reaches 70% of points)', improper: 'Voids/tears on finish line' },
          { name: 'Step 4: Metal try-in and shade selection', maxMarks: '85%', proper: 'Passive marginal fit verified on cast & intraorally + shade selected (reaches 85% of points)', improper: 'Open/rocking framework margin' },
          { name: 'Step 5: Porcelain try-in and / or Delivery', maxMarks: '100%', proper: 'Proximal contacts, marginal integrity & occlusion verified; definitive cementation (100% of points)', improper: 'High occlusion or open margin' },
        ],
      },
    ],
  },
];

/**
 * Resolves the relevant Official MIU Rubric definitions for a given procedure or template
 */
export function getOfficialRubricsForProcedure(
  discipline: DisciplineType,
  titleOrTemplateName: string = ''
): OfficialRubricDefinition[] {
  const lower = titleOrTemplateName.toLowerCase();

  if (discipline === 'Endo') {
    if (lower.includes('pulpotomy') || lower.includes('vital pulp') || lower.includes('mta')) {
      return OFFICIAL_MIU_RUBRICS.filter((r) => r.id === 'rubric-miu-endo-vpt');
    }
    return OFFICIAL_MIU_RUBRICS.filter((r) => r.id === 'rubric-miu-endo-rct');
  }

  if (discipline === 'Operative') {
    return OFFICIAL_MIU_RUBRICS.filter((r) => r.id === 'rubric-miu-operative-restoration');
  }

  if (discipline === 'Perio') {
    return OFFICIAL_MIU_RUBRICS.filter((r) => r.id === 'rubric-miu-perio');
  }

  if (discipline === 'Removable') {
    return OFFICIAL_MIU_RUBRICS.filter((r) => r.discipline === 'Removable');
  }

  if (discipline === 'Fixed') {
    return OFFICIAL_MIU_RUBRICS.filter((r) => r.id === 'rubric-miu-fixed');
  }

  return [];
}

/**
 * Resolves the official MIU required evidence & photography checklist for a procedure
 */
export function getEvidenceRequirementsForProcedure(
  procedureOrTemplate: Pick<ClinicalProcedure, 'discipline' | 'title'> | ProcedureTemplate
): string[] {
  if ('evidenceRequirements' in procedureOrTemplate && Array.isArray(procedureOrTemplate.evidenceRequirements) && procedureOrTemplate.evidenceRequirements.length > 0) {
    return procedureOrTemplate.evidenceRequirements;
  }

  const discipline = procedureOrTemplate.discipline;
  const title = ('title' in procedureOrTemplate ? procedureOrTemplate.title : procedureOrTemplate.name).toLowerCase();

  if (discipline === 'Perio') {
    if (
      title.includes('gingivectomy') ||
      title.includes('crown lengthening') ||
      title.includes('flap') ||
      title.includes('regeneration') ||
      title.includes('depigmentation') ||
      title.includes('augmentation') ||
      title.includes('surgery')
    ) {
      return MIU_EVIDENCE_REQUIREMENTS.Perio_Surgical;
    }
    return MIU_EVIDENCE_REQUIREMENTS.Perio_NonSurgical;
  }

  if (discipline === 'Operative') {
    if (title.includes('caries risk') || title.includes('occlusal assessment')) {
      return MIU_EVIDENCE_REQUIREMENTS.Operative_Assessment;
    }
    if (title.includes('class iii') || title.includes('class iv') || title.includes('anterior')) {
      return MIU_EVIDENCE_REQUIREMENTS.Operative_Anterior;
    }
    return MIU_EVIDENCE_REQUIREMENTS.Operative_Posterior;
  }

  if (discipline === 'Endo') {
    if (title.includes('pulpotomy') || title.includes('vital pulp')) {
      return MIU_EVIDENCE_REQUIREMENTS.Endo_Pulpotomy;
    }
    return MIU_EVIDENCE_REQUIREMENTS.Endo_RCT;
  }

  if (discipline === 'Removable') {
    if (title.includes('overdenture') || title.includes('over denture')) {
      return MIU_EVIDENCE_REQUIREMENTS.Removable_Overdenture;
    }
    return MIU_EVIDENCE_REQUIREMENTS.Removable_General;
  }

  if (discipline === 'Fixed') {
    return MIU_EVIDENCE_REQUIREMENTS.Fixed_General;
  }

  return [];
}

/**
 * Computes the official MIU Fixed Prosthodontics cumulative stage point percentage
 * based on completed procedure steps (Page 6: 15% -> 60% -> 70% -> 85% -> 100%).
 */
export function calculateFixedStagePoints(procedure: ClinicalProcedure): {
  cumulativePercent: number;
  earnedPoints: number;
  totalPoints: number;
  currentStageLabel: string;
} {
  const totalPoints = procedure.points || 15;
  const steps = procedure.steps || [];
  if (steps.length === 0) {
    return {
      cumulativePercent: 0,
      earnedPoints: 0,
      totalPoints,
      currentStageLabel: 'Not started (0%)',
    };
  }

  // Find highest completed step index
  let lastCompletedIdx = -1;
  steps.forEach((s, idx) => {
    if (s.isCompleted) lastCompletedIdx = idx;
  });

  if (lastCompletedIdx < 0) {
    return {
      cumulativePercent: 0,
      earnedPoints: 0,
      totalPoints,
      currentStageLabel: 'Not started (0%)',
    };
  }

  // If all steps completed -> 100%
  if (steps.every((s) => s.isCompleted)) {
    return {
      cumulativePercent: 100,
      earnedPoints: totalPoints,
      totalPoints,
      currentStageLabel: 'Porcelain try-in and / or Delivery (100%)',
    };
  }

  // Map 5-step or 6-step Fixed workflow onto the 5 official MIU cumulative percentages
  const lastTitle = steps[lastCompletedIdx].title.toLowerCase();
  let cumulativePercent = 15;
  let currentStageLabel = FIXED_STAGE_POINT_PERCENTAGES[0].stage;

  if (lastTitle.includes('delivery') || lastTitle.includes('cementation') || lastTitle.includes('porcelain')) {
    cumulativePercent = 100;
    currentStageLabel = FIXED_STAGE_POINT_PERCENTAGES[4].stage;
  } else if (lastTitle.includes('try-in') || lastTitle.includes('shade') || lastTitle.includes('metal') || lastTitle.includes('framework')) {
    cumulativePercent = 85;
    currentStageLabel = FIXED_STAGE_POINT_PERCENTAGES[3].stage;
  } else if (lastTitle.includes('secondary impression') || lastTitle.includes('final impression') || lastTitle.includes('elastomeric')) {
    cumulativePercent = 70;
    currentStageLabel = FIXED_STAGE_POINT_PERCENTAGES[2].stage;
  } else if (
    lastTitle.includes('preparation') ||
    lastTitle.includes('reduction') ||
    lastTitle.includes('provisional') ||
    lastTitle.includes('temporary') ||
    lastTitle.includes('core') ||
    lastTitle.includes('butt')
  ) {
    cumulativePercent = 60;
    currentStageLabel = FIXED_STAGE_POINT_PERCENTAGES[1].stage;
  } else if (
    lastTitle.includes('diagnosis') ||
    lastTitle.includes('alginate') ||
    lastTitle.includes('index') ||
    lastTitle.includes('mock-up') ||
    lastTitle.includes('x-ray')
  ) {
    cumulativePercent = 15;
    currentStageLabel = FIXED_STAGE_POINT_PERCENTAGES[0].stage;
  } else {
    // Fallback proportional mapping to FIXED_STAGE_POINT_PERCENTAGES
    const mappedIdx = Math.min(
      FIXED_STAGE_POINT_PERCENTAGES.length - 1,
      Math.floor(((lastCompletedIdx + 1) / steps.length) * FIXED_STAGE_POINT_PERCENTAGES.length)
    );
    cumulativePercent = FIXED_STAGE_POINT_PERCENTAGES[mappedIdx].cumulativePercent;
    currentStageLabel = FIXED_STAGE_POINT_PERCENTAGES[mappedIdx].stage;
  }

  const earnedPoints = Math.round(((totalPoints * cumulativePercent) / 100) * 10) / 10;

  return {
    cumulativePercent,
    earnedPoints,
    totalPoints,
    currentStageLabel: `${currentStageLabel} (${cumulativePercent}%)`,
  };
}

/**
 * Authoritative MIU 2026–2027 Clinical Comprehensive Care Practical Logbook Procedure Templates.
 * Preserves all existing DentaTrack template IDs while enriching them and adding the complete
 * MIU logbook procedures, categories, point values, difficulty modifiers, rubric titles,
 * Fixed Prosthodontics cumulative stage weightings, and required clinical evidence checklists.
 */
export const MIU_OFFICIAL_TEMPLATES: ProcedureTemplate[] = [
  // ================= FIXED PROSTHODONTICS (MIU Logbook Pages 6, 11, 36–39) =================
  {
    id: 'tmpl-fixed-single-crown',
    discipline: 'Fixed',
    name: 'Single Fixed Crown (PFM / All-Ceramic / Zirconia)',
    category: 'Crown & Bridge',
    difficulty: 'Standard (Stage-Weighted: 15%→60%→70%→85%→100%)',
    rubricTitle: 'Fixed Prosthodontics Clinical Evaluation & Stage Weighting',
    defaultPoints: 15,
    defaultSteps: [
      'Diagnosis & primary alginate & x-ray (15%)',
      'Preparation & provisional (60%)',
      'Secondary impression (70%)',
      'Metal try-in and shade selection (85%)',
      'Porcelain try-in and / or Delivery (100%)',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Fixed_General,
    stagePointPercentages: FIXED_STAGE_POINT_PERCENTAGES,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 6, 11, 36–39',
    pointSystemType: 'FIXED_STAGE_PERCENT',
    pointSystemDescription: 'Page 6 Stage Percentages: 15% Diagnosis -> 60% Prep/Provisional -> 70% Impression -> 85% Metal Try-in -> 100% Delivery',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-fixed-bridge',
    discipline: 'Fixed',
    name: 'Fixed Partial Denture (3-Unit Bridge)',
    category: 'Crown & Bridge',
    difficulty: 'Moderate / Complex (Stage-Weighted: 15%→60%→70%→85%→100%)',
    rubricTitle: 'Fixed Prosthodontics Clinical Evaluation & Stage Weighting',
    defaultPoints: 25,
    defaultSteps: [
      'Diagnosis & primary alginate & x-ray (15%)',
      'Abutment preparation & provisional bridge (60%)',
      'Secondary impression & bite registration (70%)',
      'Metal / framework try-in and shade selection (85%)',
      'Porcelain try-in and / or Delivery (100%)',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Fixed_General,
    stagePointPercentages: FIXED_STAGE_POINT_PERCENTAGES,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 6, 11, 36–39',
    pointSystemType: 'FIXED_STAGE_PERCENT',
    pointSystemDescription: 'Page 6 Stage Percentages: 15% Diagnosis -> 60% Prep/Provisional -> 70% Impression -> 85% Metal Try-in -> 100% Delivery',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-fixed-post-core',
    discipline: 'Fixed',
    name: 'Post & Core Restoration (Fiber Post / Custom Cast Post)',
    category: 'Foundation Restoration',
    difficulty: 'Standard / Moderate',
    rubricTitle: 'Fixed Prosthodontics Clinical Evaluation & Stage Weighting',
    defaultPoints: 12,
    defaultSteps: [
      'Pre-op periapical X-ray & gutta-percha de-obturation (preserving 4-5mm apical seal)',
      'Post space preparation & post try-in radiograph',
      'Post cementation & composite core build-up',
      'Core finish line refinement & post-op radiograph',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Fixed_General,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Page 11 (Fixed Requirement Sheet)',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Explicit procedure requirement on Page 11; unit tracking points inferred for app tracking',
    isComprehensiveCoreDiscipline: true,
  },

  // ================= OPERATIVE / RESTORATIVE DENTISTRY (MIU Logbook Pages 8–9, 12–28, 40) =================
  {
    id: 'tmpl-operative-class1',
    discipline: 'Operative',
    name: 'Class I Composite Restoration (Occlusal)',
    category: 'Direct Posterior Restoration',
    difficulty: 'Simple (100 Marks Rubric)',
    rubricTitle: 'Rubric for Restorations Evaluation (Restorative Dentistry Department)',
    defaultPoints: 6,
    defaultSteps: [
      'Pre-op occlusal photo, articulating paper record & periapical/bitewing X-ray',
      'Rubber dam isolation & Class I cavity preparation (Caries removal & wall finishing)',
      'Etching, bonding & anatomical composite build-up',
      'Occlusal adjustment with articulating paper, finishing & polishing',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Operative_Posterior,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 8–9, 12–28, 40',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Restorative Department Evaluation Rubric is out of 100 marks. Application tracking points (6 pts) are inferred for semester unit tracking.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-operative-class2',
    discipline: 'Operative',
    name: 'Class II Composite Restoration (Posterior Proximal)',
    category: 'Direct Posterior Restoration',
    difficulty: 'Moderate (100 Marks Rubric)',
    rubricTitle: 'Rubric for Restorations Evaluation (Restorative Dentistry Department)',
    defaultPoints: 8,
    defaultSteps: [
      'Pre-op occlusal/buccal photos, articulating paper record & periapical/bitewing X-ray',
      'Rubber dam isolation & Class II cavity preparation (Outline, Resistance/Retention, Caries removal)',
      'Sectional matrix band & wedge adaptation',
      'Adhesive bonding & incremental composite build-up',
      'Occlusion check with articulating paper, finishing & high-luster polishing',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Operative_Posterior,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 8–9, 12–28, 40',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Restorative Department Evaluation Rubric is out of 100 marks. Application tracking points (8 pts) are inferred for semester unit tracking.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-operative-class3',
    discipline: 'Operative',
    name: 'Class III Anterior Composite Restoration',
    category: 'Direct Anterior Esthetic Restoration',
    difficulty: 'Moderate (100 Marks Rubric)',
    rubricTitle: 'Rubric for Restorations Evaluation (Restorative Dentistry Department)',
    defaultPoints: 8,
    defaultSteps: [
      'Pre-op smiling/retracted frontal & lateral photos, shade selection photo & periapical X-ray',
      'Rubber dam isolation, Class III cavity preparation & cavosurface bevel',
      'Contoured Mylar matrix & wedge adaptation',
      'Adhesive bonding & incremental composite restoration',
      'Proximal contact check, finishing, polishing & post-op photo series',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Operative_Anterior,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 8–9, 12–28, 40',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Restorative Department Evaluation Rubric is out of 100 marks. Application tracking points (8 pts) are inferred for semester unit tracking.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-operative-class4',
    discipline: 'Operative',
    name: 'Class IV Anterior Composite Restoration',
    category: 'Direct Anterior Esthetic Restoration',
    difficulty: 'Complex (100 Marks Rubric)',
    rubricTitle: 'Rubric for Restorations Evaluation (Restorative Dentistry Department)',
    defaultPoints: 10,
    defaultSteps: [
      'Pre-op smiling/retracted photos, shade selection view & palatal silicone index',
      'Rubber dam isolation, functional beveling & Class IV preparation',
      'Matricing, bonding, palatal enamel shelf & dentin/enamel layering',
      'Centric/protrusive occlusal adjustment, surface texture carving & high polish',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Operative_Anterior,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 8–9, 12–28, 40',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Restorative Department Evaluation Rubric is out of 100 marks. Application tracking points (10 pts) are inferred for semester unit tracking.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-operative-class5',
    discipline: 'Operative',
    name: 'Class V Cervical Restoration (Composite / RMGI)',
    category: 'Cervical Restoration',
    difficulty: 'Simple / Moderate (100 Marks Rubric)',
    rubricTitle: 'Rubric for Restorations Evaluation (Restorative Dentistry Department)',
    defaultPoints: 6,
    defaultSteps: [
      'Pre-op retracted view & rubber dam / retraction cord isolation',
      'Class V cavity preparation & caries removal',
      'Adhesive protocol & cervical composite / RMGI restoration placement',
      'Cervical margin finishing, polishing & post-op documentation',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Operative_Anterior,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 8–9, 12–28, 40',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Restorative Department Evaluation Rubric is out of 100 marks. Application tracking points (6 pts) are inferred for semester unit tracking.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-operative-cambra-occlusion',
    discipline: 'Operative',
    name: 'Caries Risk Assessment (CAMBRA) & Recording of Occlusion',
    category: 'Diagnostic & Preventive Requirement',
    difficulty: 'Standard (1 Case w/ Follow-up or 3 Cases w/o Follow-up)',
    rubricTitle: 'Caries Risk Assessment (CAMBRA) & Recording of Occlusion Evaluation',
    defaultPoints: 5,
    defaultSteps: [
      'Complete Caries Risk Assessment (Disease indicators, Risk factors & Protective factors)',
      'Determine overall Caries Risk level & non-operative preventive care plan',
      'Recording of Occlusion diagram (Centric MIP in Blue, Protrusion in Red, Lateral in Green)',
      'Post-treatment occlusal re-recording & 3-month CAMBRA follow-up assessment',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Operative_Assessment,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 8, 12, 40',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Explicit MIU logbook requirement: 1 Case with follow-up or 3 Cases without follow-up. Application tracking points (5 pts) inferred.',
    isComprehensiveCoreDiscipline: true,
  },

  // ================= ENDODONTICS (MIU Logbook Pages 10, 29–32) =================
  {
    id: 'tmpl-endo-rct-anterior',
    discipline: 'Endo',
    name: 'Root Canal Treatment — Anterior (Single Canal)',
    category: 'Non-Surgical Root Canal Treatment',
    difficulty: 'Standard / Minimum (+5%) • 20 Marks Rubric',
    rubricTitle: 'Rubric for Practical Clinical Sessions (Endodontics)',
    defaultPoints: 12,
    defaultSteps: [
      'Pre-op diagnostic periapical X-ray & anesthesia',
      'Rubber dam isolation, lingual access cavity preparation & intraoral access photo',
      'Working length determination & Working Length periapical X-ray (record WL, Ref Point & IAF)',
      'Cleaning & shaping (Apical seat 3-4 sizes after IAF & coronal flaring)',
      'Master Cone try-in periapical X-ray (0.5-1 mm from radiographic apex)',
      'Obturation (no voids), post-op periapical X-ray & coronal seal',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Endo_RCT,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 10, 29–32',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Endodontics Clinical Session Rubric is out of 20 marks (+5% difficulty bonus). Application tracking points (12 pts) inferred for unit tracking.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-endo-rct-premolar',
    discipline: 'Endo',
    name: 'Root Canal Treatment — Premolar (1–2 Canals)',
    category: 'Non-Surgical Root Canal Treatment',
    difficulty: 'Minimum (+5%) / Moderate (+10%) • 20 Marks Rubric',
    rubricTitle: 'Rubric for Practical Clinical Sessions (Endodontics)',
    defaultPoints: 15,
    defaultSteps: [
      'Pre-op diagnostic periapical X-ray & anesthesia',
      'Rubber dam isolation, oval access cavity preparation & intraoral access photo',
      'Working length determination & Working Length periapical X-ray (record WL, Ref Point & IAF)',
      'Cleaning & shaping (Apical seat 3-4 sizes after IAF & coronal flaring)',
      'Master Cone try-in periapical X-ray (0.5-1 mm from radiographic apex)',
      'Obturation (no voids), post-op periapical X-ray & coronal seal',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Endo_RCT,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 10, 29–32',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Endodontics Clinical Session Rubric is out of 20 marks (+5% to +10% difficulty bonus). Application tracking points (15 pts) inferred for unit tracking.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-endo-rct',
    discipline: 'Endo',
    name: 'Root Canal Treatment — Molar (3+ Canals)',
    category: 'Non-Surgical Root Canal Treatment',
    difficulty: 'Moderate (+10%) / Minimum (+5%) • 20 Marks Rubric',
    rubricTitle: 'Rubric for Practical Clinical Sessions (Endodontics)',
    defaultPoints: 20,
    defaultSteps: [
      'Pre-op diagnostic periapical X-ray, vitality test & profound anesthesia',
      'Rubber dam isolation, access cavity preparation (Outline, Extension, De-roofing, Flared walls) & Access Photo',
      'Working length determination & Working Length periapical X-ray (record WL, Ref Point & Initial File)',
      'Cleaning & shaping (Apical prep 3-4 sizes after IAF, Apical stop & Coronal flaring)',
      'Master Cone periapical X-ray (0.5-1 mm from radiographic apex; record MAF & MAC)',
      'Obturation (no voids), post-op periapical X-ray & coronal seal',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Endo_RCT,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 10, 29–32',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Endodontics Clinical Session Rubric is out of 20 marks (+10% difficulty bonus for molars). Application tracking points (20 pts) inferred for unit tracking.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-endo-pulpotomy',
    discipline: 'Endo',
    name: 'Vital Pulp Therapy / Pulpotomy (MTA Application)',
    category: 'Vital Pulp Therapy',
    difficulty: '20 Marks Vital Pulp Therapy Rubric',
    rubricTitle: 'Rubric For Vital Pulp Therapy',
    defaultPoints: 12,
    defaultSteps: [
      'Pre-op periapical X-ray, accurate pulp vitality & degree of inflammation assessment',
      'Rubber dam isolation, field control & access cavity preparation (5+1 Marks)',
      'Complete removal of inflamed coronal pulp & hemostasis achievement (6 Marks)',
      'MTA manipulation, adequate thickness & adaptation (3 Marks)',
      'Coronal seal, definitive restoration & post-op periapical X-ray',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Endo_Pulpotomy,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 10, 30 (Rubric For Vital Pulp Therapy)',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Vital Pulp Therapy Rubric is out of 20 marks (Removal & Hemostasis /6, Isolation & Access /6, MTA /3, etc.). Tracking points (12 pts) inferred.',
    isComprehensiveCoreDiscipline: true,
  },

  // ================= REMOVABLE PROSTHODONTICS (MIU Logbook Pages 33–35, 45–54) =================
  {
    id: 'tmpl-removable-complete',
    discipline: 'Removable',
    name: 'Complete Denture (Single Arch or Maxillary & Mandibular)',
    category: 'Complete Denture Prosthodontics',
    difficulty: 'Standard / Moderate (+10%) • 5 Official Stage Rubrics',
    rubricTitle: 'Rubric for Complete Denture (Primary Imp, Secondary Imp, Jaw Relation, Try-in, Delivery)',
    defaultPoints: 25,
    defaultSteps: [
      'Primary Impression (Borders, Fitting Surface, Tuberosity/Retromolar Pad, Centralization, Mix — /20 Marks)',
      'Border Molding & Secondary Impression in Custom Tray (/20 Marks)',
      'Jaw Relation Record (Base Extension, Maxillary Rim 2mm, Lip Support, Occlusal Plane, VDO, CR — /10 Marks)',
      'Try-in of Trial Denture Bases (Articulator /5 + Intraoral Separate /6 + Intraoral Together /4 — /15 Marks)',
      'Delivery, Selective Grinding & 5-Point Patient Instructions (/36 Marks)',
      'Post-insertion recall & adjustment',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Removable_General,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 33–35, 45–54',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official 5-Stage Removable Rubrics: Primary Imp /20, Secondary Imp /20, Jaw Relation /10, Try-in /15, Delivery /36 (Total 101 Rubric Marks). Tracking points (25 pts) inferred.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-removable-partial',
    discipline: 'Removable',
    name: 'Removable Partial Denture (Acrylic / Metallic RPD)',
    category: 'Partially Edentulous Prosthodontics',
    difficulty: 'Standard / Moderate (+10%) • 5 Official Stage Rubrics',
    rubricTitle: 'Rubric for RPD (Primary Imp, Secondary Imp, Jaw Relation, Try-in, Delivery)',
    defaultPoints: 20,
    defaultSteps: [
      'Primary Impression for Partially Edentulous Patient (Borders, Fitting Surface, Distal Extension — /20 Marks)',
      'Surveying, Mouth Preparation & Secondary Impression for Partially Edentulous Arch (/20 Marks)',
      'Metal Framework Try-in (if applicable) & Jaw Relation Record (/10 Marks)',
      'Wax Try-in (Articulator check + Intraoral stability, retention, occlusion & appearance — /15 Marks)',
      'Delivery, Fitting Surface/Occlusal Adjustment & Patient Hygiene Instructions (/36 Marks)',
      'Post-insertion follow-up',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Removable_General,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 33–35, 45–54',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official 5-Stage Removable Rubrics: Primary Imp /20, Secondary Imp /20, Jaw Relation /10, Try-in /15, Delivery /36. Tracking points (20 pts) inferred.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-removable-overdenture',
    discipline: 'Removable',
    name: 'Tooth-Supported Overdenture (with Abutment Preparation)',
    category: 'Overdenture Prosthodontics',
    difficulty: 'Moderate (+10%) • Requires Endo & Abutment Prep Photos/X-rays',
    rubricTitle: 'Removable Overdenture & 5-Stage Evaluation Rubrics',
    defaultPoints: 28,
    defaultSteps: [
      'Endodontic treatment of abutment teeth (Pre-op & Post-op periapical radiographs)',
      'Abutment dome preparation & pre/post-preparation intraoral photographs',
      'Primary & Secondary elastomeric impressions (/20 Marks each)',
      'Jaw Relation Record (VDO & Centric Relation — /10 Marks)',
      'Trial Denture Try-in (Articulator & Intraoral verification — /15 Marks)',
      'Overdenture Delivery, Selective Grinding & Patient Instructions (/36 Marks)',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Removable_Overdenture,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 35, 45–54',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Requires Endo & Abutment Prep before 5 Removable stages. Evaluated across Removable 5-stage rubrics. Tracking points (28 pts) inferred.',
    isComprehensiveCoreDiscipline: true,
  },

  // ================= PERIODONTICS (MIU Logbook Pages 7, 41–44) =================
  {
    id: 'tmpl-perio-srp',
    discipline: 'Perio',
    name: 'Full Mouth Scaling & Root Planing (Non-Surgical Periodontal Therapy)',
    category: 'Non-Surgical Periodontal Therapy',
    difficulty: 'Standard (70 Marks Rubric • PhD Chart Signature)',
    rubricTitle: 'Rubric for Periodontology Cases',
    defaultPoints: 10,
    defaultSteps: [
      'Diagnostic sheet, full pre-op Periodontal Chart & PhD Holder diagnosis rationale signature',
      'Baseline gingival macroanatomy photo, probe photo at deepest CAL/PD site & bitewing/PA X-ray',
      'Supragingival & subgingival scaling/root planing (Position, Instrument grasp/stroke, Infection control)',
      'Oral Hygiene Motivation performed & signed in front of Periodontics instructor',
      'Re-evaluation after 4 weeks & post-op Periodontal Chart (signed by PhD holder for comprehensive cases)',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Perio_NonSurgical,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 7, 41–44',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Official Periodontology Case Rubric is out of 70 marks (Pre-op Chart /10, OHI /10, Instrumentation /40, Re-evaluation /10). Requires PhD holder signature. Tracking points (10 pts) inferred.',
    isComprehensiveCoreDiscipline: true,
  },
  {
    id: 'tmpl-perio-crown-lengthening',
    discipline: 'Perio',
    name: 'Crown Lengthening / Gingivectomy Surgery',
    category: 'Periodontal Surgery',
    difficulty: 'Surgical (Mandatory PhD Holder Prerequisite Approval)',
    rubricTitle: 'Rubric for Periodontology Cases & Periosurgery Sheet',
    defaultPoints: 15,
    defaultSteps: [
      'Baseline & after-control-phase periodontal charts + Mandatory Periodontist PhD Holder Approval Signature',
      'Bone sounding, pocket marking & surgical incision / tissue excision (min. 3 intra-op step photos)',
      'Osseous recontouring (if biologic width dictated) & root surface refinement',
      'Suturing, suturing photo & fulfillment of Periosurgery Sheet (steps, instruments, suturing technique)',
      'Suture removal & 1-Month Post-Operative Healing Photograph',
    ],
    evidenceRequirements: MIU_EVIDENCE_REQUIREMENTS.Perio_Surgical,
    templateVersion: MIU_LOGBOOK_VERSION,
    isOfficialMiuTemplate: true,
    supportStatus: 'EXPLICIT',
    miuSourcePage: 'Pages 7, 43–44 (Periosurgery Sheet)',
    pointSystemType: 'RUBRIC_MAX_MARKS',
    pointSystemDescription: 'Periodontal Surgery Sheet requirement. Requires prerequisite approval signature by PhD holder. Tracking points (15 pts) inferred.',
    isComprehensiveCoreDiscipline: true,
  },

  // ================= ORAL SURGERY (Preserved Legacy Templates — Not an MIU Comprehensive Care Requirement) =================
  {
    id: 'tmpl-surgery-simple-ext',
    discipline: 'Oral Surgery',
    name: 'Simple / Routine Tooth Extraction',
    category: 'Exodontia',
    rubricTitle: 'Oral Surgery Routine Extraction Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Pre-op radiographic evaluation & anesthesia',
      'Syndesmotomy & elevation',
      'Forceps delivery',
      'Socket debridement & hemostasis',
      'Post-extraction instructions',
    ],
    isOfficialMiuTemplate: false,
    supportStatus: 'LEGACY',
    miuSourcePage: 'Not an official MIU Comprehensive Care requirement; preserved for app compatibility',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Auxiliary dental discipline; not included in official MIU Comprehensive Care requirement sheets',
    isComprehensiveCoreDiscipline: false,
  },
  {
    id: 'tmpl-surgery-surgical-ext',
    discipline: 'Oral Surgery',
    name: 'Surgical / Impacted Tooth Extraction',
    category: 'Surgical Exodontia',
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
    isOfficialMiuTemplate: false,
    supportStatus: 'LEGACY',
    miuSourcePage: 'Not an official MIU Comprehensive Care requirement; preserved for app compatibility',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Auxiliary dental discipline; not included in official MIU Comprehensive Care requirement sheets',
    isComprehensiveCoreDiscipline: false,
  },

  // ================= PEDIATRIC DENTISTRY (Preserved Legacy Templates — Not an MIU Comprehensive Care Requirement) =================
  {
    id: 'tmpl-pedia-pulpotomy-ssc',
    discipline: 'Pediatric Dentistry',
    name: 'Pulpotomy & Stainless Steel Crown (SSC)',
    category: 'Pediatric Pulp Therapy',
    rubricTitle: 'Pediatric Pulpotomy & SSC Rubric',
    defaultPoints: 12,
    defaultSteps: [
      'Coronal pulp amputation & hemostasis',
      'Pulp medicament & base placement',
      'Tooth reduction & slices',
      'SSC selection, crimping & try-in',
      'Cementation & clean-up',
    ],
    isOfficialMiuTemplate: false,
    supportStatus: 'LEGACY',
    miuSourcePage: 'Not an official MIU Comprehensive Care requirement; preserved for app compatibility',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Auxiliary dental discipline; not included in official MIU Comprehensive Care requirement sheets',
    isComprehensiveCoreDiscipline: false,
  },
  {
    id: 'tmpl-pedia-restoration',
    discipline: 'Pediatric Dentistry',
    name: 'Pediatric Composite / Strip Crown',
    category: 'Pediatric Restorative',
    rubricTitle: 'Pediatric Operative Restoration Rubric',
    defaultPoints: 8,
    defaultSteps: [
      'Caries excavation & isolation',
      'Matrix / Strip crown adaptation',
      'Etching, bonding & composite placement',
      'Finishing & occlusion adjustment',
    ],
    isOfficialMiuTemplate: false,
    supportStatus: 'LEGACY',
    miuSourcePage: 'Not an official MIU Comprehensive Care requirement; preserved for app compatibility',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Auxiliary dental discipline; not included in official MIU Comprehensive Care requirement sheets',
    isComprehensiveCoreDiscipline: false,
  },
  {
    id: 'tmpl-pedia-space-maintainer',
    discipline: 'Pediatric Dentistry',
    name: 'Space Maintainer (Band & Loop)',
    category: 'Interceptive Pediatric Dentistry',
    rubricTitle: 'Pediatric Space Maintainer Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Band fitting & impression',
      'Appliance try-in',
      'Cementation & clean-up',
    ],
    isOfficialMiuTemplate: false,
    supportStatus: 'LEGACY',
    miuSourcePage: 'Not an official MIU Comprehensive Care requirement; preserved for app compatibility',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Auxiliary dental discipline; not included in official MIU Comprehensive Care requirement sheets',
    isComprehensiveCoreDiscipline: false,
  },

  // ================= ORTHODONTICS (Preserved Legacy Templates — Not an MIU Comprehensive Care Requirement) =================
  {
    id: 'tmpl-ortho-brackets',
    discipline: 'Orthodontics',
    name: 'Fixed Appliance (Brackets Bonding)',
    category: 'Fixed Orthodontics',
    rubricTitle: 'Orthodontic Direct Bonding Rubric',
    defaultPoints: 15,
    defaultSteps: [
      'Diagnostic photos & records',
      'Enamel etching & primer application',
      'Bracket positioning & curing',
      'Archwire engagement & ligation',
      'Patient instructions & hygiene kit',
    ],
    isOfficialMiuTemplate: false,
    supportStatus: 'LEGACY',
    miuSourcePage: 'Not an official MIU Comprehensive Care requirement; preserved for app compatibility',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Auxiliary dental discipline; not included in official MIU Comprehensive Care requirement sheets',
    isComprehensiveCoreDiscipline: false,
  },
  {
    id: 'tmpl-ortho-removable',
    discipline: 'Orthodontics',
    name: 'Removable Appliance (Hawley / Active Plate)',
    category: 'Removable Orthodontics',
    rubricTitle: 'Orthodontic Removable Appliance Rubric',
    defaultPoints: 10,
    defaultSteps: [
      'Alginate impression',
      'Appliance try-in & retention adjustment',
      'Delivery & activation instruction',
      'Follow-up & reactivation',
    ],
    isOfficialMiuTemplate: false,
    supportStatus: 'LEGACY',
    miuSourcePage: 'Not an official MIU Comprehensive Care requirement; preserved for app compatibility',
    pointSystemType: 'INFERRED_POINT_SCALE',
    pointSystemDescription: 'Auxiliary dental discipline; not included in official MIU Comprehensive Care requirement sheets',
    isComprehensiveCoreDiscipline: false,
  },
];

