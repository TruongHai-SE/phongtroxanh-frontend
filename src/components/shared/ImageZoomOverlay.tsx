/**
 * ImageZoomOverlay — Portal-based image viewer
 *
 * Fixes applied:
 * 1. tabIndex={0} + autoFocus → overlay steals focus immediately on mount,
 *    so the FIRST click/scroll works (no "ghost click" needed).
 * 2. Non-passive wheel listener via useEffect → e.preventDefault() actually
 *    prevents background scroll (React's synthetic onWheel is passive in v18).
 * 3. Dynamic transform-origin from mouse cursor → zoom happens where you hover,
 *    not always at center.
 * 4. createPortal to document.body → z-index 9999 beats any Dialog/Sheet context.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface Props {
  src: string | null;
  alt?: string;
  onClose: () => void;
  /** When false, renders inline (no portal). Use this when the trigger
   *  is inside a Radix Dialog or Sheet — placing the overlay in the same
   *  DOM subtree lets FocusScope see it as "inside" and prevents it from
   *  stealing focus, fixing the "must click once first" bug.
   *  Position fixed + z-[9999] still covers the full screen visually.
   *  Default: true (portal to document.body). */
  usePortal?: boolean;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const STEP = 0.35;

export function ImageZoomOverlay({ src, alt = "Phóng to", onClose, usePortal = true }: Props) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 }); // percentage relative to image
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastPinchDist = useRef<number | null>(null);

  // Reset whenever a new image opens
  useEffect(() => {
    if (src) {
      setScale(1);
      setOrigin({ x: 50, y: 50 });
    }
  }, [src]);

  // Steal focus immediately so the FIRST interaction works
  useEffect(() => {
    if (src && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [src]);

  // Non-passive wheel listener (React's synthetic onWheel is passive → can't zoom)
  useEffect(() => {
    const el = overlayRef.current;
    if (!el || !src) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Compute transform-origin from mouse position relative to the image
      const img = imgRef.current;
      if (img) {
        const rect = img.getBoundingClientRect();
        const ox = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
        const oy = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
        setOrigin({ x: ox, y: oy });
      }

      const delta = e.deltaY < 0 ? STEP : -STEP;
      setScale((s) => parseFloat(Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)).toFixed(2)));
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [src]);

  // Prevent body scroll while open
  useEffect(() => {
    if (!src) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [src]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!src) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "+" || e.key === "=") {
        setScale((s) => parseFloat(Math.min(MAX_SCALE, s + STEP).toFixed(2)));
      }
      if (e.key === "-") {
        setScale((s) => parseFloat(Math.max(MIN_SCALE, s - STEP).toFixed(2)));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [src, onClose]);

  // Touch pinch zoom
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (lastPinchDist.current !== null) {
      const delta = (dist - lastPinchDist.current) * 0.006;
      setScale((s) => parseFloat(Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)).toFixed(2)));
    }
    lastPinchDist.current = dist;
  }, []);

  const handleTouchEnd = useCallback(() => { lastPinchDist.current = null; }, []);

  if (!src) return null;

  const cursorStyle = scale > 1 ? "zoom-out" : "zoom-in";

  const content = (
    <div
      ref={overlayRef}
      tabIndex={0}            // ← makes div focusable
      style={{ zIndex: 9999 }} // ← inline to beat any CSS variable stacking
      className="fixed inset-0 bg-black/95 flex items-center justify-center select-none outline-none"
      onClick={onClose}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button — always reachable, top-right */}
      <button
        className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/35 transition-colors flex items-center justify-center text-white cursor-pointer z-10"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Đóng ảnh"
      >
        <X className="size-5" />
      </button>

      {/* Zoom controls — bottom-center */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="size-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => setScale((s) => parseFloat(Math.max(MIN_SCALE, s - STEP).toFixed(2)))}
          disabled={scale <= MIN_SCALE}
          aria-label="Thu nhỏ"
        >
          <ZoomOut className="size-4" />
        </button>
        <span className="text-white text-xs font-mono w-10 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          className="size-7 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => setScale((s) => parseFloat(Math.min(MAX_SCALE, s + STEP).toFixed(2)))}
          disabled={scale >= MAX_SCALE}
          aria-label="Phóng to"
        >
          <ZoomIn className="size-4" />
        </button>
      </div>

      {/* Hint text */}
      <p className="absolute bottom-5 right-5 text-white/25 text-[11px] pointer-events-none select-none">
        Cuộn để zoom · Esc để đóng
      </p>

      {/* The image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "92vw",
          maxHeight: "88vh",
          transform: `scale(${scale})`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: "transform 0.12s ease",
          objectFit: "contain",
          cursor: cursorStyle,
          borderRadius: 10,
          display: "block",
        }}
      />
    </div>
  );

  return usePortal ? createPortal(content, document.body) : content;
}
