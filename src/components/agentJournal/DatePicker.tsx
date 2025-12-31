// DatePicker - Selector de fecha para reporte diario

import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  maxDate?: Date;
  minDate?: Date;
}

export function DatePicker({ value, onChange, maxDate, minDate }: DatePickerProps) {
  const selectedDate = value || startOfToday();

  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    if (!minDate || newDate >= minDate) {
      onChange(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    const today = startOfToday();
    const limitDate = maxDate || today;
    if (newDate <= limitDate) {
      onChange(newDate);
    }
  };

  const handleToday = () => {
    const today = startOfToday();
    onChange(today);
  };

  const handleYesterday = () => {
    const yesterday = subDays(startOfToday(), 1);
    onChange(yesterday);
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd');
  const isMaxDate = maxDate 
    ? format(selectedDate, 'yyyy-MM-dd') >= format(maxDate, 'yyyy-MM-dd')
    : isToday;

  const isMinDate = minDate 
    ? format(selectedDate, 'yyyy-MM-dd') <= format(minDate, 'yyyy-MM-dd')
    : false;

  return (
    <div className="flex items-center gap-2">
      {/* Botones rápidos */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className={cn(
            'text-xs',
            isToday && 'bg-primary text-primary-foreground'
          )}
        >
          Hoy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleYesterday}
          className="text-xs"
        >
          Ayer
        </Button>
      </div>

      {/* Navegación por fecha */}
      <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevDay}
          disabled={isMinDate}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 min-w-[140px] justify-center">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">
            {format(selectedDate, 'dd/MM/yyyy')}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextDay}
          disabled={isMaxDate}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

