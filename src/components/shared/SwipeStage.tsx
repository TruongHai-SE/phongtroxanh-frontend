import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useReducedMotion,
  animate,
} from "motion/react";
import { X, Heart, Info, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type CardCustomProps = {
  direction: 1 | -1;
  reduce: boolean;
  isUndo: boolean;
  isTop: boolean;
  isFirstMount: boolean;
};

const cardVariants = {
  initial: ({ direction, reduce, isUndo, isTop, isFirstMount }: CardCustomProps) => {
    if (reduce) {
      return { opacity: isTop ? 1 : 0.65, zIndex: isTop ? 10 : 1 };
    }
    if (isTop) {
      if (isUndo) {
        return { x: direction * 480, opacity: 0, scale: 0.98, y: 0, zIndex: 10 };
      }
      return isFirstMount
        ? { scale: 0.97, y: 6, opacity: 0, x: 0, zIndex: 10 }
        : { scale: 0.94, y: 14, opacity: 0.65, x: 0, zIndex: 10 };
    }
    // Mount quietly in the back as the depth peek card
    return { scale: 0.9, y: 22, opacity: 0, x: 0, zIndex: 1 };
  },
  top: ({ reduce }: CardCustomProps) =>
    reduce
      ? { opacity: 1, x: 0, y: 0, scale: 1, zIndex: 10 }
      : { scale: 1, y: 0, opacity: 1, x: 0, zIndex: 10 },
  peek: ({ reduce }: CardCustomProps) =>
    reduce
      ? { opacity: 0.65, x: 0, y: 14, scale: 0.94, zIndex: 1 }
      : { scale: 0.94, y: 14, opacity: 0.65, x: 0, zIndex: 1 },
  exit: ({ direction, reduce, isUndo }: CardCustomProps) => {
    if (isUndo) {
      // Background peek card exiting quietly when user clicks Undo
      return {
        scale: 0.9,
        y: 22,
        opacity: 0,
        zIndex: 0,
        transition: { duration: 0.16, ease: [0.23, 1, 0.32, 1] },
      };
    }
    if (reduce) {
      return { opacity: 0, zIndex: 20, transition: { duration: 0.15 } };
    }
    return {
      x: direction * 560,
      opacity: 0,
      zIndex: 20,
      transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] },
    };
  },
};

// Stacked card item. Keeping both `current` (isTop=true) and `next` (isTop=false)
// mounted inside the same AnimatePresence tree ensures that when `next` is promoted
// to `current`, React preserves the exact DOM node and springs it from `peek` -> `top`
// with zero unmount/remount flicker.
function SwipeCard<T extends { id: string }>({
  item,
  direction,
  reduce,
  isUndo,
  isTop,
  isFirstMount,
  renderCard,
  onAdvance,
}: {
  item: T;
  direction: 1 | -1;
  reduce: boolean;
  isUndo: boolean;
  isTop: boolean;
  isFirstMount: boolean;
  renderCard: (item: T) => React.ReactNode;
  onAdvance: (d: 1 | -1) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-12, 12]);
  const likeOpacity = useTransform(x, [20, 90], [0, 1]);
  const skipOpacity = useTransform(x, [-20, -90], [0, 1]);
  const isDismissingRef = useRef(false);

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (!isTop || isDismissingRef.current) return;
    const threshold = 65;
    const velocityThreshold = 180;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      isDismissingRef.current = true;
      animate(x, 620, { duration: 0.22, ease: [0.23, 1, 0.32, 1] });
      onAdvance(1);
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      isDismissingRef.current = true;
      animate(x, -620, { duration: 0.22, ease: [0.23, 1, 0.32, 1] });
      onAdvance(-1);
    } else {
      animate(x, 0, { type: "spring", stiffness: 450, damping: 28 });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, willChange: "transform, opacity" }}
      custom={{ direction, reduce, isUndo, isTop, isFirstMount }}
      variants={cardVariants}
      initial="initial"
      animate={isTop ? "top" : "peek"}
      exit="exit"
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      drag={isTop ? "x" : false}
      dragElastic={0.8}
      dragMomentum={false}
      whileTap={isTop ? { cursor: "grabbing" } : undefined}
      onDragEnd={handleDragEnd}
      className={
        isTop
          ? "absolute inset-0 cursor-grab active:cursor-grabbing"
          : "pointer-events-none absolute inset-0 select-none"
      }
    >
      {/* Live drag verdict overlays */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute left-5 top-5 z-20 rotate-[-12deg] rounded-xl border-[3px] border-primary bg-white/85 px-4 py-1.5 text-xl font-extrabold uppercase tracking-wider text-primary shadow-lg backdrop-blur"
      >
        Phù hợp
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="pointer-events-none absolute right-5 top-5 z-20 rotate-[12deg] rounded-xl border-[3px] border-destructive bg-white/85 px-4 py-1.5 text-xl font-extrabold uppercase tracking-wider text-destructive shadow-lg backdrop-blur"
      >
        Bỏ qua
      </motion.div>
      {renderCard(item)}
    </motion.div>
  );
}

export function SwipeStage<T extends { id: string }>({
  items,
  renderCard,
  onLike,
  onSkip,
  onInfo,
  emptyState,
  resetKey,
  tourPrefix = "discover",
}: {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onLike?: (item: T) => void;
  onSkip?: (item: T) => void;
  onInfo?: (item: T) => void;
  emptyState: React.ReactNode;
  resetKey?: number;
  tourPrefix?: "discover" | "roommates";
}) {
  const reduce = false;
  const [{ index, direction, isUndo }, setSwipeState] = useState({
    index: 0,
    direction: 1 as 1 | -1,
    isUndo: false,
  });
  const [history, setHistory] = useState<{ index: number; direction: 1 | -1 }[]>([]);

  // Reset stage to index 0 whenever resetKey changes
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setSwipeState({ index: 0, direction: 1, isUndo: false });
      setHistory([]);
    }
  }, [resetKey]);

  // If item list changes and current index is out of bounds, reset to 0
  useEffect(() => {
    if (index > 0 && index >= items.length && items.length > 0) {
      setSwipeState({ index: 0, direction: 1, isUndo: false });
      setHistory([]);
    }
  }, [items.length]);

  const current = items[index];
  const next = items[index + 1];

  const advance = useCallback(
    (d: 1 | -1) => {
      if (index >= items.length) return;
      if (d === 1) {
        onLike?.(items[index]);
      } else {
        onSkip?.(items[index]);
      }
      setHistory((prev) => [...prev, { index, direction: d }]);
      setSwipeState({ index: index + 1, direction: d, isUndo: false });
    },
    [index, items, onLike, onSkip],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance(1);
      if (e.key === "ArrowLeft") advance(-1);
      if (e.key === "ArrowUp" && current) onInfo?.(current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, current, onInfo]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setSwipeState({
      index: last.index,
      direction: last.direction,
      isUndo: true,
    });
  }, [history]);

  if (!current)
    return (
      <div
        data-tour={`${tourPrefix}-swipe-card`}
        className="flex min-h-[clamp(380px,calc(100dvh-235px),520px)] flex-col items-center justify-center gap-5 w-full py-6"
      >
        <div className="grid flex-1 place-items-center w-full">{emptyState}</div>
        {history.length > 0 && (
          <Button
            variant="outline"
            className="gap-2 press-active hover-lift shadow-sm mt-2"
            onClick={handleUndo}
          >
            <Undo2 className="size-4" /> Hoàn tác lượt vuốt trước
          </Button>
        )}
      </div>
    );

  const visibleCards = next ? [next, current] : [current];

  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      <div
        data-tour={`${tourPrefix}-swipe-card`}
        className="relative h-[clamp(380px,calc(100dvh-235px),545px)] w-full max-w-[380px] sm:max-w-[440px] md:max-w-[680px]"
      >
        <AnimatePresence initial={false} custom={{ direction, reduce, isUndo }}>
          {visibleCards.map((item) => {
            const isTop = item.id === current.id;
            return (
              <SwipeCard
                key={item.id}
                item={item}
                direction={direction}
                reduce={reduce}
                isUndo={isUndo}
                isTop={isTop}
                isFirstMount={index === 0 && history.length === 0}
                renderCard={renderCard}
                onAdvance={advance}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-2 w-full max-w-[380px] sm:max-w-[440px] md:max-w-[680px] px-2 pt-0.5">
        <span className="hidden sm:inline-block text-xs text-muted-foreground w-28 text-left select-none">
          ← Không phù hợp
        </span>

        <div data-tour={`${tourPrefix}-swipe-actions`} className="mx-auto flex items-center gap-4">
          <Button
            data-tour={`${tourPrefix}-btn-skip`}
            variant="outline"
            size="icon"
            className="size-11 rounded-full press-active hover-lift border-destructive/20 text-destructive/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 cursor-pointer"
            onClick={() => advance(-1)}
            title="Bỏ qua (←)"
          >
            <X className="size-5" />
          </Button>
          <Button
            data-tour={`${tourPrefix}-btn-undo`}
            variant="outline"
            size="icon"
            className="size-11 rounded-full press-active hover-lift border-amber-500/20 text-amber-600/70 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Hoàn tác"
          >
            <Undo2 className="size-5" />
          </Button>
          <Button
            data-tour={`${tourPrefix}-btn-info`}
            variant="outline"
            size="icon"
            className="size-11 rounded-full press-active hover-lift border-blue-500/20 text-blue-600/70 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/40 cursor-pointer"
            onClick={() => onInfo?.(current)}
            title="Chi tiết (↑)"
          >
            <Info className="size-5" />
          </Button>
          <Button
            data-tour={`${tourPrefix}-btn-like`}
            size="icon"
            className="size-11 rounded-full shadow-md press-active hover-lift hover-glow bg-primary hover:bg-primary/90 text-white cursor-pointer"
            onClick={() => advance(1)}
            title="Thích (→)"
          >
            <Heart className="size-5 fill-white" />
          </Button>
        </div>

        <span className="hidden sm:inline-block text-xs text-muted-foreground w-28 text-right select-none">
          Phù hợp →
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-none">
        Mẹo: dùng phím ← → để vuốt nhanh, ↑ để xem chi tiết
      </p>
    </div>
  );
}
