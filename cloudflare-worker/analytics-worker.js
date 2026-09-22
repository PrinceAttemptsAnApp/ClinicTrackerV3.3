/**
 * DentaTrack Anonymous Usage Analytics Cloudflare Worker
 * 
 * Deployment Instructions for Cloudflare Workers:
 * 1. Create a Cloudflare Worker in your Cloudflare Dashboard.
 * 2. Create a KV Namespace named `DENTATRACK_KV` and bind it to the Worker as `DENTATRACK_KV`.
 * 3. (Optional & Recommended) Set a Secret named `ANALYTICS_STATS_SECRET` under Settings -> Variables.
 * 4. Copy & paste this worker code into the Cloudflare Worker editor and click Save & Deploy.
 * 5. Set VITE_ANALYTICS_ENDPOINT in your build environment pointing to:
 *    https://<your-worker-name>.<your-subdomain>.workers.dev/api/analytics/event
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS Headers for GitHub Pages frontend & management queries
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-analytics-secret",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Ingest Public Anonymous Analytics Events (No secret required)
    if (url.pathname === "/api/analytics/event" && request.method === "POST") {
      try {
        const body = await request.json();
        const {
          anonymousInstallationId,
          event,
          appVersion = "3.3.0",
          displayMode = "browser",
          platform = "other",
          timestamp = new Date().toISOString(),
        } = body || {};

        if (!anonymousInstallationId) {
          return new Response(JSON.stringify({ error: "Missing anonymousInstallationId" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const now = Date.now();
        const installationKey = `inst:${anonymousInstallationId}`;

        if (env.DENTATRACK_KV) {
          const existingRaw = await env.DENTATRACK_KV.get(installationKey);
          let record = existingRaw ? JSON.parse(existingRaw) : null;

          if (record) {
            record.lastSeen = timestamp;
            record.lastHeartbeat = now;
            record.appVersion = appVersion;
            record.displayMode = displayMode;
            record.platform = platform;
          } else {
            record = {
              firstSeen: timestamp,
              lastSeen: timestamp,
              lastHeartbeat: now,
              appVersion,
              displayMode,
              platform,
            };
          }

          // Store installation record in Cloudflare KV
          await env.DENTATRACK_KV.put(installationKey, JSON.stringify(record));

          // Increment event counter in Cloudflare KV
          const eventKey = `evt_count:${event || "unknown"}`;
          const currentCount = parseInt((await env.DENTATRACK_KV.get(eventKey)) || "0", 10);
          await env.DENTATRACK_KV.put(eventKey, String(currentCount + 1));
        }

        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to process analytics event" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2. Private Statistics Endpoint (Protected by ANALYTICS_STATS_SECRET)
    if (url.pathname === "/api/analytics/stats" && request.method === "GET") {
      // Authorization Check
      if (env.ANALYTICS_STATS_SECRET) {
        const authHeader = request.headers.get("Authorization") || "";
        const customHeader = request.headers.get("x-analytics-secret") || "";
        const querySecret = url.searchParams.get("secret") || "";

        const token = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : authHeader.trim() || customHeader.trim() || querySecret.trim();

        if (!token || token !== env.ANALYTICS_STATS_SECRET) {
          return new Response(
            JSON.stringify({ error: "Unauthorized: Invalid or missing analytics stats secret" }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      try {
        let totalInstallationsEverSeen = 0;
        let activeUsersCurrently = 0;
        const now = Date.now();
        const THREE_MINUTES_MS = 3 * 60 * 1000;

        const versionCounts = {};
        const platformCounts = {};
        const displayModeCounts = {};

        if (env.DENTATRACK_KV) {
          // List all installations
          const list = await env.DENTATRACK_KV.list({ prefix: "inst:" });
          totalInstallationsEverSeen = list.keys.length;

          for (const key of list.keys) {
            const raw = await env.DENTATRACK_KV.get(key.name);
            if (raw) {
              const record = JSON.parse(raw);
              if (now - record.lastHeartbeat <= THREE_MINUTES_MS) {
                activeUsersCurrently++;
              }
              if (record.appVersion) {
                versionCounts[record.appVersion] = (versionCounts[record.appVersion] || 0) + 1;
              }
              if (record.platform) {
                platformCounts[record.platform] = (platformCounts[record.platform] || 0) + 1;
              }
              if (record.displayMode) {
                displayModeCounts[record.displayMode] = (displayModeCounts[record.displayMode] || 0) + 1;
              }
            }
          }
        }

        // Fetch individual event counts from KV
        const eventTypes = [
          "app_opened",
          "case_created",
          "procedure_created",
          "case_exported",
          "pwa_installed",
          "heartbeat",
        ];
        const eventCounts = {};

        if (env.DENTATRACK_KV) {
          for (const evt of eventTypes) {
            const val = await env.DENTATRACK_KV.get(`evt_count:${evt}`);
            eventCounts[evt] = parseInt(val || "0", 10);
          }
        } else {
          for (const evt of eventTypes) {
            eventCounts[evt] = 0;
          }
        }

        return new Response(
          JSON.stringify({
            metricDisclaimer: "Unique installations/devices ever seen (not a guaranteed count of human beings)",
            totalInstallationsEverSeen,
            activeUsersCurrently,
            recentHeartbeatWindowMinutes: 3,
            events: {
              app_opened: eventCounts.app_opened || 0,
              case_created: eventCounts.case_created || 0,
              procedure_created: eventCounts.procedure_created || 0,
              case_exported: eventCounts.case_exported || 0,
              pwa_installed: eventCounts.pwa_installed || 0,
              heartbeat: eventCounts.heartbeat || 0,
            },
            breakdown: {
              appVersion: versionCounts,
              platform: platformCounts,
              displayMode: displayModeCounts,
            },
            serverTimestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to fetch stats" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};
