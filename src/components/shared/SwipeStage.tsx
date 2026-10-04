import { useCallback, useEffect, useState } from "react";
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

const cardVariants = {
  initial: ({ direction, reduce, isUndo }: { direction: 1 | -1; reduce: boolean; isUndo: boolean }) =>
    reduce
      ? { opacity: 0 }
      : isUndo
      ? { x: direction * 480, rotate: direction * 12, opacity: 0 }
      : { scale: 0.96, opacity: 0 },
  animate: ({ reduce }: { reduce: boolean }) =>
    reduce ? { opacity: 1 } : { scale: 1, opacity: 1, x: 0 },
  exit: ({ direction, reduce }: { direction: 1 | -1; reduce: boolean }) => {
    return reduce
      ? { opacity: 0, transition: { duration: 0.2 } }
      : { x: direction * 480, rotate: direction * 12, opacity: 0 };
  },
};

// The draggable top card. Owns its own motion value so each card starts fresh
// (the parent keys it by id, so it remounts per item — no useState for the
// continuous drag position, per perf best practice).
function SwipeCard<T extends { id: string }>({
  item,
  direction,
  reduce,
  isUndo,
  renderCard,
  onAdvance,
}: {
  item: T;
  direction: 1 | -1;
  reduce: boolean;
  isUndo: boolean;
  renderCard: (item: T) => React.ReactNode;
  onAdvance: (d: 1 | -1) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-12, 12]);
  const likeOpacity = useTransform(x, [20, 90], [0, 1]);
  const skipOpacity = useTransform(x, [-20, -90], [0, 1]);
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDragEnd = async (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (isDismissing) return;
    const threshold = 65;
    const velocityThreshold = 180;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      setIsDismissing(true);
      await animate(x, 700, { duration: 0.2, ease: "easeOut" });
      onAdvance(1);
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      setIsDismissing(true);
      await animate(x, -700, { duration: 0.2, ease: "easeOut" });
      onAdvance(-1);
    } else {
      animate(x, 0, { type: "spring", stiffness: 450, damping: 28 });
    }
  };

  return (
    <motion.div
      key={item.id}
      style={{ x, rotate }}
      custom={{ direction, reduce, isUndo }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      drag={isDismissing ? false : "x"}
      dragElastic={0.8}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
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
}: {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onLike?: (item: T) => void;
  onSkip?: (item: T) => void;
  onInfo?: (item: T) => void;
  emptyState: React.ReactNode;
  resetKey?: number;
}) {
  const reduce = useReducedMotion() ?? false;
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
      <div className="flex flex-col items-center gap-6 w-full py-12">
        <div className="grid flex-1 place-items-center">{emptyState}</div>
        {history.length > 0 && (
          <Button
            variant="outline"
            className="gap-2 press-active hover-lift shadow-sm mt-4"
            onClick={handleUndo}
          >
            <Undo2 className="size-4" /> Hoàn tác lượt vuốt trước
          </Button>
        )}
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative h-[530px] md:h-[490px] w-full max-w-[380px] sm:max-w-[440px] md:max-w-[680px]">
        {/* Depth peek: a glimpse of the next card sitting behind the top one */}
        {next && (
          <div
            key={next.id}
            aria-hidden
            className="absolute inset-0 scale-[0.94] translate-y-4 opacity-60 transition-all duration-300"
          >
            {renderCard(next)}
          </div>
        )}

        <AnimatePresence custom={{ direction, reduce, isUndo }} mode="popLayout">
          <SwipeCard
            key={current.id}
            item={current}
            direction={direction}
            reduce={reduce}
            isUndo={isUndo}
            renderCard={renderCard}
            onAdvance={advance}
          />
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground w-full max-w-[380px] sm:max-w-[440px] md:max-w-[680px] px-2">
        <span>← Không phù hợp</span>
        <span>Phù hợp →</span>
      </div>

      <div className="flex items-center gap-5">
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-full press-active hover-lift border-destructive/20 text-destructive/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
          onClick={() => advance(-1)}
          title="Bỏ qua (←)"
        >
          <X className="size-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-full press-active hover-lift border-amber-500/20 text-amber-600/70 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleUndo}
          disabled={history.length === 0}
          title="Hoàn tác"
        >
          <Undo2 className="size-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-full press-active hover-lift border-blue-500/20 text-blue-600/70 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/40"
          onClick={() => onInfo?.(current)}
          title="Chi tiết (↑)"
        >
          <Info className="size-5" />
        </Button>
        <Button
          size="icon"
          className="size-12 rounded-full shadow-md press-active hover-lift hover-glow bg-primary hover:bg-primary/90 text-white"
          onClick={() => advance(1)}
          title="Thích (→)"
        >
          <Heart className="size-5 fill-white" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Mẹo: dùng phím ← → để vuốt nhanh, ↑ để xem chi tiết
      </p>
    </div>
  );
}
