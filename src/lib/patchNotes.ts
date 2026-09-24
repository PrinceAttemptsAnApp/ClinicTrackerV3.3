export interface PatchNoteEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const APP_VERSION = '4.2.0';

export const PATCH_NOTES: PatchNoteEntry[] = [
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
