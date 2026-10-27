import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Compass,
  ChevronDown,
  Heart,
  ArrowRight,
  Eye,
} from "lucide-react";
import {
  resolveTourForLocation,
  type TourSpot,
  type LabelSide,
} from "@/lib/tourSpots";
import { roomsApi } from "@/features/rooms/api/roomsApi";
import { cn } from "@/lib/utils";

interface MeasuredSpot extends TourSpot {
  index: number;
  el: Element;
  spotTop: number;
  spotLeft: number;
  spotWidth: number;
  spotHeight: number;
}

interface PopoverPlacement {
  top: number;
  left: number;
  width: number;
  side: LabelSide | "floating";
  arrowLeft?: number;
  arrowTop?: number;
}

interface FlowHintState {
  type: "ROOM_LIKED";
  roomId: string;
  roomTitle: string;
}

/**
 * Find the first visible DOM element matching a (possibly comma-separated) selector
 */
function findVisibleElement(selector: string): Element | null {
  const parts = selector
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const part of parts) {
    try {
      const nodes = document.querySelectorAll(part);
      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        const r = el.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) {
          return el;
        }
      }
    } catch {
      // ignore invalid selector
    }
  }
  return null;
}

/**
 * Measure all valid spots that currently exist and are visible in the DOM
 */
function measureAvailableSpots(spots: TourSpot[]): MeasuredSpot[] {
  if (typeof window === "undefined") return [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const results: MeasuredSpot[] = [];

  spots.forEach((spot) => {
    const el = findVisibleElement(spot.selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 4 || r.height <= 4) return;

    const pad = spot.pad ?? 8;
    const maxH = spot.maxSpotHeight ?? Math.round(vh * 0.58);
    const isHeaderOrSidebar = Boolean(el.closest("header, aside"));
    const minTop = isHeaderOrSidebar ? 6 : 68;

    const clampedTop = Math.max(minTop, Math.min(r.top, vh - 48));
    const visibleHeight = r.top < minTop ? Math.max(32, r.bottom - minTop) : r.height;
    const availableH = Math.max(32, vh - clampedTop - 12);
    const clampedHeight = Math.min(visibleHeight, maxH, availableH);

    const clampedLeft = Math.max(6, Math.min(r.left, vw - 48));
    const clampedWidth = Math.min(r.width, vw - clampedLeft - 6);

    results.push({
      ...spot,
      index: results.length,
      el,
      spotTop: Math.max(isHeaderOrSidebar ? 4 : 66, clampedTop - pad),
      spotLeft: Math.max(4, clampedLeft - pad),
      spotWidth: Math.min(vw - 8, clampedWidth + pad * 2),
      spotHeight: Math.min(vh - 8, clampedHeight + pad * 2),
    });
  });

  return results;
}

/**
 * Compute zero-overlap placement for the single anchored Tutorial Popover Card
 */
function computePopoverPlacement(
  spot: MeasuredSpot | undefined,
  vw: number,
  vh: number,
  cardH: number
): PopoverPlacement {
  const cardW = Math.min(392, vw - 24);
  const GAP = 16;
  const MARGIN = 14;

  if (!spot) {
    return {
      top: Math.max(MARGIN, Math.round((vh - cardH) / 2)),
      left: Math.max(MARGIN, Math.round((vw - cardW) / 2)),
      width: cardW,
      side: "floating",
    };
  }

  const sTop = spot.spotTop;
  const sLeft = spot.spotLeft;
  const sRight = spot.spotLeft + spot.spotWidth;
  const sBottom = spot.spotTop + spot.spotHeight;
  const sCenterX = sLeft + spot.spotWidth / 2;
  const sCenterY = sTop + spot.spotHeight / 2;

  const spaceBottom = vh - sBottom - MARGIN;
  const spaceTop = sTop - MARGIN;
  const spaceRight = vw - sRight - MARGIN;
  const spaceLeft = sLeft - MARGIN;

  const preferred = spot.labelSide || "bottom";
  const order: LabelSide[] = [preferred];
  (["bottom", "top", "right", "left"] as LabelSide[]).forEach((dir) => {
    if (!order.includes(dir)) order.push(dir);
  });

  for (const dir of order) {
    if (dir === "bottom" && spaceBottom >= cardH + GAP) {
      const left = Math.max(
        MARGIN,
        Math.min(Math.round(sCenterX - cardW / 2), vw - cardW - MARGIN)
      );
      return {
        top: Math.round(sBottom + GAP),
        left,
        width: cardW,
        side: "bottom",
        arrowLeft: Math.max(28, Math.min(Math.round(sCenterX - left), cardW - 28)),
      };
    }

    if (dir === "top" && spaceTop >= cardH + GAP) {
      const left = Math.max(
        MARGIN,
        Math.min(Math.round(sCenterX - cardW / 2), vw - cardW - MARGIN)
      );
      return {
        top: Math.round(sTop - GAP - cardH),
        left,
        width: cardW,
        side: "top",
        arrowLeft: Math.max(28, Math.min(Math.round(sCenterX - left), cardW - 28)),
      };
    }

    if (dir === "right" && spaceRight >= cardW + GAP) {
      const top = Math.max(
        MARGIN,
        Math.min(Math.round(sCenterY - cardH / 2), vh - cardH - MARGIN)
      );
      return {
        top,
        left: Math.round(sRight + GAP),
        width: cardW,
        side: "right",
        arrowTop: Math.max(28, Math.min(Math.round(sCenterY - top), cardH - 28)),
      };
    }

    if (dir === "left" && spaceLeft >= cardW + GAP) {
      const top = Math.max(
        MARGIN,
        Math.min(Math.round(sCenterY - cardH / 2), vh - cardH - MARGIN)
      );
      return {
        top,
        left: Math.round(sLeft - GAP - cardW),
        width: cardW,
        side: "left",
        arrowTop: Math.max(28, Math.min(Math.round(sCenterY - top), cardH - 28)),
      };
    }
  }

  // Fallback when spotlight element is wide/tall: pick the side with the most room
  if (vw >= 1024 && Math.max(spaceRight, spaceLeft) >= 280) {
    if (spaceRight >= spaceLeft) {
      const w = Math.min(cardW, Math.max(280, spaceRight - 12));
      const top = Math.max(
        MARGIN,
        Math.min(Math.round(sCenterY - cardH / 2), vh - cardH - MARGIN)
      );
      return {
        top,
        left: Math.round(vw - w - MARGIN),
        width: w,
        side: "right",
        arrowTop: Math.max(28, Math.min(Math.round(sCenterY - top), cardH - 28)),
      };
    } else {
      const w = Math.min(cardW, Math.max(280, spaceLeft - 12));
      const top = Math.max(
        MARGIN,
        Math.min(Math.round(sCenterY - cardH / 2), vh - cardH - MARGIN)
      );
      return {
        top,
        left: MARGIN,
        width: w,
        side: "left",
        arrowTop: Math.max(28, Math.min(Math.round(sCenterY - top), cardH - 28)),
      };
    }
  }

  const putBottom = spaceBottom >= spaceTop;
  const left = Math.max(
    MARGIN,
    Math.min(Math.round(sCenterX - cardW / 2), vw - cardW - MARGIN)
  );
  return {
    top: putBottom ? Math.max(MARGIN, vh - cardH - MARGIN) : MARGIN,
    left,
    width: cardW,
    side: putBottom ? "bottom" : "top",
    arrowLeft: Math.max(28, Math.min(Math.round(sCenterX - left), cardW - 28)),
  };
}

/**
 * Resolve a valid sample room ID for the "/rooms/__sample__" tour step
 */
async function resolveSampleRoomId(pathname: string): Promise<string | null> {
  if (pathname.startsWith("/rooms/")) {
    const currentId = pathname.split("/rooms/")[1]?.split("/")[0]?.split("?")[0];
    if (currentId && currentId !== "__sample__") return currentId;
  }

  try {
    const sample = localStorage.getItem("ptx_sample_room_id");
    if (sample && sample !== "undefined" && sample !== "null") return sample;

    const savedRaw = localStorage.getItem("ptx_saved_room_ids");
    if (savedRaw) {
      const parsed = JSON.parse(savedRaw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
        return String(parsed[0]);
      }
    }
  } catch {
    // ignore storage errors
  }

  const linkEl = document.querySelector<HTMLAnchorElement>("a[href^='/rooms/']");
  if (linkEl) {
    const href = linkEl.getAttribute("href") || "";
    const idFromDom = href.replace("/rooms/", "").split("?")[0].split("/")[0];
    if (idFromDom && idFromDom !== "__sample__") {
      try {
        localStorage.setItem("ptx_sample_room_id", idFromDom);
      } catch {
        // ignore
      }
      return idFromDom;
    }
  }

  try {
    const page: any = await roomsApi.getRooms({ page: 0, size: 1 });
    const first = page?.items?.[0] || page?.content?.[0];
    if (first?.id) {
      const idStr = String(first.id);
      try {
        localStorage.setItem("ptx_sample_room_id", idStr);
      } catch {
        // ignore
      }
      return idStr;
    }
  } catch {
    // ignore API error
  }

  return null;
}

export interface TourGuideProps {
  active: boolean;
  onClose: () => void;
  role?: "tenant" | "landlord";
}

export function TourGuide({ active, onClose, role = "tenant" }: TourGuideProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [stepIdx, setStepIdx] = useState<number>(0);
  const [measuredSpots, setMeasuredSpots] = useState<MeasuredSpot[]>([]);
  const [viewport, setViewport] = useState<{ vw: number; vh: number }>({
    vw: typeof window !== "undefined" ? window.innerWidth : 1280,
    vh: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const [cardHeight, setCardHeight] = useState<number>(240);
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState(false);

  // Reactive Flow Coachmark state (when user likes a room on /discover)
  const [flowHint, setFlowHint] = useState<FlowHintState | null>(null);
  const [savedIconRect, setSavedIconRect] = useState<DOMRect | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);

  const tourConfig = useMemo(
    () => resolveTourForLocation(location.pathname, location.search, role),
    [location.pathname, location.search, role]
  );

  // Listen for reactive flow events (e.g. ROOM_LIKED on /discover)
  useEffect(() => {
    const handleFlowHint = (e: Event) => {
      const custom = e as CustomEvent<FlowHintState>;
      if (!custom.detail || custom.detail.type !== "ROOM_LIKED") return;
      if (active) return;

      const iconEl = findVisibleElement("[data-tour='nav-icon-saved']");
      if (iconEl) {
        setSavedIconRect(iconEl.getBoundingClientRect());
      }
      setFlowHint(custom.detail);
    };

    window.addEventListener("ptx:flow-hint", handleFlowHint);
    return () => window.removeEventListener("ptx:flow-hint", handleFlowHint);
  }, [active]);

  useEffect(() => {
    setFlowHint(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!flowHint) return;
    const timer = window.setTimeout(() => setFlowHint(null), 12000);
    return () => window.clearTimeout(timer);
  }, [flowHint]);

  const remeasure = useCallback(() => {
    if (!active || typeof window === "undefined") return;
    setViewport({ vw: window.innerWidth, vh: window.innerHeight });
    setMeasuredSpots(measureAvailableSpots(tourConfig.spots));
  }, [active, tourConfig.spots]);

  // Reset step to 0 whenever route/tab changes
  useEffect(() => {
    setStepIdx(0);
    setIsChapterMenuOpen(false);
  }, [location.pathname, location.search]);

  // Measure card height dynamically so placement math is always exact
  useEffect(() => {
    if (!active || !cardRef.current) return;
    const updateHeight = () => {
      if (cardRef.current) {
        setCardHeight(cardRef.current.offsetHeight || 240);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, [active, stepIdx, measuredSpots.length, isChapterMenuOpen]);

  // Measure DOM on open, route change, resize, and scroll
  useEffect(() => {
    if (!active) {
      setMeasuredSpots([]);
      return;
    }

    remeasure();
    const t1 = window.setTimeout(remeasure, 80);
    const t2 = window.setTimeout(remeasure, 280);
    const t3 = window.setTimeout(remeasure, 650);

    let rafId: number | null = null;
    const mo = new MutationObserver(() => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        remeasure();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, { passive: true, capture: true });
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      mo.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [active, remeasure, location.pathname, location.search]);

  const safeStepIdx =
    measuredSpots.length > 0 ? Math.min(stepIdx, measuredSpots.length - 1) : 0;
  const activeSpot = measuredSpots[safeStepIdx];

  // Scroll the active element into view if needed AND apply subtle zoom on compact buttons
  useEffect(() => {
    if (!active) return;

    document
      .querySelectorAll("[data-tour-focused='true']")
      .forEach((node) => node.removeAttribute("data-tour-focused"));

    if (!activeSpot?.el) return;
    const el = activeSpot.el;

    const rect = el.getBoundingClientRect();
    if (rect.width < 480 && rect.height < 180) {
      el.setAttribute("data-tour-focused", "true");
    }

    const vh = window.innerHeight;
    const isHeaderOrSidebar = Boolean(el.closest("header, aside"));
    const absTop = rect.top + window.scrollY;

    if (!isHeaderOrSidebar) {
      if (absTop < 440 && window.scrollY > 12) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const tTop = window.setTimeout(remeasure, 340);
        return () => {
          window.clearTimeout(tTop);
          el.removeAttribute("data-tour-focused");
        };
      }

      const isOffScreen = rect.top < 84 || rect.bottom > vh - 48;
      if (isOffScreen && absTop >= 440) {
        window.scrollTo({
          top: Math.max(0, absTop - 96),
          behavior: "smooth",
        });
        const tScroll = window.setTimeout(remeasure, 340);
        return () => {
          window.clearTimeout(tScroll);
          el.removeAttribute("data-tour-focused");
        };
      }
    }

    const tMeasure = window.setTimeout(remeasure, 50);
    return () => {
      window.clearTimeout(tMeasure);
      el.removeAttribute("data-tour-focused");
    };
  }, [active, safeStepIdx, activeSpot?.el, remeasure]);

  useEffect(() => {
    if (!active) {
      document
        .querySelectorAll("[data-tour-focused='true']")
        .forEach((node) => node.removeAttribute("data-tour-focused"));
    }
  }, [active]);

  const hasNextFlow = tourConfig.activeFlowIndex < tourConfig.flows.length - 1;
  const nextFlow = hasNextFlow
    ? tourConfig.flows[tourConfig.activeFlowIndex + 1]
    : null;

  const handleSwitchFlow = useCallback(
    async (targetRoute: string) => {
      setIsChapterMenuOpen(false);
      if (targetRoute === "/rooms/__sample__") {
        const roomId = await resolveSampleRoomId(location.pathname);
        if (roomId) {
          navigate(`/rooms/${roomId}?tour=1`);
        } else {
          navigate("/saved?tour=1");
        }
        return;
      }
      const hasQuery = targetRoute.includes("?");
      const nextUrl = `${targetRoute}${hasQuery ? "&" : "?"}tour=1`;
      navigate(nextUrl);
    },
    [navigate, location.pathname]
  );

  const handleNextStep = useCallback(() => {
    if (safeStepIdx < measuredSpots.length - 1) {
      setStepIdx(safeStepIdx + 1);
    } else if (nextFlow) {
      void handleSwitchFlow(nextFlow.route);
    } else {
      onClose();
    }
  }, [safeStepIdx, measuredSpots.length, nextFlow, handleSwitchFlow, onClose]);

  const handlePrevStep = useCallback(() => {
    if (safeStepIdx > 0) {
      setStepIdx(safeStepIdx - 1);
    } else if (tourConfig.activeFlowIndex > 0) {
      const prevFlow = tourConfig.flows[tourConfig.activeFlowIndex - 1];
      void handleSwitchFlow(prevFlow.route);
    }
  }, [safeStepIdx, tourConfig.activeFlowIndex, tourConfig.flows, handleSwitchFlow]);

  // Keyboard navigation
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevStep();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onClose, handleNextStep, handlePrevStep]);

  if (typeof document === "undefined") return null;

  // Contextual Coachmark when user likes a room on /discover
  if (!active && flowHint) {
    const iconTop = savedIconRect ? savedIconRect.top : 14;
    const iconLeft = savedIconRect ? savedIconRect.left : window.innerWidth - 180;
    const iconW = savedIconRect ? savedIconRect.width : 36;
    const iconH = savedIconRect ? savedIconRect.height : 36;

    return createPortal(
      <div className="pointer-events-none fixed inset-0 z-[9990] select-none">
        <style>{`
          @keyframes ptx-coach-pulse {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.22); opacity: 0.35; }
          }
        `}</style>

        {savedIconRect && (
          <div
            className="pointer-events-none fixed rounded-full border-2 border-rose-500 shadow-[0_0_24px_6px_rgba(244,63,94,0.55)]"
            style={{
              top: iconTop - 5,
              left: iconLeft - 5,
              width: iconW + 10,
              height: iconH + 10,
              animation: "ptx-coach-pulse 1.6s infinite ease-in-out",
            }}
          />
        )}

        <div
          className="pointer-events-auto fixed z-[9995] w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_20px_50px_-12px_rgba(2,6,23,0.35)] animate-fade-in"
          style={{
            top: Math.max(68, iconTop + iconH + 12),
            right: Math.max(16, window.innerWidth - (iconLeft + iconW) - 12),
          }}
        >
          <div className="pointer-events-none absolute -top-2 right-5 size-3.5 rotate-45 border-l border-t border-slate-200 bg-white" />

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-500">
                <Heart className="size-4 fill-rose-500" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-emerald-700">Đã lưu vào Phòng đã thích</p>
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {flowHint.roomTitle}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFlowHint(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              aria-label="Đóng"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Bạn có thể xem chi tiết phòng này để đặt lịch hẹn hoặc mở danh sách Phòng đã thích ở biểu tượng trái tim phía trên:
          </p>

          <div className="mt-3 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                const rid = flowHint.roomId;
                setFlowHint(null);
                navigate(`/rooms/${rid}`);
              }}
              className="flex w-full items-center justify-between rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-3.5" />
                Xem chi tiết & Đặt lịch hẹn
              </span>
              <ArrowRight className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setFlowHint(null);
                navigate("/saved");
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
            >
              <Heart className="size-3.5 text-rose-500" /> Mở danh sách Phòng đã thích
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!active) return null;

  const { vw, vh } = viewport;
  const placement = computePopoverPlacement(activeSpot, vw, vh, cardHeight);
  const progressPct =
    measuredSpots.length > 0
      ? Math.round(((safeStepIdx + 1) / measuredSpots.length) * 100)
      : 100;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn sử dụng"
    >
      <style>{`
        [data-tour-focused="true"] {
          transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1) !important;
          transform: scale(1.04) !important;
        }
        @keyframes ptx-radar-ring {
          0% { transform: scale(0.99); opacity: 0.85; }
          75% { transform: scale(1.035); opacity: 0.15; }
          100% { transform: scale(1.05); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-tour-focused="true"] { transform: none !important; }
        }
      `}</style>

      {/* Clickable full-screen backdrop layer (dismisses open chapter dropdown) */}
      <div
        className="fixed inset-0 z-[9999]"
        onClick={() => setIsChapterMenuOpen(false)}
      />

      {/* 1. Clean Spotlight Cutout Box (Zero obstruction over the highlighted UI) */}
      {activeSpot ? (
        <div
          className="pointer-events-none fixed z-[10000] rounded-2xl"
          style={{
            top: activeSpot.spotTop,
            left: activeSpot.spotLeft,
            width: activeSpot.spotWidth,
            height: activeSpot.spotHeight,
            boxShadow:
              "0 0 0 9999px rgba(2, 6, 23, 0.72), 0 0 0 2.5px #10b981, 0 0 28px 4px rgba(16, 185, 129, 0.38)",
            transition:
              "top 320ms cubic-bezier(0.22, 1, 0.36, 1), left 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div
            className="pointer-events-none absolute -inset-1.5 rounded-[18px] border border-emerald-400/80"
            style={{ animation: "ptx-radar-ring 1.8s infinite ease-out" }}
          />
        </div>
      ) : (
        <div className="pointer-events-none fixed inset-0 z-[10000] bg-slate-950/72" />
      )}

      {/* 2. Single Anchored Popover Card (Clean, Crisp Corners, Concise Content) */}
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[10005] rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-[0_24px_60px_-15px_rgba(2,6,23,0.6)]"
        style={{
          top: placement.top,
          left: placement.left,
          width: placement.width,
          transition:
            "top 300ms cubic-bezier(0.22, 1, 0.36, 1), left 300ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Directional Arrow pointing directly at the Spotlighted Element */}
        {placement.side === "bottom" && placement.arrowLeft != null && (
          <div
            className="pointer-events-none absolute -top-2 size-3.5 rotate-45 border-l border-t border-slate-200 bg-white"
            style={{ left: placement.arrowLeft - 7 }}
          />
        )}
        {placement.side === "top" && placement.arrowLeft != null && (
          <div
            className="pointer-events-none absolute -bottom-2 size-3.5 rotate-45 border-b border-r border-slate-200 bg-white"
            style={{ left: placement.arrowLeft - 7 }}
          />
        )}
        {placement.side === "right" && placement.arrowTop != null && (
          <div
            className="pointer-events-none absolute -left-2 size-3.5 rotate-45 border-b border-l border-slate-200 bg-white"
            style={{ top: placement.arrowTop - 7 }}
          />
        )}
        {placement.side === "left" && placement.arrowTop != null && (
          <div
            className="pointer-events-none absolute -right-2 size-3.5 rotate-45 border-r border-t border-slate-200 bg-white"
            style={{ top: placement.arrowTop - 7 }}
          />
        )}

        {/* Card Top Bar: Screen Selector Dropdown + Step Counter + Close Button */}
        <div className="relative flex items-center justify-between gap-2 px-4 py-2.5">
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => setIsChapterMenuOpen((prev) => !prev)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
              title="Chuyển nhanh sang màn hình khác"
            >
              <Compass className="size-3.5 shrink-0 text-emerald-600" />
              <span className="truncate">
                {tourConfig.flows[tourConfig.activeFlowIndex]?.shortTitle}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 text-slate-500 transition-transform duration-150",
                  isChapterMenuOpen && "rotate-180"
                )}
              />
            </button>

            {isChapterMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Chọn màn hình hướng dẫn
                </p>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {tourConfig.flows.map((flow, idx) => {
                    const isCurrent = idx === tourConfig.activeFlowIndex;
                    return (
                      <button
                        key={flow.id}
                        type="button"
                        onClick={() => void handleSwitchFlow(flow.route)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer",
                          isCurrent
                            ? "bg-emerald-600 text-white font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span className="truncate">{flow.shortTitle}</span>
                        {isCurrent && <CheckCircle2 className="size-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {measuredSpots.length > 0 && (
              <span className="text-xs font-semibold text-slate-400 tabular-nums">
                {safeStepIdx + 1} / {measuredSpots.length}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hướng dẫn"
              title="Đóng hướng dẫn (Esc)"
              className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar placed cleanly inside the card below the header (zero corner bleed) */}
        <div className="h-[3px] w-full bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Card Main Body: Concise, Easy-to-Read Content */}
        <div className="p-4">
          {activeSpot ? (
            <>
              <h3 className="text-[15px] font-bold text-slate-900 leading-snug text-pretty">
                {activeSpot.label}
              </h3>

              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 text-pretty">
                {activeSpot.description}
              </p>

              {activeSpot.bullets && activeSpot.bullets.length > 0 && (
                <ul className="mt-2.5 space-y-1.5 border-l-2 border-emerald-500/40 pl-3">
                  {activeSpot.bullets.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs leading-relaxed text-slate-600 text-pretty"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="py-1">
              <h3 className="text-[15px] font-bold text-slate-900">
                {tourConfig.currentTitle}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                {tourConfig.currentSummary}
              </p>
            </div>
          )}

          {/* Card Footer: Prev / Dots / Next */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={safeStepIdx === 0 && tourConfig.activeFlowIndex === 0}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
              <span>Quay lại</span>
            </button>

            {measuredSpots.length > 1 && (
              <div className="flex items-center gap-1.5">
                {measuredSpots.map((s, idx) => (
                  <button
                    key={s.selector + idx}
                    type="button"
                    onClick={() => setStepIdx(idx)}
                    aria-label={`Mục ${idx + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-200 cursor-pointer",
                      idx === safeStepIdx
                        ? "w-4 bg-emerald-600"
                        : "w-1.5 bg-slate-200 hover:bg-slate-300"
                    )}
                  />
                ))}
              </div>
            )}

            {safeStepIdx < measuredSpots.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <span>Tiếp theo</span>
                <ChevronRight className="size-3.5" />
              </button>
            ) : nextFlow ? (
              <button
                type="button"
                onClick={() => void handleSwitchFlow(nextFlow.route)}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <span>Mở: {nextFlow.shortTitle.replace(/^\d+\.\s*/, "")}</span>
                <ChevronRight className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Hoàn tất</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
