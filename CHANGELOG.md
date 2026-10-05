# 🦷 DentaTrack Changelog

All notable updates, clinical screen simplifications, and mobile usability improvements in DentaTrack.

---

## ⚠️ Known Limitations & Things to Expect

- **📅 Google Calendar Sync May Require Reconnection**: Google Calendar synchronization is optional and works as a one-way DentaTrack → Google Calendar integration. Because the Google access token is kept only in temporary browser memory for security, you may need to reconnect your Google account after completely closing or reloading the app before queued calendar changes can be synchronized. Your local DentaTrack cases, procedures, and plans remain stored locally and are not affected by disconnecting or reconnecting Google Calendar. When offline, planned calendar updates wait until connectivity is restored and synchronization is available again.
- **📄 iOS Schedule PDF Import May Fail for Some University PDFs**: The schedule importer works with many PDF files, but some complex university-generated PDFs with specialized fonts, object streams, or unusual text layouts may not be readable on iPhone/iPad. Existing schedule and clinical data are never deleted, the original PDF file is not modified, and manual schedule entry can always be used as a reliable fallback.
- **🔄 Updates May Take a Moment to Appear on iPhone/iPad**: Because DentaTrack is a Progressive Web App, iOS WebKit may temporarily display an older cached version after an update. Completely closing and reopening DentaTrack may be necessary if a new feature does not appear immediately. Locally stored clinical data remains completely independent of normal application updates.
- **📶 Some Features Require Internet Access**: DentaTrack's clinical records, case management, procedure tracking, documents, and scheduling are designed to work 100% offline. However, features communicating with external services require an internet connection, including Google Calendar synchronization and cloud-based analytics. Loss of internet connectivity never prevents you from continuing to record clinical work locally.
- **🗓️ Calendar Planning Depends on the Imported Schedule**: The Plan Next Visit system uses DentaTrack's extracted university clinic schedule as the source for recommended clinic sessions. If the schedule is missing, outdated, or entered incorrectly, recommended visit dates may also be inaccurate. The planning system does not replace your university's official timetable.
- **📱 iOS and Browser Behavior Can Differ**: DentaTrack is designed for modern desktop and mobile browsers, but browser restrictions can affect certain features differently. iOS Safari/WebKit has stricter limitations around PDF processing, background workers, file handling, and PWA caching.
- **💾 Clinical Data Is Stored Locally**: DentaTrack's clinical records are stored locally on your device rather than in a central cloud patient database. This provides privacy and offline functionality, but it also means device storage is important. Clearing browser site data, deleting installed PWA data, or switching browsers will not automatically transfer existing clinical records.
- **🧪 DentaTrack Is Still Under Active Development**: Some features receive visual, technical, or workflow improvements as real-world clinical use reveals edge cases. When an issue occurs, preserving your existing clinical records and avoiding destructive changes to stored data is always our top priority.

---

## [4.5.0] - 2026-10-05

### 🚀 Cleaner Case Details & Personal Monthly Calendar

- **Clean Patient & Case Screens**: Simplified the Patient and Procedure details screens so you can see your cases, tooth notation, and milestones at a glance without scrolling through repetitive text boxes.
- **Single Completion Summary**: When a procedure is finished, you now get one clear completion card at the top instead of seeing "Completed!" repeated five times across the screen.
- **Patient Initials Avatars**: Added colorful patient initials circles so you can spot who you are treating instantly on your phone.
- **Personal Monthly Clinical Calendar**: Reworked the Schedule page into an interactive monthly grid that combines your university clinic shifts, planned patient visits, and procedure steps.
- **Glove-Friendly Popups**: Made "Plan Next Visit", "Add Case", and "Add Procedure" popups easier to tap quickly while wearing clinic gloves.
- **Sleeker Dark Mode**: Cleaned up card borders and background contrast across all screens to reduce eye strain.

---

## [4.4.0] - 2026-09-25

### 🚑 Comprehensive Clinic & Dark Mode Retinal Relief

- **Comprehensive Clinic Discipline**: Added "Comprehensive Clinic" to schedule options for sessions where a patient needs multi-specialty treatment.
- **Dark Mode Retinal Relief**: Fixed harsh light-grey containers in dark mode to ensure comfortable reading and low eye strain.
- **Clearer Text**: High-contrast text colors across dark cards so case notes are easy to read.

---

## [4.3.0] - 2026-09-25

### ⏱️ Plan Next Visit & Today's Clinic Survival Cockpit

- **Plan Next Visit**: 1-tap scheduling to tie a patient's next procedure step directly to an upcoming clinic slot.
- **Today's Clinic Cockpit**: Redesigned dashboard focusing on immediate chairside questions: "Where am I?", "Who am I treating?", and "What step needs signing next?".
- **Duty vs. Off-Duty Split**: Clear visual separation between days with active clinic duty and off-duty days.

---

## [4.2.0] - 2026-09-24

### 📄 Schedule PDF Importer & Mobile PDF Fixes

- **Universal Schedule Importer**: Upload or paste links to dental school schedules (MIU, Cairo, Ain Shams, MUST) for automatic shift parsing.
- **Mobile PDF Export**: Resolved iOS & Android crashes when exporting patient reports with attached radiographs.

---

## [3.4.0] - 2026-09-23

### 🧤 Glove-Friendly Touch & Usability Boost

- **Larger Buttons**: Enlarged buttons and tooth selectors so you can tap accurately with clinic gloves on.
- **Denture Tooth Logic**: Denture tooth selectors automatically lock to the correct arch.
- **Safer Demo Mode**: Sandbox mode lets you experiment with sample cases without touching your real patient records.

---

## [3.3.0] - 2026-09-10

### 🦷 Multi-Tooth Macro-Milestones Release

- **Step-by-Step Checklists**: Interactive milestone checklists for Endo, Prostho, Operative, and Pedo.
- **Root Canal X-Ray Tracker**: Step-by-step radiograph documentation (Pre-Op, Working Length, Master Cone, Post-Op).
- **100% Offline Support**: Works offline in clinic basements with zero cell reception.
