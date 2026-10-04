import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
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
          "h-7 text-xs font-semibold rounded-lg border border-border/80 bg-background px-2.5 py-0.5 inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer",
          "hover:border-primary/60 hover:text-primary hover:bg-primary/5",
          isOpen && "border-primary ring-2 ring-primary/20 bg-primary/5 text-primary",
          className
        )}
      >
        <span>{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-200 text-muted-foreground",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            "absolute top-full mt-1.5 z-50 rounded-xl border border-border/80 bg-popover p-1 shadow-xl max-h-56 overflow-y-auto min-w-[115px]",
            "animate-in fade-in-0 zoom-in-95 duration-150",
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
                  "w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : isDisabled
                    ? "opacity-30 cursor-not-allowed text-muted-foreground"
                    : "text-foreground hover:bg-primary/10 hover:text-primary"
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
  const startYear = fromYear || (isBirthDate ? 1940 : 1970);
  const endYear = toYear || (maxDate ? maxDate.getFullYear() : currentYear + 10);
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
      if (maxDate) {
        if (curYear > maxDate.getFullYear()) isDisabled = true;
        else if (curYear === maxDate.getFullYear() && idx > maxDate.getMonth()) isDisabled = true;
      }
      if (minDate) {
        if (curYear < minDate.getFullYear()) isDisabled = true;
        else if (curYear === minDate.getFullYear() && idx < minDate.getMonth()) isDisabled = true;
      }
      return {
        value: idx,
        label: name,
        disabled: isDisabled,
      };
    });
  }, [displayMonth, maxDate, minDate]);

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
      if (isValid(parsed)) {
        if ((!maxDate || parsed <= maxDate) && (!minDate || parsed >= minDate)) {
          setDate(parsed);
          setDisplayMonth(parsed);
          if (onChange) onChange(format(parsed, "yyyy-MM-dd"));
        }
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
      if (isValid(parsed) && (!maxDate || parsed <= maxDate) && (!minDate || parsed >= minDate)) {
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
    const next = new Date(displayMonth.getFullYear(), newMonth, 1);
    setDisplayMonth(next);
  };

  const handleYearSelect = (newYear: number) => {
    const next = new Date(newYear, displayMonth.getMonth(), 1);
    setDisplayMonth(next);
  };

  const handlePrevMonth = () => {
    setActiveDropdown(null);
    const prev = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1);
    if (!minDate || prev >= new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
      setDisplayMonth(prev);
    }
  };

  const handleNextMonth = () => {
    setActiveDropdown(null);
    const next = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1);
    if (!maxDate || next <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
      setDisplayMonth(next);
    }
  };

  const isNextDisabled = Boolean(
    maxDate && (
      displayMonth.getFullYear() > maxDate.getFullYear() ||
      (displayMonth.getFullYear() === maxDate.getFullYear() && displayMonth.getMonth() >= maxDate.getMonth())
    )
  );

  const isPrevDisabled = Boolean(
    minDate && (
      displayMonth.getFullYear() < minDate.getFullYear() ||
      (displayMonth.getFullYear() === minDate.getFullYear() && displayMonth.getMonth() <= minDate.getMonth())
    )
  );

  return (
    <Popover 
      open={open} 
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setActiveDropdown(null);
      }}
    >
      <div className="relative flex items-center w-full">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={cn(
            "w-full h-9 rounded-md border border-input bg-input-background pl-3 pr-10 text-xs font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition",
            className
          )}
        />
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition rounded-md hover:bg-muted cursor-pointer"
            title="Mở lịch chọn ngày"
          >
            <CalendarIcon className="size-4 opacity-70" />
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-auto p-0 border border-border/80 shadow-xl rounded-2xl overflow-visible" align="start">
        {/* Custom Header: Month Dropdown + Year Dropdown + Prev/Next Buttons */}
        <div className="flex items-center justify-between gap-1 px-3 py-2.5 border-b border-border/70 bg-muted/30">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className="size-7 rounded-lg border border-border/80 p-0 inline-flex items-center justify-center hover:bg-primary/5 hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
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
            className="size-7 rounded-lg border border-border/80 p-0 inline-flex items-center justify-center hover:bg-primary/5 hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Tháng sau"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Lưới ngày (Calendar Days) */}
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          disabled={disabled || (maxDate ? (d) => d > maxDate : undefined)}
          classNames={{
            caption: "hidden", // Ẩn caption mặc định vì đã có Header dropdown ở trên
            nav: "hidden",     // Ẩn nav cũ
          }}
          initialFocus
        />

        {/* Bottom Quick Bar */}
        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-xs bg-muted/10">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              if (!maxDate || today <= maxDate) {
                handleSelect(today);
                setDisplayMonth(today);
              }
            }}
            disabled={Boolean(maxDate && new Date() > maxDate)}
            className="font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Hôm nay
          </button>
          {date && (
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className="text-muted-foreground hover:text-destructive transition font-medium"
            >
              Xóa chọn
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
