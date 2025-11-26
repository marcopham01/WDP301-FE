import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isToday, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TechnicianScheduleItem, ScheduleItem } from "@/lib/appointmentApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TechnicianCalendarViewProps {
  data: TechnicianScheduleItem[];
  onDateClick?: (date: Date, schedules: ScheduleItem[]) => void;
  viewMode?: "week" | "month";
  onViewModeChange?: (mode: "week" | "month") => void;
  currentDate?: Date;
  onCurrentDateChange?: (date: Date) => void;
}

export function TechnicianCalendarView({
  data,
  onDateClick,
  viewMode: externalViewMode,
  onViewModeChange,
  currentDate: externalCurrentDate,
  onCurrentDateChange,
}: TechnicianCalendarViewProps) {
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const [internalViewMode, setInternalViewMode] = useState<"week" | "month">("month");
  
  const viewMode = externalViewMode || internalViewMode;
  const setViewMode = onViewModeChange || setInternalViewMode;
  const currentDate = externalCurrentDate || internalCurrentDate;
  const setCurrentDate = onCurrentDateChange || setInternalCurrentDate;

  // Group schedules by date and technician
  const schedulesByDate: Record<string, Record<string, ScheduleItem[]>> = {};
  
  data.forEach((item) => {
    if (!item.schedules || !Array.isArray(item.schedules)) return;
    
    const techId = item.technician._id;
    if (!techId) return;
    
    item.schedules.forEach((schedule) => {
      if (!schedule || !schedule.appoinment_date) return;
      
      try {
        const scheduleDate = new Date(schedule.appoinment_date);
        const dateKey = format(scheduleDate, "yyyy-MM-dd");
        
        if (!schedulesByDate[dateKey]) {
          schedulesByDate[dateKey] = {};
        }
        if (!schedulesByDate[dateKey][techId]) {
          schedulesByDate[dateKey][techId] = [];
        }
        schedulesByDate[dateKey][techId].push(schedule);
      } catch (e) {
        console.error("Error parsing date:", schedule.appoinment_date, e);
      }
    });
  });

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === "week") {
      // Start of week: Sunday (0), End of week: Saturday (6)
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      // Normalize to start of day
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  };

  const { start, end } = getDateRange();
  
  // For week view, manually create 7 days to ensure all are included
  const days = viewMode === "week"
    ? Array.from({ length: 7 }, (_, i) => {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        return day;
      })
    : eachDayOfInterval({ start, end });

  // Navigate weeks/months
  const handlePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get technicians for a specific date
  const getTechniciansForDate = (date: Date): Array<{ tech: TechnicianScheduleItem["technician"]; count: number }> => {
    const dateKey = format(date, "yyyy-MM-dd");
    const techsForDate = schedulesByDate[dateKey] || {};
    
    // Create a map of technician ID to technician info
    const techMap = new Map<string, TechnicianScheduleItem["technician"]>();
    data.forEach((item) => {
      if (item.technician && item.technician._id) {
        techMap.set(item.technician._id, item.technician);
      }
    });
    
    // Get all technicians that have schedules on this date
    const result: Array<{ tech: TechnicianScheduleItem["technician"]; count: number }> = [];
    
    Object.entries(techsForDate).forEach(([techId, schedules]) => {
      const tech = techMap.get(techId);
      if (tech && schedules && schedules.length > 0) {
        result.push({
          tech,
          count: schedules.length,
        });
      }
    });
    
    return result;
  };

  // Get all schedules for a date
  const getSchedulesForDate = (date: Date): ScheduleItem[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    const techsForDate = schedulesByDate[dateKey] || {};
    
    const allSchedules: ScheduleItem[] = [];
    Object.values(techsForDate).forEach((schedules) => {
      allSchedules.push(...schedules);
    });
    
    return allSchedules;
  };

  // Week day names
  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevious}
            className="h-9 w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">
              {viewMode === "week" ? (
                <span>
                  {format(start, "dd/MM", { locale: vi })} - {format(end, "dd/MM/yyyy", { locale: vi })}
                </span>
              ) : (
                <span>
                  Tháng {format(currentDate, "MM/yyyy", { locale: vi })}
                </span>
              )}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNext}
            className="h-9 w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Select value={viewMode} onValueChange={(value: "week" | "month") => setViewMode(value)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Theo tuần</SelectItem>
            <SelectItem value="month">Theo tháng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "text-center text-sm font-medium py-2",
                    index === 0 && "text-red-600"
                  )}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const technicians = getTechniciansForDate(day);
                const schedules = getSchedulesForDate(day);
                const dayOfWeek = getDay(day);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[120px] border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md",
                      isCurrentDay && "ring-2 ring-primary",
                      isWeekend && "bg-gray-50/50",
                      schedules.length > 0 && "bg-blue-50/30"
                    )}
                    onClick={() => onDateClick?.(day, schedules)}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isCurrentDay && "text-primary font-bold",
                          isWeekend && "text-red-600"
                        )}>
                        {format(day, "d")}
                      </span>
                      {schedules.length > 0 && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {schedules.length}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Technician indicators */}
                    <div className="space-y-1 mt-1 max-h-[80px] overflow-y-auto">
                      {technicians.map(({ tech, count }) => (
                        <div
                          key={tech._id}
                          className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 truncate"
                          title={`${tech.fullName}: ${count} lịch hẹn`}>
                          {tech.fullName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

