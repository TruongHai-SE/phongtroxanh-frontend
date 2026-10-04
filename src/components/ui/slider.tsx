"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "./utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  const activeThumbRef = React.useRef<number | null>(null);
  const isDraggingRef = React.useRef<boolean>(false);
  const lastEmittedValuesRef = React.useRef<number[]>(_values);

  React.useEffect(() => {
    lastEmittedValuesRef.current = _values;
  }, [_values]);

  React.useEffect(() => {
    const handleRelease = () => {
      isDraggingRef.current = false;
      activeThumbRef.current = null;
    };
    window.addEventListener("pointerup", handleRelease);
    window.addEventListener("pointercancel", handleRelease);
    return () => {
      window.removeEventListener("pointerup", handleRelease);
      window.removeEventListener("pointercancel", handleRelease);
    };
  }, []);

  const handleValueChange = React.useCallback(
    (newValues: number[]) => {
      if (!onValueChange) return;

      if (newValues.length === 2) {
        const currentValues = lastEmittedValuesRef.current;

        if (activeThumbRef.current === null) {
          if (newValues[0] !== currentValues[0] && newValues[1] === currentValues[1]) {
            activeThumbRef.current = 0;
          } else if (newValues[1] !== currentValues[1] && newValues[0] === currentValues[0]) {
            activeThumbRef.current = 1;
          } else {
            const diff0 = Math.abs(newValues[0] - currentValues[0]);
            const diff1 = Math.abs(newValues[1] - currentValues[1]);
            activeThumbRef.current = diff1 > diff0 ? 1 : 0;
          }
        }

        const activeIndex = activeThumbRef.current;
        let targetValues = [...newValues];

        if (activeIndex === 0) {
          const maxLimit = currentValues[1];
          if (newValues[0] > maxLimit) {
            targetValues = [maxLimit, maxLimit];
          } else {
            targetValues = [newValues[0], maxLimit];
          }
        } else if (activeIndex === 1) {
          const minLimit = currentValues[0];
          if (newValues[1] < minLimit) {
            targetValues = [minLimit, minLimit];
          } else {
            targetValues = [minLimit, newValues[1]];
          }
        }

        lastEmittedValuesRef.current = targetValues;
        onValueChange(targetValues);
      } else {
        onValueChange(newValues);
      }
    },
    [onValueChange],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      onValueChange={handleValueChange}
      onPointerDown={(e) => {
        isDraggingRef.current = true;
        const target = e.target as HTMLElement;
        if (!target.closest('[data-slot="slider-thumb"]')) {
          activeThumbRef.current = null;
        }
      }}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          onPointerDown={() => {
            if (!isDraggingRef.current) {
              activeThumbRef.current = index;
            }
          }}
          onFocus={() => {
            if (!isDraggingRef.current) {
              activeThumbRef.current = index;
            }
          }}
          className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
