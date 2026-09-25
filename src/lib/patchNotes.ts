export interface PatchNoteEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export interface UpcomingFeatureEntry {
  title: string;
  status: string;
  tag: string;
  description: string;
  note: string;
}

export const APP_VERSION = '4.4.0';

export const UPCOMING_FEATURES: UpcomingFeatureEntry[] = [
  {
    title: '📅 Calendar & Reminder Integration — In Development',
    status: 'In Development',
    tag: 'Upcoming',
    description:
      "We're working on the ability to add planned clinical visits from DentaTrack directly to your phone's Calendar or Reminder app. This will let you take a planned visit, including the clinical milestone, date, clinic/session time, and relevant details, and save it to your device's existing calendar/reminder system so your phone can handle the reminders and notifications.",
    note: 'This feature is currently being worked on and is not yet available.'
  }
];

export const PATCH_NOTES: PatchNoteEntry[] = [
  {
    version: '4.4.0',
    date: '2026-09-25',
    title: 'Comprehensive Clinic Discipline & Dark Mode Contrast Fixes',
    changes: [
      'Comprehensive Clinic Discipline Option: Added Comprehensive Clinic as an official discipline choice when creating or managing clinic sessions in the schedule builder.',
      'Action Required Chairside Dark Mode Fix: Upgraded low-contrast light grey card surfaces in Dark Mode to high-contrast #1E293B dark slate containers.',
      'Dark Mode Accessibility & Hierarchy: Standardized readable typography across dark mode dashboard cards, course progress panel, and metric buttons (Primary #F8FAFC, Secondary #CBD5E1, Muted #94A3B8).',
      'UI Grey-Box & Leaking Dark Mode Audit: Completed codebase-wide audit fixing unintended grey boxes with white text across Light and Dark modes using semantic theme tokens.',
      'Preserved Light Mode Aesthetic: Ensured all contrast and theme improvements enhance Dark Mode without altering or degrading Light Mode styling.'
    ]
  },
  {
    version: '4.3.0',
    date: '2026-09-25',
    title: 'Plan Next Visit & Clinical Cockpit Overhaul',
    changes: [
      'Plan Next Visit Feature: Schedule upcoming procedure milestones directly to your extracted clinic sessions with intelligent discipline matching.',
      'Schedule-Grounded Session Picker: 1-tap planning linked to your real upcoming timetable dates, clinic stations, and session time slots.',
      'Clinical Cockpit Today\'s Clinic: Redesigned into a focused chairside cockpit answering "Where am I today?", "What cases am I treating?", and "What needs attention next?".',
      'Semantic Schedule & Workload Separation: Clear distinction between days with scheduled clinic duty and active case workloads when off-duty.',
      'Compact Case Cards & Visit Badges: High-density cards featuring tooth position, discipline, next clinical action, and live scheduled visit tags.',
      'Milestone-Level Scheduling: Plan next visits directly from procedure macro-milestone checklists in Case Details with instant update and remove actions.'
    ]
  },
  {
    version: '4.2.0',
    date: '2026-09-24',
    title: 'Mobile PDF Exporter Overhaul & Universal Schedule Importer',
    changes: [
      'Mobile WebKit PDF Exporter Fix: Resolved mobile canvas image rendering failures for demo and patient attachment photos/X-rays.',
      'Native Mobile PDF Sharing & Downloads: Added native Web Share API integration to export and share PDF reports directly on iOS & Android.',
      'Universal Schedule Extractor: Added 3-tier parsing (2D Tabular Grid, Spatial Line Reconstruction, and Proximity Cluster) supporting Egyptian & international dental school timetables (MIU, Cairo, Ain Shams, MUST, etc.).',
      'Google Drive & Cloud Link Importer: Easily import schedules by pasting public Google Drive, Google Doc, or Google Sheet shareable links.',
      'iOS 1-Tap Quick-Paste Assistant: 1-tap clipboard paste with step-by-step guidance for copying PDF text directly on iPhone and iPad.',
      'Resilient Offline Architecture: Isolated PDF.js worker execution into dynamic same-origin bundles to prevent startup crashes or WebKit sandbox blocks.'
    ]
  },
  {
    version: '3.4.0',
    date: '2026-09-23',
    title: 'Clinical Tester & Usability Release',
    changes: [
      'Improved mobile usability and touch targets throughout the app.',
      'Improved tooth selection on smaller screens.',
      'Improved removable-denture tooth selection so the correct arch is enabled based on the selected denture type.',
      'Added better demo cases and demonstration attachments so new users can explore the application.',
      'Added improved sharing from Settings.',
      'Added DentaTrack analytics for anonymous app usage and feature usage, without sending clinical/patient data.',
      'Improved the app\'s update/version information.',
      'Improved the rotating header messages and mobile text wrapping.'
    ]
  },
  {
    version: '3.3.1',
    date: '2026-09-22',
    title: 'Mobile Layout & Secure Demo Sandbox Update',
    changes: [
      'Responsive mobile header layout with auto-wrapping doctor greeting for narrow screens.',
      'Scoped, non-destructive demo data restore to reset only sandbox clinical cases while preserving real student data.',
      'Beautiful inline verified rubric documents and multi-stage endodontic radiographic assets for demonstration.',
      'Optimized PDF and Moodle export formatting pipelines with native base64 canvas compatibility.'
    ]
  },
  {
    version: '3.3.0',
    date: '2026-09-10',
    title: 'Multi-Tooth Macro-Milestones Release',
    changes: [
      'Introduced progressive clinical milestone checklists grouped by specialty (Endo, Prosthodontics, Operative, Pedodontics).',
      'Advanced root-canal diagnostic view tracking Pre-Op, Working Length, Master Cone, and Post-Op obturation.',
      'Added local automatic offline support using Workbox Service Workers.'
    ]
  }
];
