# 🦷 DentaTrack — 5th Year Dental Clinical Tracker

> **A fast, offline-first Progressive Web App (PWA) built specifically for 5th-year dental students to monitor clinical patient cases, supervisor rubric sign-offs, clinical requirement quotas, and Moodle submissions.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-emerald.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Offline First](https://img.shields.io/badge/Offline-100%25%20Local-sky.svg)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Hosting](https://img.shields.io/badge/Hosting-100%25%20Free-green.svg)](https://pages.github.com/)

---

## 🌟 Overview & Why It's 100% Free

DentaTrack runs **entirely in the browser** using client-side **IndexedDB** and a **Workbox Service Worker**. 
- **Zero Cloud Costs**: No external servers, no paid database subscriptions, and no backend maintenance required.
- **100% Private**: Patient records, supervisor rubric signatures, and clinical photos never leave the student's device.
- **Hospital/Clinic-Ready**: Functions completely offline during clinical sessions with poor or zero Wi-Fi reception.

---


---

## 📱 How Your Friends Can Install & Test (PWA)

Once hosted, open the link on any device to use it just like a native app:

### 🍎 iOS (iPhone & iPad)
1. Open your shared link in **Apple Safari**.
2. Tap the **Share** button (📤) at the bottom toolbar (on iPad, top-right).
3. Scroll down and tap **"Add to Home Screen"** (➕).
4. Tap **"Add"** in the top-right corner.
5. The DentaTrack icon will appear on your home screen and open full-screen offline without browser bars.

### 🤖 Android (Google Chrome / Edge / Samsung Internet)
1. Open the shared link in **Chrome**.
2. Tap the in-app **"Install App"** button at the top header, or tap the browser menu (⋮) → **"Install app"** / **"Add to Home screen"**.
3. Confirm installation. The app will be added to your home screen and app drawer.

### 💻 PC & Mac (Chrome / Edge / Brave)
1. Open the link in **Chrome** or **Edge**.
2. Click the **Install** icon (💻) on the right side of the URL address bar, or open the browser menu (⋮) → **"Install DentaTrack"**.
3. It will launch in its own standalone desktop window.

---

## 💻 Local Development Setup

To run or modify DentaTrack on your computer:

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` (comes with Node.js)

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/<YOUR_USERNAME>/dentatrack.git
cd dentatrack

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Starts Vite development server at `http://localhost:3000` |
| `npm run build` | Compiles production assets into `dist/` with relative asset links |
| `npm run preview` | Previews the compiled `dist/` production build locally |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Deletes the `dist/` build directory |

---

## 🩺 Key Features Included

- **Clinical Case Management**: Track patient file numbers, age, gender, medical alerts, clinic disciplines, and step-by-step procedure milestones.
- **Rubric & Sign-off Monitor**: Record supervisor signatures, grades, and clinical rubrics directly chairside.
- **Photographic Evidence Vault**: Attach pre-op, working length, and post-op clinical photos/X-rays stored directly in browser IndexedDB.
- **Requirements & Quotas Dashboard**: Real-time progress gauges for target points, completed quotas, and clinical competencies.
- **Moodle Submission Checklist**: Track what cases have been signed, exported, and submitted to your university portal.
- **Data Backup & Restore**: One-click JSON backup export and import, making it effortless to transfer data across devices or share test cases with friends.
- **Export Reports**: Generate comprehensive clinical PDF and CSV summaries for logs and department submissions.

---

## 🔒 Privacy & Data Storage

All data entered into DentaTrack is stored locally in your browser's **IndexedDB** (`dentatrack-5th-year-db`). 
- No patient data is sent over the internet or stored on external servers.
- Users have complete control to export, back up, or wipe their data anytime via the **Settings** view.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, test, and share with your colleagues.

ENJOY ASSHOLES
