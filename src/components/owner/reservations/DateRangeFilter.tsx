import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export default function DateRangeFilter({ 
  dateRange, 
  onDateRangeChange,
  className 
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickFilters = [
    {
      label: 'Today',
      getValue: () => {
        const today = new Date();
        return { from: today, to: today };
      }
    },
    {
      label: 'Tomorrow',
      getValue: () => {
        const tomorrow = addDays(new Date(), 1);
        return { from: tomorrow, to: tomorrow };
      }
    },
    {
      label: 'This Week',
      getValue: () => ({
        from: startOfWeek(new Date()),
        to: endOfWeek(new Date())
      })
    },
    {
      label: 'This Month',
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      label: 'Next 7 Days',
      getValue: () => ({
        from: new Date(),
        to: addDays(new Date(), 7)
      })
    },
    {
      label: 'Next 30 Days',
      getValue: () => ({
        from: new Date(),
        to: addDays(new Date(), 30)
      })
    }
  ];

  const handleQuickFilter = (filter: typeof quickFilters[0]) => {
    const range = filter.getValue();
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleClear = () => {
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.from) return '';
    if (!range.to) return format(range.from, 'LLL dd, y');
    if (range.from.toDateString() === range.to.toDateString()) {
      return format(range.from, 'LLL dd, y');
    }
    return `${format(range.from, 'LLL dd, y')} - ${format(range.to, 'LLL dd, y')}`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal min-w-[280px]',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange ? formatDateRange(dateRange) : 'Select date range'}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Quick Filters */}
            <div className="border-r p-3 space-y-1">
              <div className="text-sm font-medium mb-2">Quick Filters</div>
              {quickFilters.map((filter) => (
                <Button
                  key={filter.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handleQuickFilter(filter)}
                >
                  {filter.label}
                </Button>
              ))}
              
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-muted-foreground"
                  onClick={handleClear}
                >
                  <X className="mr-2 h-3 w-3" />
                  Clear Filter
                </Button>
              </div>
            </div>
            
            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => onDateRangeChange(range)}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {dateRange && (
        <Badge variant="secondary" className="flex items-center gap-1">
          {formatDateRange(dateRange)}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 w-4 h-4 hover:bg-transparent"
            onClick={() => onDateRangeChange(undefined)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
}