import React, { useState, useEffect } from 'react';
import schedulingService from '../services/schedulingService';
import type { TimeSlot } from '../types/models';

interface TimeSlotPickerProps {
  selectedDate: Date;
  serviceId: string;
  vehicleYear?: number;
  selectedTimeSlot?: TimeSlot;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
  className?: string;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedDate,
  serviceId,
  vehicleYear,
  selectedTimeSlot,
  onTimeSlotSelect,
  className = '',
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    loadTimeSlots();
  }, [selectedDate, serviceId, vehicleYear]);

  const loadTimeSlots = async () => {
    setIsLoading(true);
    try {
      const slots = schedulingService.getAvailableTimeSlots(selectedDate, serviceId, vehicleYear);
      setTimeSlots(slots);
    } catch (error) {
      console.error('Failed to load time slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (startTime: Date, endTime: Date): string => {
    const durationMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.round(durationMs / (1000 * 60));

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    return `${minutes}m`;
  };

  const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' => {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const groupSlotsByTimeOfDay = (slots: TimeSlot[]): Record<string, TimeSlot[]> => {
    const groups: Record<string, TimeSlot[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    slots.forEach(slot => {
      const timeOfDay = getTimeOfDay(slot.start);
      groups[timeOfDay].push(slot);
    });

    return groups;
  };

  const getSlotStatusColor = (slot: TimeSlot): string => {
    if (!slot.available) {
      return 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed';
    }

    if (selectedTimeSlot &&
        slot.start.getTime() === selectedTimeSlot.start.getTime()) {
      return 'border-blue-500 bg-blue-500 text-white ring-2 ring-blue-200';
    }

    return 'border-gray-200 bg-white text-gray-900 hover:border-blue-300 hover:bg-blue-50 cursor-pointer';
  };

  const getUnavailableReason = (slot: TimeSlot): string => {
    switch (slot.reason) {
      case 'booked':
        return 'Already booked';
      case 'lunch':
        return 'Lunch break';
      case 'closed':
        return 'Shop closed';
      case 'tech_unavailable':
        return 'No technician available';
      default:
        return 'Unavailable';
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.available) {
      onTimeSlotSelect(slot);
    }
  };

  const availableSlots = timeSlots.filter(slot => slot.available);
  const unavailableSlots = timeSlots.filter(slot => !slot.available);
  const groupedSlots = groupSlotsByTimeOfDay(availableSlots);

  const getTimeOfDayIcon = (timeOfDay: string): string => {
    const icons = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌅',
    };
    return icons[timeOfDay as keyof typeof icons] || '🕐';
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading available times...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Available Times
            </h3>
            <p className="text-sm text-gray-500">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 Grid
            </button>
          </div>
        </div>

        {availableSlots.length === 0 ? (
          /* No Available Slots */
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">😔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No available times
            </h3>
            <p className="text-gray-500 mb-4">
              All appointment slots are booked for this date.
            </p>

            {/* Suggest Alternative */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm mb-2">
                💡 Try selecting a different date or consider:
              </p>
              <ul className="text-blue-600 text-sm space-y-1">
                <li>• Weekday mornings are often less busy</li>
                <li>• Check the next week for more availability</li>
                <li>• Call us for rush appointments</li>
              </ul>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-4">
            {Object.entries(groupedSlots).map(([timeOfDay, slots]) => (
              slots.length > 0 && (
                <div key={timeOfDay}>
                  <div className="flex items-center space-x-2 mb-3">
                    <span>{getTimeOfDayIcon(timeOfDay)}</span>
                    <h4 className="text-sm font-medium text-gray-900 capitalize">
                      {timeOfDay}
                    </h4>
                    <span className="text-xs text-gray-500">
                      ({slots.length} available)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((slot, index) => (
                      <div
                        key={index}
                        onClick={() => handleSlotClick(slot)}
                        className={`p-3 rounded-lg border text-center transition-all ${getSlotStatusColor(slot)}`}
                      >
                        <div className="font-medium">
                          {formatTime(slot.start)}
                        </div>
                        <div className="text-xs mt-1 opacity-75">
                          {formatDuration(slot.start, slot.end)}
                        </div>
                        {slot.available_techs.length > 0 && (
                          <div className="text-xs mt-1 opacity-75">
                            {slot.available_techs.length} tech{slot.available_techs.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {availableSlots.map((slot, index) => (
              <div
                key={index}
                onClick={() => handleSlotClick(slot)}
                className={`p-2 rounded border text-center text-sm transition-all ${getSlotStatusColor(slot)}`}
              >
                <div className="font-medium">
                  {formatTime(slot.start)}
                </div>
                <div className="text-xs opacity-75">
                  {formatDuration(slot.start, slot.end)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Slot Summary */}
        {selectedTimeSlot && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-blue-900">
                  Selected Time
                </div>
                <div className="text-blue-700">
                  {formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)}
                </div>
                <div className="text-sm text-blue-600">
                  Duration: {formatDuration(selectedTimeSlot.start, selectedTimeSlot.end)}
                </div>
              </div>
              <div className="text-blue-500">
                ✅
              </div>
            </div>
          </div>
        )}

        {/* Unavailable Slots Summary */}
        {unavailableSlots.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <details>
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Unavailable times ({unavailableSlots.length})
              </summary>
              <div className="mt-2 space-y-1">
                {unavailableSlots.slice(0, 6).map((slot, index) => (
                  <div key={index} className="flex justify-between text-xs text-gray-600">
                    <span>{formatTime(slot.start)}</span>
                    <span>{getUnavailableReason(slot)}</span>
                  </div>
                ))}
                {unavailableSlots.length > 6 && (
                  <div className="text-xs text-gray-500">
                    ...and {unavailableSlots.length - 6} more
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Booking Info */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700">
            <div className="font-medium mb-1">💡 Booking Tips:</div>
            <ul className="space-y-1 text-xs">
              <li>• Morning slots often have more availability</li>
              <li>• Arrive 10 minutes early for your appointment</li>
              <li>• Bring your vehicle registration and keys</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotPicker;