"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-3",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-semibold text-slate-800",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-70 hover:opacity-100 active:scale-[0.95] transition-all duration-150",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex mb-1",
        head_cell:
          "text-slate-400 rounded-md w-9 font-semibold text-[11px] uppercase tracking-wider text-center select-none",
        row: "flex w-full mt-1 gap-0.5",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-emerald-50/70 [&:has([aria-selected].day-range-end)]:rounded-r-lg",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-lg [&:has(>.day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg"
            : "[&:has([aria-selected])]:rounded-lg",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-medium text-slate-700 rounded-lg aria-selected:opacity-100 cursor-pointer select-none",
          "hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.93] transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-emerald-600 aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-emerald-600 aria-selected:text-white",
        day_selected:
          "bg-emerald-600 text-white font-semibold shadow-xs shadow-emerald-600/25 hover:bg-emerald-700 hover:text-white focus:bg-emerald-600 focus:text-white",
        day_today:
          "bg-emerald-50/80 text-emerald-700 font-semibold ring-1 ring-inset ring-emerald-500/35",
        day_outside:
          "day-outside text-slate-300 aria-selected:text-white/80",
        day_disabled: "text-slate-300 opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-300 active:scale-100",
        day_range_middle:
          "aria-selected:bg-emerald-50 aria-selected:text-emerald-800",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
