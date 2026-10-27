import * as React from "react";
import { format, parse, isValid, startOfDay, endOfDay, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { cn } from "./utils";

interface DatePickerProps {
  value?: string; // "YYYY-MM-DD"
  defaultValue?: string; // "YYYY-MM-DD"
  onChange?: (val: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  maxDate?: Date;
  minDate?: Date;
  fromYear?: number;
  toYear?: number;
  isBirthDate?: boolean;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

interface CustomDropdownProps<T extends number | string> {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (val: T) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  title?: string;
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
}

function CustomDropdown<T extends number | string>({
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  onClose,
  title,
  className,
  menuClassName,
  align = "left",
}: CustomDropdownProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const selectedItemRef = React.useRef<HTMLButtonElement>(null);

  // Click outside to close
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Auto-scroll to selected item when opened
  React.useEffect(() => {
    if (isOpen && menuRef.current && selectedItemRef.current) {
      const container = menuRef.current;
      const item = selectedItemRef.current;
      // Scroll so selected item is centered
      container.scrollTop = item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2;
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={onToggle}
        title={title}
        className={cn(
          "h-7 text-xs font-semibold rounded-lg border border-border/80 bg-background px-2.5 py-0.5 inline-flex items-center gap-1.5 shadow-xs cursor-pointer",
          "transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
          "hover:border-emerald-600/60 hover:text-emerald-700 hover:bg-emerald-50/70",
          isOpen && "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/80 text-emerald-700",
          className
        )}
      >
        <span>{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] text-muted-foreground",
            isOpen && "rotate-180 text-emerald-600"
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          onWheel={(e) => e.stopPropagation()}
          className={cn(
            "absolute top-full mt-1.5 z-[70] origin-top rounded-xl border border-border/80 bg-popover p-1 shadow-xl max-h-56 overflow-y-auto min-w-[115px]",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
            align === "right" ? "right-0" : "left-0",
            "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40",
            menuClassName
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isDisabled = opt.disabled;
            return (
              <button
                key={opt.value}
                ref={isSelected ? selectedItemRef : undefined}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  onChange(opt.value);
                  onClose();
                }}
                className={cn(
                  "w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium flex items-center justify-between cursor-pointer",
                  "transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
                  isSelected
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : isDisabled
                    ? "opacity-30 cursor-not-allowed text-muted-foreground active:scale-100"
                    : "text-foreground hover:bg-emerald-50 hover:text-emerald-700"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="size-3.5 shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DatePicker({ 
  value, 
  defaultValue, 
  onChange, 
  className, 
  placeholder = "Chọn hoặc gõ dd/mm/yyyy",
  disabled,
  maxDate,
  minDate,
  fromYear,
  toYear,
  isBirthDate
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<"month" | "year" | null>(null);
  const [monthSlideDir, setMonthSlideDir] = React.useState<"left" | "right" | null>(null);
  const triggerContainerRef = React.useRef<HTMLDivElement>(null);

  const minDay = React.useMemo(() => (minDate ? startOfDay(minDate) : undefined), [minDate]);
  const maxDay = React.useMemo(() => (maxDate ? endOfDay(maxDate) : undefined), [maxDate]);

  // Parse initial selected date
  const parseDateString = (str?: string): Date | undefined => {
    if (!str) return undefined;
    const parsed = parse(str, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  };

  const [date, setDate] = React.useState<Date | undefined>(() => {
    return parseDateString(value || defaultValue);
  });

  // Calculate default display month
  const getDefaultDisplayMonth = (): Date => {
    if (date) return date;
    if (isBirthDate) {
      // Mặc định mở lứa tuổi sinh viên/thuê trọ: năm 2004 (~20-22 tuổi)
      return new Date(2004, 0, 1);
    }
    return new Date();
  };

  const [displayMonth, setDisplayMonth] = React.useState<Date>(getDefaultDisplayMonth);
  const [inputValue, setInputValue] = React.useState<string>(() => {
    return date ? format(date, "dd/MM/yyyy") : "";
  });

  // Year options for dropdown
  const currentYear = new Date().getFullYear();
  const startYear = fromYear || (isBirthDate ? 1940 : minDay ? minDay.getFullYear() : 1970);
  const endYear = toYear || (maxDay ? maxDay.getFullYear() : currentYear + 10);
  const yearOptions = React.useMemo(() => {
    const list: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, [startYear, endYear]);

  const yearOptionsList = React.useMemo(() => {
    return yearOptions.map((year) => ({
      value: year,
      label: `Năm ${year}`,
    }));
  }, [yearOptions]);

  const monthOptions = React.useMemo(() => {
    const curYear = displayMonth.getFullYear();
    return MONTH_NAMES.map((name, idx) => {
      let isDisabled = false;
      if (maxDay) {
        if (curYear > maxDay.getFullYear()) isDisabled = true;
        else if (curYear === maxDay.getFullYear() && idx > maxDay.getMonth()) isDisabled = true;
      }
      if (minDay) {
        if (curYear < minDay.getFullYear()) isDisabled = true;
        else if (curYear === minDay.getFullYear() && idx < minDay.getMonth()) isDisabled = true;
      }
      return {
        value: idx,
        label: name,
        disabled: isDisabled,
      };
    });
  }, [displayMonth, maxDay, minDay]);

  // Sync state if controlled value changes
  React.useEffect(() => {
    if (value !== undefined) {
      const parsed = parseDateString(value);
      setDate(parsed);
      setInputValue(parsed ? format(parsed, "dd/MM/yyyy") : "");
      if (parsed) {
        setDisplayMonth(parsed);
      }
    }
  }, [value]);

  const isDateWithinBounds = React.useCallback(
    (d: Date) => {
      if (minDay && d < minDay) return false;
      if (maxDay && d > maxDay) return false;
      if (disabled && disabled(d)) return false;
      return true;
    },
    [minDay, maxDay, disabled]
  );

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    setActiveDropdown(null);
    if (selectedDate) {
      const formatted = format(selectedDate, "yyyy-MM-dd");
      setInputValue(format(selectedDate, "dd/MM/yyyy"));
      if (onChange) onChange(formatted);
      setOpen(false);
    } else {
      setInputValue("");
      if (onChange) onChange("");
    }
  };

  // Cho phép gõ trực tiếp bàn phím dạng dd/MM/yyyy
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    const cleanVal = val.trim();
    if (cleanVal.length === 10) {
      const parsed = parse(cleanVal, "dd/MM/yyyy", new Date());
      if (isValid(parsed) && isDateWithinBounds(parsed)) {
        setDate(parsed);
        setDisplayMonth(parsed);
        if (onChange) onChange(format(parsed, "yyyy-MM-dd"));
      }
    } else if (cleanVal === "") {
      setDate(undefined);
      if (onChange) onChange("");
    }
  };

  const handleInputBlur = () => {
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"));
    } else if (inputValue.trim()) {
      const parsed = parse(inputValue.trim(), "dd/MM/yyyy", new Date());
      if (isValid(parsed) && isDateWithinBounds(parsed)) {
        setDate(parsed);
        setDisplayMonth(parsed);
        if (onChange) onChange(format(parsed, "yyyy-MM-dd"));
      } else {
        setInputValue("");
        setDate(undefined);
        if (onChange) onChange("");
      }
    }
  };

  const handleMonthSelect = (newMonth: number) => {
    setMonthSlideDir(newMonth >= displayMonth.getMonth() ? "right" : "left");
    const next = new Date(displayMonth.getFullYear(), newMonth, 1);
    setDisplayMonth(next);
  };

  const handleYearSelect = (newYear: number) => {
    setMonthSlideDir(newYear >= displayMonth.getFullYear() ? "right" : "left");
    const next = new Date(newYear, displayMonth.getMonth(), 1);
    setDisplayMonth(next);
  };

  const handlePrevMonth = () => {
    setActiveDropdown(null);
    setMonthSlideDir("left");
    const prev = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1);
    if (!minDay || prev >= new Date(minDay.getFullYear(), minDay.getMonth(), 1)) {
      setDisplayMonth(prev);
    }
  };

  const handleNextMonth = () => {
    setActiveDropdown(null);
    setMonthSlideDir("right");
    const next = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1);
    if (!maxDay || next <= new Date(maxDay.getFullYear(), maxDay.getMonth(), 1)) {
      setDisplayMonth(next);
    }
  };

  const isNextDisabled = Boolean(
    maxDay && (
      displayMonth.getFullYear() > maxDay.getFullYear() ||
      (displayMonth.getFullYear() === maxDay.getFullYear() && displayMonth.getMonth() >= maxDay.getMonth())
    )
  );

  const isPrevDisabled = Boolean(
    minDay && (
      displayMonth.getFullYear() < minDay.getFullYear() ||
      (displayMonth.getFullYear() === minDay.getFullYear() && displayMonth.getMonth() <= minDay.getMonth())
    )
  );

  const todayDate = startOfDay(new Date());
  const tomorrowDate = addDays(todayDate, 1);
  const canPickToday = isDateWithinBounds(todayDate);
  const canPickTomorrow = !isBirthDate && isDateWithinBounds(tomorrowDate);

  return (
    <Popover 
      open={open} 
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setActiveDropdown(null);
          setMonthSlideDir(null);
        }
      }}
    >
      <PopoverAnchor asChild>
        <div
          ref={triggerContainerRef}
          className="relative flex items-center w-full group"
        >
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onClick={() => {
              if (!open) setOpen(true);
            }}
            placeholder={placeholder}
            className={cn(
              "w-full h-9 rounded-lg border border-input bg-input-background pl-3 pr-10 text-xs font-medium text-foreground placeholder:text-muted-foreground placeholder:font-normal cursor-pointer",
              "transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "hover:border-emerald-600/50 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20",
              open && "border-emerald-600 ring-2 ring-emerald-500/20 bg-white",
              className
            )}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md cursor-pointer",
                "transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.93]",
                open
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-muted-foreground group-hover:text-emerald-600 hover:bg-emerald-50/80"
              )}
              title="Mở lịch chọn ngày"
            >
              <CalendarIcon className="size-4" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (triggerContainerRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
        className="w-auto p-0 border border-border/80 bg-white shadow-xl shadow-slate-900/10 rounded-2xl overflow-visible"
      >
        {/* Custom Header: Month Dropdown + Year Dropdown + Prev/Next Buttons */}
        <div className="flex items-center justify-between gap-1.5 px-3 py-2.5 border-b border-border/70 bg-slate-50/70 rounded-t-2xl">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className="size-7 rounded-lg border border-border/80 bg-white p-0 inline-flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:border-emerald-600/50 hover:text-emerald-700 active:scale-[0.93] disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer shadow-2xs"
            title="Tháng trước"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {/* Chọn Tháng */}
            <CustomDropdown
              value={displayMonth.getMonth()}
              options={monthOptions}
              onChange={handleMonthSelect}
              isOpen={activeDropdown === "month"}
              onToggle={() => setActiveDropdown(activeDropdown === "month" ? null : "month")}
              onClose={() => setActiveDropdown(null)}
              title="Chọn tháng"
              menuClassName="w-32"
            />

            {/* Chọn Năm */}
            <CustomDropdown
              value={displayMonth.getFullYear()}
              options={yearOptionsList}
              onChange={handleYearSelect}
              isOpen={activeDropdown === "year"}
              onToggle={() => setActiveDropdown(activeDropdown === "year" ? null : "year")}
              onClose={() => setActiveDropdown(null)}
              title="Chọn năm"
              align="right"
              menuClassName="w-32"
            />
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isNextDisabled}
            className="size-7 rounded-lg border border-border/80 bg-white p-0 inline-flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:border-emerald-600/50 hover:text-emerald-700 active:scale-[0.93] disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer shadow-2xs"
            title="Tháng sau"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Lưới ngày (Calendar Days) với chuyển động mượt khi đổi tháng */}
        <div
          key={format(displayMonth, "yyyy-MM")}
          className={cn(
            "overflow-hidden",
            monthSlideDir === "right" && "animate-in fade-in-0 slide-in-from-right-2 duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            monthSlideDir === "left" && "animate-in fade-in-0 slide-in-from-left-2 duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
          )}
        >
          <Calendar
            mode="single"
            locale={vi}
            selected={date}
            onSelect={handleSelect}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            disabled={(d) => {
              if (disabled && disabled(d)) return true;
              if (minDay && d < minDay) return true;
              if (maxDay && d > maxDay) return true;
              return false;
            }}
            classNames={{
              caption: "hidden", // Ẩn caption mặc định vì đã có Header dropdown ở trên
              nav: "hidden",     // Ẩn nav cũ
            }}
          />
        </div>

        {/* Bottom Quick Bar */}
        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-xs bg-slate-50/50 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (canPickToday) {
                  handleSelect(todayDate);
                  setDisplayMonth(todayDate);
                }
              }}
              disabled={!canPickToday}
              className="rounded-md px-2 py-1 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.96] transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Hôm nay
            </button>
            {canPickTomorrow && (
              <button
                type="button"
                onClick={() => {
                  handleSelect(tomorrowDate);
                  setDisplayMonth(tomorrowDate);
                }}
                className="rounded-md px-2 py-1 font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70 active:scale-[0.96] transition-all duration-150 cursor-pointer"
              >
                Ngày mai
              </button>
            )}
          </div>
          {date && (
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className="rounded-md px-2 py-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 active:scale-[0.96] transition-all duration-150 font-medium cursor-pointer"
            >
              Xóa chọn
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
