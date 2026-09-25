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
    title: '📅 Phone Calendar & Reminder Integration',
    status: 'In Development',
    tag: 'Upcoming',
    description:
      "We're setting up 1-tap sync to push your planned clinic sessions directly to your iPhone or Android calendar — so your phone can remind you about patients before your supervisor asks where they are.",
    note: 'Currently being drilled and polished in the lab. Stay tuned!'
  }
];

export const PATCH_NOTES: PatchNoteEntry[] = [
  {
    version: '4.4.0',
    date: '2026-09-25',
    title: 'Comprehensive Clinic & Dark Mode Retinal Relief',
    changes: [
      'Comprehensive Clinic Discipline: Added "Comprehensive Clinic" to schedule options for those sessions where a patient needs literally everything done at once.',
      'Dark Mode Retinal Relief: Fixed harsh light-grey containers in Dark Mode. No more blinding white cards burning your eyes during late-night requirement panics.',
      'Crystal-Clear Text Hierarchy: High-contrast text colors across all dark cards so you can actually read your case notes without squinting.',
      'UI Glitch Sweeping: Replaced random grey boxes with clean, high-contrast theme styling across filters, badges, and tooth diagrams.',
      'Light Mode Safe: All dark mode mercy fixes were done without destroying the clean, bright Light Mode look.'
    ]
  },
  {
    version: '4.3.0',
    date: '2026-09-25',
    title: 'Plan Next Visit & Today\'s Clinic Survival Cockpit',
    changes: [
      'Plan Next Visit: 1-tap scheduling to tie a patient\'s next procedure step directly to an upcoming clinic slot. Less timetable math, more prep time.',
      'Today\'s Clinic Cockpit: Redesigned dashboard to answer three vital questions: "Where am I?", "Who am I treating?", and "What step needs signing next?"',
      'Duty vs. Off-Duty Split: Clear visual separation between days you actually have clinic duty and days you just have pending requirements.',
      'Milestone Linking: Attach specific procedure checklist items straight to your timetable dates with quick add/remove controls.'
    ]
  },
  {
    version: '4.2.0',
    date: '2026-09-24',
    title: 'Schedule PDF Magic & Mobile PDF Export Rescue',
    changes: [
      'Universal Schedule Importer: Upload or paste a link to your dental school schedule (MIU, Cairo, Ain Shams, MUST, etc.) and let DentaTrack parse your shifts automatically.',
      'Mobile PDF Sharing Fixed: Exporting patient reports to PDF on iOS & Android won\'t crash or drop X-ray attachment photos anymore.',
      'Google Drive Importer: Easily import timetables by pasting public Google Drive, Sheet, or Doc shareable links.',
      '1-Tap iOS Paste: Quick clipboard helper for iPhone users who refuse to type out schedule dates manually.'
    ]
  },
  {
    version: '3.4.0',
    date: '2026-09-23',
    title: 'Glove-Friendly Touch & Usability Boost',
    changes: [
      'Fat-Finger Friendly Buttons: Enlarged touch targets and tooth selectors so you can tap accurately even with clinic gloves on.',
      'Denture Tooth Logic: Selecting removable denture teeth now locks to the right arch so you don\'t accidentally put upper molars on a lower denture.',
      'Safer Demo Mode: Experiment with sandbox demo cases without any risk of wiping your actual clinical requirements.',
      'Smoother Mobile Header: Clean text wrapping on small phone screens so long greeting messages don\'t overflow.'
    ]
  },
  {
    version: '3.3.1',
    date: '2026-09-22',
    title: 'Demo Sandbox & Rubric Document Upgrades',
    changes: [
      'Scoped Demo Reset: Reset sample sandbox data anytime without touching your real patient records.',
      'Inline Rubric Preview: View supervisor rubric guidelines and endodontic radiograph stages right inside the app.',
      'Mobile Greeting Wrap: Responsive top bar layout that fits narrow phone screens gracefully.'
    ]
  },
  {
    version: '3.3.0',
    date: '2026-09-10',
    title: 'Multi-Tooth Macro-Milestones Release',
    changes: [
      'Step-by-Step Checklists: Structured clinical milestone checklists for Endo, Prostho, Operative, and Pedo.',
      'Root Canal Diagnostic Tracker: Track Pre-Op, Working Length, Master Cone, and Post-Op obturation stages step by step.',
      'Offline Support: Works offline in clinic basements with zero cell reception.'
    ]
  }
];
