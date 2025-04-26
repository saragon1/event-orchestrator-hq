import * as React from "react"
import { format, startOfYear, endOfYear } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (dateRange: DateRange | undefined) => void
  className?: string
  align?: "center" | "start" | "end"
  showCompactText?: boolean
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  align = "start",
  showCompactText = false,
}: DateRangePickerProps) {
  // Get current year for default range
  const currentYear = new Date().getFullYear()
  const defaultDateRange = {
    from: startOfYear(new Date(currentYear, 0, 1)),
    to: endOfYear(new Date(currentYear, 11, 31))
  }

  // Initialize with default if not provided
  React.useEffect(() => {
    if (!dateRange) {
      onDateRangeChange(defaultDateRange)
    }
  }, [dateRange, onDateRangeChange])

  // Helper to format the display text
  const formatDateDisplay = () => {
    if (!dateRange?.from) {
      return "Select date range"
    }

    if (dateRange.to) {
      if (showCompactText) {
        return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
      }
      return `${format(dateRange.from, "MMMM d, yyyy")} - ${format(dateRange.to, "MMMM d, yyyy")}`
    }

    return format(dateRange.from, "MMMM d, yyyy")
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateDisplay()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-between border-t p-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDateRangeChange(defaultDateRange)}
            >
              Current Year
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDateRangeChange(undefined)}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 