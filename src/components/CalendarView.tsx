import React, { useState, useEffect } from 'react';
import schedulingService from '../services/schedulingService';

interface CalendarViewProps {
  selectedDate?: Date;
  serviceId?: string;
  vehicleYear?: number;
  onDateSelect: (date: Date) => void;
  className?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  serviceId,
  vehicleYear,
  onDateSelect,
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityCache, setAvailabilityCache] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (serviceId) {
      loadAvailabilityForMonth(currentMonth);
    }
  }, [currentMonth, serviceId, vehicleYear]);

  const loadAvailabilityForMonth = async (month: Date) => {
    if (!serviceId) return;

    const cache = new Map<string, boolean>();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // Get first and last day of the month
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    // Check availability for each day
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toDateString();
      const slots = schedulingService.getAvailableTimeSlots(new Date(date), serviceId, vehicleYear);
      const hasAvailableSlots = slots.some(slot => slot.available);
      cache.set(dateKey, hasAvailableSlots);
    }

    setAvailabilityCache(cache);
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of month and calculate starting position
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    // Generate 42 days (6 weeks) to fill calendar grid
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000));
    }

    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date, month: Date): boolean => {
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  };

  const isSelected = (date: Date): boolean => {
    return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isShopOpen = (date: Date): boolean => {
    const schedule = schedulingService.getShopScheduleForDay(date);
    return schedule ? !schedule.is_closed : false;
  };

  const hasAvailability = (date: Date): boolean => {
    const dateKey = date.toDateString();
    return availabilityCache.get(dateKey) || false;
  };

  const getDateStatus = (date: Date): {
    available: boolean;
    reason?: string;
    className: string;
  } => {
    if (isPastDate(date)) {
      return {
        available: false,
        reason: 'Past date',
        className: 'text-gray-300 cursor-not-allowed'
      };
    }

    if (!isShopOpen(date)) {
      return {
        available: false,
        reason: 'Shop closed',
        className: 'text-gray-400 cursor-not-allowed'
      };
    }

    if (!isSameMonth(date, currentMonth)) {
      return {
        available: false,
        reason: 'Different month',
        className: 'text-gray-300'
      };
    }

    if (serviceId && !hasAvailability(date)) {
      return {
        available: false,
        reason: 'No available slots',
        className: 'text-red-400 cursor-not-allowed'
      };
    }

    return {
      available: true,
      className: 'text-gray-900 hover:bg-blue-50 cursor-pointer'
    };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDateClick = (date: Date) => {
    const status = getDateStatus(date);
    if (status.available) {
      onDateSelect(new Date(date));
    }
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-lg font-semibold text-gray-900">
            {monthYear}
          </h3>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-gray-500 uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const status = getDateStatus(date);
            const isCurrentSelected = isSelected(date);
            const isTodayDate = isToday(date);

            let cellClassName = `
              relative p-2 text-center text-sm rounded-lg transition-colors
              ${status.className}
              ${isCurrentSelected ? 'bg-blue-500 text-white' : ''}
              ${isTodayDate && !isCurrentSelected ? 'bg-blue-100 text-blue-700 font-medium' : ''}
            `;

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={cellClassName}
                title={status.reason || 'Available'}
              >
                <span>{date.getDate()}</span>

                {/* Availability Indicators */}
                {isSameMonth(date, currentMonth) && !isPastDate(date) && isShopOpen(date) && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    {serviceId && hasAvailability(date) && !isCurrentSelected && (
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    )}
                    {serviceId && !hasAvailability(date) && (
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    )}
                  </div>
                )}

                {/* Shop Closed Indicator */}
                {isSameMonth(date, currentMonth) && !isShopOpen(date) && (
                  <div className="absolute top-1 right-1">
                    <span className="text-xs">🔒</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Legend:</span>
              {serviceId && (
                <span className="text-gray-500">
                  For: {serviceId.replace('-', ' ')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>No slots</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              setCurrentMonth(nextWeek);
            }}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Next Week
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;