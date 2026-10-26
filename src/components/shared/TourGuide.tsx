import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Compass,
  ChevronDown,
  MousePointerClick,
} from "lucide-react";
import {
  resolveTourForLocation,
  type TourSpot,
  type LabelSide,
} from "@/lib/tourSpots";
import { cn } from "@/lib/utils";

interface MeasuredSpot extends TourSpot {
  index: number;
  el: Element;
  /** Raw element bounding box */
  rawTop: number;
  rawLeft: number;
  rawWidth: number;
  rawHeight: number;
  /** Clamped spotlight cutout box in viewport coordinates */
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
 * Measure only the valid spots that currently exist and are visible in the DOM
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
    const maxH = spot.maxSpotHeight ?? Math.round(vh * 0.52);

    // Clamp spotlight cutout so huge tables/sidebars never cut out 90% of the screen
    const clampedTop = Math.max(8, Math.min(r.top, vh - 48));
    const availableH = Math.max(36, vh - clampedTop - 16);
    const clampedHeight = Math.min(r.height, maxH, availableH);

    const clampedLeft = Math.max(8, Math.min(r.left, vw - 48));
    const clampedWidth = Math.min(r.width, vw - clampedLeft - 8);

    results.push({
      ...spot,
      index: results.length,
      el,
      rawTop: r.top,
      rawLeft: r.left,
      rawWidth: r.width,
      rawHeight: r.height,
      spotTop: clampedTop - pad,
      spotLeft: clampedLeft - pad,
      spotWidth: clampedWidth + pad * 2,
      spotHeight: clampedHeight + pad * 2,
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
  const cardW = Math.min(390, vw - 24);
  const GAP = 18;
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
        arrowLeft: Math.max(24, Math.min(Math.round(sCenterX - left), cardW - 24)),
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
        arrowLeft: Math.max(24, Math.min(Math.round(sCenterX - left), cardW - 24)),
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
        arrowTop: Math.max(24, Math.min(Math.round(sCenterY - top), cardH - 24)),
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
        arrowTop: Math.max(24, Math.min(Math.round(sCenterY - top), cardH - 24)),
      };
    }
  }

  // Fallback when spotlight element is large: pick the side with the most room
  if (vw >= 1024 && Math.max(spaceRight, spaceLeft) >= 280) {
    if (spaceRight >= spaceLeft) {
      const w = Math.min(cardW, Math.max(280, spaceRight - 12));
      const top = Math.max(MARGIN, Math.min(Math.round(sCenterY - cardH / 2), vh - cardH - MARGIN));
      return {
        top,
        left: Math.round(vw - w - MARGIN),
        width: w,
        side: "right",
        arrowTop: Math.max(24, Math.min(Math.round(sCenterY - top), cardH - 24)),
      };
    } else {
      const w = Math.min(cardW, Math.max(280, spaceLeft - 12));
      const top = Math.max(MARGIN, Math.min(Math.round(sCenterY - cardH / 2), vh - cardH - MARGIN));
      return {
        top,
        left: MARGIN,
        width: w,
        side: "left",
        arrowTop: Math.max(24, Math.min(Math.round(sCenterY - top), cardH - 24)),
      };
    }
  }

  // Vertical fallback: place at bottom or top edge away from spotlight center
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
    arrowLeft: Math.max(24, Math.min(Math.round(sCenterX - left), cardW - 24)),
  };
}

export interface TourGuideProps {
  active: boolean;
  onClose: () => void;
  role?: "tenant" | "landlord";
}

export function TourGuide({ active, onClose, role = "tenant" }: TourGuideProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [maskId] = useState(() => `ptx-tour-mask-${Math.random().toString(36).slice(2, 8)}`);

  const [stepIdx, setStepIdx] = useState<number>(0);
  const [measuredSpots, setMeasuredSpots] = useState<MeasuredSpot[]>([]);
  const [viewport, setViewport] = useState<{ vw: number; vh: number }>({
    vw: typeof window !== "undefined" ? window.innerWidth : 1280,
    vh: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  const [cardHeight, setCardHeight] = useState<number>(280);
  const [isChapterMenuOpen, setIsChapterMenuOpen] = useState(false);

  const cardRef = useRef<HTMLDivElement | null>(null);

  const tourConfig = useMemo(
    () => resolveTourForLocation(location.pathname, location.search, role),
    [location.pathname, location.search, role]
  );

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
        setCardHeight(cardRef.current.offsetHeight || 280);
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

    const t1 = window.setTimeout(remeasure, 80);
    const t2 = window.setTimeout(remeasure, 320);
    const t3 = window.setTimeout(remeasure, 750);
    const t4 = window.setTimeout(remeasure, 1400);

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
    window.addEventListener("scroll", remeasure, { passive: true });
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      mo.disconnect();
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure);
    };
  }, [active, remeasure, location.pathname, location.search]);

  const safeStepIdx =
    measuredSpots.length > 0 ? Math.min(stepIdx, measuredSpots.length - 1) : 0;
  const activeSpot = measuredSpots[safeStepIdx];

  // Scroll the active element into a comfortable viewport position AND apply zoom highlight
  useEffect(() => {
    if (!active) return;

    // Clean up any previous focused attribute first
    document
      .querySelectorAll("[data-tour-focused='true']")
      .forEach((node) => node.removeAttribute("data-tour-focused"));

    const rawSpot = tourConfig.spots[safeStepIdx];
    if (!rawSpot) return;
    const el = findVisibleElement(rawSpot.selector);
    if (!el) return;

    // Apply physical zoom-highlight effect on compact interactive elements (buttons, tabs, icons, headers)
    const rect = el.getBoundingClientRect();
    if (rect.width < 520 && rect.height < 220) {
      el.setAttribute("data-tour-focused", "true");
    }

    const vh = window.innerHeight;
    const isOffScreen = rect.top < 72 || rect.bottom > vh - 60;
    if (isOffScreen) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      const tScroll = window.setTimeout(remeasure, 360);
      return () => {
        window.clearTimeout(tScroll);
        el.removeAttribute("data-tour-focused");
      };
    }

    const tMeasure = window.setTimeout(remeasure, 60);
    return () => {
      window.clearTimeout(tMeasure);
      el.removeAttribute("data-tour-focused");
    };
  }, [active, safeStepIdx, tourConfig.spots, remeasure]);

  // Clean up focused attribute when TourGuide unmounts or closes
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
    (targetRoute: string) => {
      setIsChapterMenuOpen(false);
      const hasQuery = targetRoute.includes("?");
      const nextUrl = `${targetRoute}${hasQuery ? "&" : "?"}tour=1`;
      navigate(nextUrl);
    },
    [navigate]
  );

  const handleNextStep = useCallback(() => {
    if (safeStepIdx < measuredSpots.length - 1) {
      setStepIdx(safeStepIdx + 1);
    } else if (nextFlow) {
      handleSwitchFlow(nextFlow.route);
    } else {
      onClose();
    }
  }, [safeStepIdx, measuredSpots.length, nextFlow, handleSwitchFlow, onClose]);

  const handlePrevStep = useCallback(() => {
    if (safeStepIdx > 0) {
      setStepIdx(safeStepIdx - 1);
    } else if (tourConfig.activeFlowIndex > 0) {
      const prevFlow = tourConfig.flows[tourConfig.activeFlowIndex - 1];
      handleSwitchFlow(prevFlow.route);
    }
  }, [safeStepIdx, tourConfig.activeFlowIndex, tourConfig.flows, handleSwitchFlow]);

  // Keyboard navigation: ArrowRight / Enter -> Next, ArrowLeft -> Prev, Esc -> Close
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

  if (!active) return null;

  const { vw, vh } = viewport;
  const placement = computePopoverPlacement(activeSpot, vw, vh, cardHeight);
  const progressPct =
    measuredSpots.length > 0
      ? Math.round(((safeStepIdx + 1) / measuredSpots.length) * 100)
      : 100;

  return (
    <div
      className="fixed inset-0 z-[500] select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn sử dụng tương tác từng bước"
    >
      {/* Inject hardware-accelerated spotlight & target zoom styles */}
      <style>{`
        [data-tour-focused="true"] {
          transition: transform 280ms cubic-bezier(0.23, 1, 0.32, 1), filter 280ms cubic-bezier(0.23, 1, 0.32, 1) !important;
          transform: scale(1.05) !important;
        }
        @keyframes ptx-spotlight-pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.025); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-tour-focused="true"] {
            transform: none !important;
          }
        }
      `}</style>

      {/* 1. Dark Backdrop + Single Animated Spotlight Cutout */}
      <svg
        className="absolute inset-0 h-full w-full cursor-pointer"
        width={vw}
        height={vh}
        onClick={() => setIsChapterMenuOpen(false)}
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {activeSpot && (
              <rect
                x={activeSpot.spotLeft}
                y={activeSpot.spotTop}
                width={activeSpot.spotWidth}
                height={activeSpot.spotHeight}
                rx={16}
                fill="black"
                style={{
                  transition: "all 340ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              />
            )}
          </mask>
        </defs>

        {/* Deep Dark Scrim so the spotlighted element pops like a video tutorial */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.78)"
          mask={`url(#${maskId})`}
        />

        {/* Animated Emerald Spotlight Frame + Outer Radar Glow */}
        {activeSpot && (
          <g className="pointer-events-none">
            <rect
              x={activeSpot.spotLeft - 5}
              y={activeSpot.spotTop - 5}
              width={activeSpot.spotWidth + 10}
              height={activeSpot.spotHeight + 10}
              rx={20}
              fill="none"
              stroke="rgba(16, 185, 129, 0.45)"
              strokeWidth={3}
              style={{
                transition: "all 340ms cubic-bezier(0.23, 1, 0.32, 1)",
                animation: "ptx-spotlight-pulse 2s infinite ease-in-out",
                transformOrigin: `${activeSpot.spotLeft + activeSpot.spotWidth / 2}px ${
                  activeSpot.spotTop + activeSpot.spotHeight / 2
                }px`,
              }}
            />
            <rect
              x={activeSpot.spotLeft}
              y={activeSpot.spotTop}
              width={activeSpot.spotWidth}
              height={activeSpot.spotHeight}
              rx={16}
              fill="none"
              stroke="#10b981"
              strokeWidth={2.5}
              style={{
                transition: "all 340ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            />
          </g>
        )}
      </svg>

      {/* 2. Step Number Badge + Animated Pointer pinned on Spotlight Corner */}
      {activeSpot && (
        <div
          className="pointer-events-none fixed z-[502] flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-[0_6px_18px_rgba(5,150,105,0.55)] ring-2 ring-white"
          style={{
            top: Math.max(8, activeSpot.spotTop - 14),
            left: Math.max(8, Math.min(activeSpot.spotLeft - 6, vw - 110)),
            transition: "all 340ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          <MousePointerClick className="size-3.5 shrink-0" />
          <span>
            Bước {safeStepIdx + 1}/{measuredSpots.length}
          </span>
        </div>
      )}

      {/* 3. Single Anchored Tutorial Popover Card (Zero Overlap) */}
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="fixed z-[505] rounded-2xl border border-emerald-500/35 bg-white text-slate-900 shadow-[0_24px_60px_-15px_rgba(2,6,23,0.65)] ring-1 ring-black/5"
        style={{
          top: placement.top,
          left: placement.left,
          width: placement.width,
          transition:
            "top 320ms cubic-bezier(0.23, 1, 0.32, 1), left 320ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {/* Directional Arrow pointing directly at the Spotlighted Element */}
        {placement.side === "bottom" && placement.arrowLeft != null && (
          <div
            className="pointer-events-none absolute -top-2 size-4 rotate-45 border-l border-t border-emerald-500/35 bg-white"
            style={{ left: placement.arrowLeft - 8 }}
          />
        )}
        {placement.side === "top" && placement.arrowLeft != null && (
          <div
            className="pointer-events-none absolute -bottom-2 size-4 rotate-45 border-b border-r border-emerald-500/35 bg-white"
            style={{ left: placement.arrowLeft - 8 }}
          />
        )}
        {placement.side === "right" && placement.arrowTop != null && (
          <div
            className="pointer-events-none absolute -left-2 size-4 rotate-45 border-b border-l border-emerald-500/35 bg-white"
            style={{ top: placement.arrowTop - 8 }}
          />
        )}
        {placement.side === "left" && placement.arrowTop != null && (
          <div
            className="pointer-events-none absolute -right-2 size-4 rotate-45 border-r border-t border-emerald-500/35 bg-white"
            style={{ top: placement.arrowTop - 8 }}
          />
        )}

        {/* Top Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-t-2xl bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Card Top Bar: Screen/Chapter Selector Dropdown + Close Button */}
        <div className="relative flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => setIsChapterMenuOpen((prev) => !prev)}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition-colors hover:bg-emerald-100 cursor-pointer"
              title="Chuyển nhanh sang màn hình khác"
            >
              <Compass className="size-3.5 shrink-0 text-emerald-600" />
              <span className="truncate">
                Màn {tourConfig.activeFlowIndex + 1}/{tourConfig.flows.length}:{" "}
                {tourConfig.flows[tourConfig.activeFlowIndex]?.shortTitle.replace(/^\d+\.\s*/, "")}
              </span>
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 text-emerald-700 transition-transform duration-150",
                  isChapterMenuOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu to jump to any of the 8 Screens/Tabs */}
            {isChapterMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Chọn màn hình hướng dẫn ({tourConfig.role === "landlord" ? "Chủ trọ" : "Người thuê"})
                </p>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {tourConfig.flows.map((flow, idx) => {
                    const isCurrent = idx === tourConfig.activeFlowIndex;
                    return (
                      <button
                        key={flow.id}
                        type="button"
                        onClick={() => handleSwitchFlow(flow.route)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold transition-colors cursor-pointer",
                          isCurrent
                            ? "bg-emerald-600 text-white"
                            : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
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

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            title="Đóng hướng dẫn (Esc)"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer shrink-0"
          >
            <span>Thoát</span>
            <X className="size-3.5" />
          </button>
        </div>

        {/* Card Main Body: Title, Full Explanation & Pro Tip */}
        <div className="p-4 sm:p-5">
          {activeSpot ? (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-extrabold text-white tabular-nums">
                  Mục {safeStepIdx + 1} / {measuredSpots.length}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  • Sử dụng phím ← → để chuyển
                </span>
              </div>

              <h3 className="mt-2.5 text-base font-extrabold text-slate-900 leading-snug">
                {activeSpot.label}
              </h3>

              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
                {activeSpot.description}
              </p>

              {activeSpot.tip && (
                <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-relaxed text-emerald-950">
                    <strong className="font-bold text-emerald-800">Mẹo: </strong>
                    {activeSpot.tip}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="py-2">
              <h3 className="text-base font-bold text-slate-900">{tourConfig.currentTitle}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                {tourConfig.currentSummary}
              </p>
            </div>
          )}

          {/* Card Footer: Step Dots + Prev / Next Buttons */}
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={safeStepIdx === 0 && tourConfig.activeFlowIndex === 0}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
              <span>{safeStepIdx === 0 && tourConfig.activeFlowIndex > 0 ? "Màn trước" : "Quay lại"}</span>
            </button>

            {/* Interactive Step Dots */}
            {measuredSpots.length > 1 && (
              <div className="flex items-center gap-1.5">
                {measuredSpots.map((s, idx) => (
                  <button
                    key={s.selector + idx}
                    type="button"
                    onClick={() => setStepIdx(idx)}
                    aria-label={`Chuyển tới mục ${idx + 1}`}
                    className={cn(
                      "h-2 rounded-full transition-all duration-200 cursor-pointer",
                      idx === safeStepIdx
                        ? "w-5 bg-emerald-600"
                        : "w-2 bg-slate-200 hover:bg-slate-300"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Next Step or Next Screen CTA */}
            {safeStepIdx < measuredSpots.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <span>Tiếp theo</span>
                <ChevronRight className="size-3.5" />
              </button>
            ) : nextFlow ? (
              <button
                type="button"
                onClick={() => handleSwitchFlow(nextFlow.route)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <span>Qua: {nextFlow.shortTitle}</span>
                <ChevronRight className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Hoàn tất</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
