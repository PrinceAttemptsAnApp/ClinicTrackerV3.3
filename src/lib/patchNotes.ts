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

export interface KnownLimitationEntry {
  title: string;
  description: string;
  points?: string[];
}

export const APP_VERSION = '4.5.0';

export const KNOWN_LIMITATIONS: KnownLimitationEntry[] = [
  {
    title: '📅 Google Calendar Sync May Require Reconnection',
    description:
      'Google Calendar synchronization is optional and works as a one-way DentaTrack → Google Calendar integration. Because the Google access token is kept only in temporary browser memory for security, you may need to reconnect your Google account after completely closing or reloading the app before queued calendar changes can be synchronized. Your local DentaTrack cases, procedures, and plans remain safe on your device and are never affected by disconnecting or reconnecting. When offline, planned calendar updates wait until connectivity is restored and synchronization is available again.'
  },
  {
    title: '📄 iOS Schedule PDF Import May Fail for Some University PDFs',
    description:
      'The schedule importer works with many PDF files, but some complex university-generated PDFs with specialized fonts, object streams, or unusual text layouts may not be readable on iPhone/iPad.',
    points: [
      'Existing schedule and clinical data are never deleted.',
      'The original PDF file is not modified.',
      'Manual schedule entry can always be used as a reliable fallback.',
      'The issue is strictly limited to extracting text from the affected PDF.'
    ]
  },
  {
    title: '🔄 Updates May Take a Moment to Appear on iPhone/iPad',
    description:
      'Because DentaTrack is a Progressive Web App, iOS WebKit may temporarily display an older cached version after an update. If a new feature does not appear immediately, completely closing and reopening DentaTrack may be necessary. In some cases, the installed Home Screen icon needs additional time to receive updated files. Your locally stored clinical data remains completely independent of normal application updates.'
  },
  {
    title: '📶 Some Features Require Internet Access',
    description:
      'DentaTrack’s clinical records, case management, procedure tracking, documents, and scheduling are designed to work 100% offline. However, features communicating with external services require an internet connection, including Google Calendar synchronization and cloud-based analytics. Loss of internet connectivity never prevents you from continuing to record clinical work locally.'
  },
  {
    title: '🗓️ Calendar Planning Depends on the Imported Schedule',
    description:
      'The Plan Next Visit system uses DentaTrack’s extracted university clinic schedule as the source for recommended clinic sessions. If the schedule is missing, outdated, or entered incorrectly, recommended visit dates may also be inaccurate. The planning system does not replace your university’s official timetable.'
  },
  {
    title: '📱 iOS and Browser Behavior Can Differ',
    description:
      'DentaTrack is designed for modern desktop and mobile browsers, but browser restrictions can affect certain features differently. iOS Safari/WebKit has stricter limitations around PDF processing, background workers, file handling, and PWA caching. These platform limitations can occasionally cause a feature to behave differently on iPhone/iPad compared with desktop Chrome.'
  },
  {
    title: '💾 Clinical Data Is Stored Locally',
    description:
      'DentaTrack’s clinical records are stored locally on your device rather than in a central cloud patient database. This provides privacy and offline functionality, but it also means device storage is important. Clearing browser site data, deleting installed PWA data, or switching browsers will not automatically transfer existing clinical records. Please do not clear DentaTrack’s stored website data unless intended.'
  },
  {
    title: '🧪 DentaTrack Is Still Under Active Development',
    description:
      'Some features receive visual, technical, or workflow improvements as real-world clinical use reveals edge cases. When an issue occurs, preserving your existing clinical records and avoiding destructive changes to stored data is always our top priority. Known limitations are documented here as they are discovered and addressed.'
  }
];

export const UPCOMING_FEATURES: UpcomingFeatureEntry[] = [];

export const PATCH_NOTES: PatchNoteEntry[] = [
  {
    version: '4.5.0',
    date: '2026-10-05',
    title: 'Cleaner Case Details & Personal Monthly Calendar',
    changes: [
      'Clean Patient & Case Screens: Simplified the Patient and Procedure details pages so you can see your cases, teeth, and progress without scrolling through repeated badges or cluttered text.',
      'Single Completion Summary: When a procedure is finished, you get one clear summary card at the top instead of seeing "Completed!" repeated five times on the screen.',
      'Patient Initials Avatars: Added colorful patient initials circles so you can spot who you are treating instantly on your phone.',
      'Monthly Clinical Calendar: Replaced the plain schedule list with an interactive monthly calendar that combines your university clinic shifts, planned patient visits, and procedure steps.',
      'Glove-Friendly Popups: Made "Plan Next Visit", "Add Case", and "Add Procedure" popups easier to tap quickly while wearing clinic gloves.',
      'Sleeker Dark Mode: Cleaned up card borders, contrast, and background colors across all screens to reduce eye strain.'
    ]
  },
  {
    version: '4.4.0',
    date: '2026-09-25',
    title: 'Comprehensive Clinic & Dark Mode Retinal Relief',
    changes: [
      'Comprehensive Clinic Discipline: Added "Comprehensive Clinic" to schedule options for those sessions where a patient needs literally everything done at once.',
      'Dark Mode Retinal Relief: Fixed harsh light-grey containers in Dark Mode to ensure comfortable contrast and zero glare.',
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
