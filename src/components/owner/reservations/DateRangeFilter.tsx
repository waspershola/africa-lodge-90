import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  dateRange?: DateRange;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  onQuickFilterSelect?: (range: DateRange) => void;
}

export default function DateRangeFilter({ 
  dateRange, 
  onDateRangeChange, 
  onQuickFilterSelect 
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
      label: 'This Week',
      getValue: () => {
        const today = new Date();
        return { from: startOfWeek(today), to: endOfWeek(today) };
      }
    },
    {
      label: 'This Month',
      getValue: () => {
        const today = new Date();
        return { from: startOfMonth(today), to: endOfMonth(today) };
      }
    },
    {
      label: 'Next 7 Days',
      getValue: () => {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 6);
        return { from: today, to: endDate };
      }
    },
    {
      label: 'Next 30 Days',
      getValue: () => {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 29);
        return { from: today, to: endDate };
      }
    }
  ];

  const handleQuickFilter = (filter: typeof quickFilters[0]) => {
    const range = filter.getValue();
    onDateRangeChange(range);
    onQuickFilterSelect?.(range);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range || !range.from) return 'Select date range';
    if (!range.to) return format(range.from, 'PPP');
    if (range.from.getTime() === range.to.getTime()) {
      return format(range.from, 'PPP');
    }
    return `${format(range.from, 'MMM dd')} - ${format(range.to, 'MMM dd, yyyy')}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Date Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Picker */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange(dateRange)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-4">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
              />
              
              {dateRange && (
                <div className="flex justify-end pt-3 border-t mt-3">
                  <Button variant="ghost" size="sm" onClick={handleClearFilter}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Badge */}
        {dateRange && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <span>{formatDateRange(dateRange)}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={handleClearFilter}
              />
            </Badge>
          </div>
        )}

        {/* Quick Filters */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Quick Filters</div>
          <div className="space-y-1">
            {quickFilters.map(filter => (
              <Button
                key={filter.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-left"
                onClick={() => handleQuickFilter(filter)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Filter Summary */}
        {dateRange && (
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            Showing reservations from {format(dateRange.from || new Date(), 'MMM dd')} 
            {dateRange.to && dateRange.from?.getTime() !== dateRange.to.getTime() && 
              ` to ${format(dateRange.to, 'MMM dd')}`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}