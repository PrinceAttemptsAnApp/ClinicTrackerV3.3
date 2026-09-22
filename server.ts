import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Accept up to 30mb for PDF uploads
  app.use(express.json({ limit: '30mb' }));

  // Enable CORS for analytics requests from GitHub Pages or web clients
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Anonymous Analytics Store (In-Memory with safe bounds)
  interface InstallationRecord {
    firstSeen: string;
    lastSeen: string;
    lastHeartbeat: number; // timestamp ms
    appVersion: string;
    displayMode: string;
    platform: string;
  }

  interface EventEntry {
    anonymousInstallationId: string;
    event: string;
    appVersion: string;
    displayMode: string;
    platform: string;
    timestamp: string;
  }

  const installationMap = new Map<string, InstallationRecord>();
  const eventsLog: EventEntry[] = [];
  const MAX_EVENTS_LOG = 10000;

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Anonymous Analytics Event Ingestion Endpoint
  app.post('/api/analytics/event', (req, res) => {
    try {
      const {
        anonymousInstallationId,
        event,
        appVersion = '3.3.0',
        displayMode = 'browser',
        platform = 'other',
        timestamp = new Date().toISOString(),
      } = req.body || {};

      if (!anonymousInstallationId || typeof anonymousInstallationId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid anonymousInstallationId' });
      }

      const now = Date.now();
      const existing = installationMap.get(anonymousInstallationId);

      if (existing) {
        existing.lastSeen = timestamp;
        existing.lastHeartbeat = now;
        existing.appVersion = appVersion;
        existing.displayMode = displayMode;
        existing.platform = platform;
      } else {
        installationMap.set(anonymousInstallationId, {
          firstSeen: timestamp,
          lastSeen: timestamp,
          lastHeartbeat: now,
          appVersion,
          displayMode,
          platform,
        });
      }

      eventsLog.push({
        anonymousInstallationId,
        event: event || 'unknown',
        appVersion,
        displayMode,
        platform,
        timestamp,
      });

      if (eventsLog.length > MAX_EVENTS_LOG) {
        eventsLog.splice(0, eventsLog.length - MAX_EVENTS_LOG);
      }

      // Calculate recent active users (heartbeat within 3 minutes = 180,000ms)
      const THREE_MINUTES_MS = 3 * 60 * 1000;
      let activeCount = 0;
      installationMap.forEach((record) => {
        if (now - record.lastHeartbeat <= THREE_MINUTES_MS) {
          activeCount++;
        }
      });

      return res.json({
        status: 'ok',
        totalInstallationsEverSeen: installationMap.size,
        activeUsersCurrently: activeCount,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to process analytics event' });
    }
  });

  // Anonymous Analytics Stats Endpoint
  app.get('/api/analytics/stats', (req, res) => {
    const now = Date.now();
    const THREE_MINUTES_MS = 3 * 60 * 1000;

    let activeUsersCurrently = 0;
    const versionCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};
    const displayModeCounts: Record<string, number> = {};

    installationMap.forEach((record) => {
      if (now - record.lastHeartbeat <= THREE_MINUTES_MS) {
        activeUsersCurrently++;
      }
      versionCounts[record.appVersion] = (versionCounts[record.appVersion] || 0) + 1;
      platformCounts[record.platform] = (platformCounts[record.platform] || 0) + 1;
      displayModeCounts[record.displayMode] = (displayModeCounts[record.displayMode] || 0) + 1;
    });

    const eventCounts: Record<string, number> = {};
    eventsLog.forEach((entry) => {
      eventCounts[entry.event] = (eventCounts[entry.event] || 0) + 1;
    });

    return res.json({
      metricDisclaimer: "Unique installations/devices ever seen (not a guaranteed count of human beings)",
      totalInstallationsEverSeen: installationMap.size,
      activeUsersCurrently,
      recentHeartbeatWindowMinutes: 3,
      eventsSummary: eventCounts,
      versionsSummary: versionCounts,
      platformsSummary: platformCounts,
      displayModesSummary: displayModeCounts,
      totalEventsLogged: eventsLog.length,
      serverTimestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
