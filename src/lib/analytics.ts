// Google Analytics (GA4) & Marketing Traffic Source Tracker
// Ponytail-compliant: Minimal, zero external npm bloat, native browser APIs

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface TrafficSourceInfo {
  source: string; // e.g. "facebook", "tiktok", "zalo", "google", "direct"
  medium?: string; // e.g. "cpc", "social", "organic", "referral"
  campaign?: string; // e.g. "k26_back_to_school"
  timestamp: number;
}

const TRAFFIC_STORAGE_KEY = "ptx_traffic_sources_v1";

/**
 * Capture incoming UTM parameters or document referrer
 */
export function recordTrafficSource(): TrafficSourceInfo {
  if (typeof window === "undefined") {
    return { source: "direct", timestamp: Date.now() };
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");

  let source = "direct";
  let medium = "none";

  if (utmSource) {
    source = utmSource.toLowerCase();
    medium = utmMedium || "campaign";
  } else if (document.referrer) {
    const ref = document.referrer.toLowerCase();
    if (ref.includes("facebook.com") || ref.includes("fb.me")) {
      source = "facebook";
      medium = "social";
    } else if (ref.includes("tiktok.com")) {
      source = "tiktok";
      medium = "social";
    } else if (ref.includes("zalo.me") || ref.includes("chat.zalo.me")) {
      source = "zalo";
      medium = "chat";
    } else if (ref.includes("google.com") || ref.includes("google.com.vn")) {
      source = "google";
      medium = "organic";
    } else if (ref.includes("instagram.com")) {
      source = "instagram";
      medium = "social";
    } else {
      try {
        source = new URL(document.referrer).hostname;
        medium = "referral";
      } catch {
        source = "referral";
      }
    }
  }

  const record: TrafficSourceInfo = {
    source,
    medium,
    campaign: utmCampaign || undefined,
    timestamp: Date.now(),
  };

  try {
    const existingRaw = localStorage.getItem(TRAFFIC_STORAGE_KEY);
    const list: TrafficSourceInfo[] = existingRaw ? JSON.parse(existingRaw) : [];
    // Keep max 100 recent sessions
    list.unshift(record);
    if (list.length > 100) list.length = 100;
    localStorage.setItem(TRAFFIC_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore local storage errors
  }

  return record;
}

/**
 * Get aggregated traffic sources stats for admin dashboard (100% real recorded sessions)
 */
export function getTrafficStats() {
  const sourcesMap: Record<
    string,
    { count: number; name: string; shortName: string; color: string; hex: string; icon: string }
  > = {
    facebook: {
      count: 0,
      name: "Facebook (Ads & Fanpage)",
      shortName: "Facebook",
      color: "bg-blue-600",
      hex: "#2563eb",
      icon: "facebook",
    },
    tiktok: {
      count: 0,
      name: "TikTok (Video & Bio Link)",
      shortName: "TikTok",
      color: "bg-zinc-900 dark:bg-zinc-700",
      hex: "#18181b",
      icon: "tiktok",
    },
    zalo: {
      count: 0,
      name: "Zalo (Cộng đồng sinh viên)",
      shortName: "Zalo",
      color: "bg-sky-500",
      hex: "#0ea5e9",
      icon: "zalo",
    },
    google: {
      count: 0,
      name: "Google (Tìm kiếm tự nhiên)",
      shortName: "Google",
      color: "bg-emerald-600",
      hex: "#059669",
      icon: "google",
    },
    direct: {
      count: 0,
      name: "Truy cập trực tiếp / Link",
      shortName: "Trực tiếp",
      color: "bg-purple-600",
      hex: "#9333ea",
      icon: "direct",
    },
  };

  try {
    const existingRaw = localStorage.getItem(TRAFFIC_STORAGE_KEY);
    const list: TrafficSourceInfo[] = existingRaw ? JSON.parse(existingRaw) : [];

    for (const item of list) {
      const s = item.source.toLowerCase();
      if (s.includes("facebook") || s.includes("fb")) {
        sourcesMap.facebook.count++;
      } else if (s.includes("tiktok")) {
        sourcesMap.tiktok.count++;
      } else if (s.includes("zalo")) {
        sourcesMap.zalo.count++;
      } else if (s.includes("google")) {
        sourcesMap.google.count++;
      } else {
        sourcesMap.direct.count++;
      }
    }
  } catch {
    // ignore
  }

  const finalTotal = Object.values(sourcesMap).reduce((acc, curr) => acc + curr.count, 0);

  return Object.entries(sourcesMap).map(([key, val]) => ({
    key,
    name: val.name,
    shortName: val.shortName,
    count: val.count,
    color: val.color,
    hex: val.hex,
    percentage: finalTotal > 0 ? Math.round((val.count / finalTotal) * 100) : 0,
  }));
}

/**
 * Initialize Google Analytics 4 (GA4) dynamically if Measurement ID is set
 */
export function initGoogleAnalytics(): boolean {
  if (typeof window === "undefined") return false;

  const gaId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
  if (!gaId || !gaId.startsWith("G-")) {
    return false;
  }

  if (document.getElementById("ga4-script")) {
    return true; // Already initialized
  }

  // Inject gtag.js
  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId, {
    send_page_view: true,
  });

  return true;
}

/**
 * Track custom event in GA4
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}
