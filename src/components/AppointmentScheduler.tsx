import React, { useState } from 'react';
import ServiceSelector from './ServiceSelector';
import CalendarView from './CalendarView';
import TimeSlotPicker from './TimeSlotPicker';
import type { TimeSlot } from '../types/models';

interface SelectedService {
  serviceId: string;
  serviceName: string;
  category: string;
  estimatedDuration: number;
  estimatedPrice?: number;
}

interface AppointmentSchedulerProps {
  vehicleYear?: number;
  onAppointmentSelect: (appointment: {
    service: SelectedService;
    date: Date;
    timeSlot: TimeSlot;
  }) => void;
  className?: string;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  vehicleYear,
  onAppointmentSelect,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState<'service' | 'date' | 'time' | 'confirm'>('service');
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  const handleServiceSelect = (service: SelectedService) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setCurrentStep('date');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setCurrentStep('time');
  };

  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setCurrentStep('confirm');
  };

  const handleConfirm = () => {
    if (selectedService && selectedDate && selectedTimeSlot) {
      onAppointmentSelect({
        service: selectedService,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
      });
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'date':
        setCurrentStep('service');
        break;
      case 'time':
        setCurrentStep('date');
        break;
      case 'confirm':
        setCurrentStep('time');
        break;
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStepIndicator = (_step: string, index: number): string => {
    const currentIndex = ['service', 'date', 'time', 'confirm'].indexOf(currentStep);
    if (index < currentIndex) return 'bg-green-500 text-white'; // Completed
    if (index === currentIndex) return 'bg-blue-500 text-white'; // Current
    return 'bg-gray-200 text-gray-600'; // Future
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {[
              { key: 'service', label: 'Service', icon: '🔧' },
              { key: 'date', label: 'Date', icon: '📅' },
              { key: 'time', label: 'Time', icon: '🕐' },
              { key: 'confirm', label: 'Confirm', icon: '✅' },
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStepIndicator(step.key, index)}`}
                >
                  <span className="text-xs">{step.icon}</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                  {step.label}
                </span>
                {index < 3 && (
                  <div className="ml-4 w-8 border-t border-gray-300"></div>
                )}
              </div>
            ))}
          </div>

          {/* Back Button */}
          {currentStep !== 'service' && (
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
          )}
        </div>

        {/* Step Content */}
        {currentStep === 'service' && (
          <ServiceSelector
            selectedService={selectedService?.serviceId}
            vehicleYear={vehicleYear}
            onServiceSelect={handleServiceSelect}
          />
        )}

        {currentStep === 'date' && selectedService && (
          <CalendarView
            selectedDate={selectedDate || undefined}
            serviceId={selectedService.serviceId}
            vehicleYear={vehicleYear}
            onDateSelect={handleDateSelect}
          />
        )}

        {currentStep === 'time' && selectedService && selectedDate && (
          <TimeSlotPicker
            selectedDate={selectedDate}
            serviceId={selectedService.serviceId}
            vehicleYear={vehicleYear}
            selectedTimeSlot={selectedTimeSlot || undefined}
            onTimeSlotSelect={handleTimeSlotSelect}
          />
        )}

        {currentStep === 'confirm' && selectedService && selectedDate && selectedTimeSlot && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Your Appointment
              </h3>
              <p className="text-gray-600">
                Please review your appointment details below
              </p>
            </div>

            {/* Appointment Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="space-y-4">
                {/* Service Details */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-blue-900">Service</div>
                    <div className="text-blue-800">{selectedService.serviceName}</div>
                    <div className="text-sm text-blue-600">
                      {selectedService.category} • ~{selectedService.estimatedDuration} minutes
                    </div>
                  </div>
                  {selectedService.estimatedPrice && (
                    <div className="text-right">
                      <div className="text-sm text-blue-600">Estimated</div>
                      <div className="font-medium text-blue-900">
                        ${selectedService.estimatedPrice.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date & Time */}
                <div className="border-t border-blue-200 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium text-blue-900">Date</div>
                      <div className="text-blue-800">
                        {formatDateTime(selectedDate)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">Time</div>
                      <div className="text-blue-800">
                        {formatTime(selectedTimeSlot.start)} - {formatTime(selectedTimeSlot.end)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info Notice */}
                {vehicleYear && vehicleYear < 2010 && (
                  <div className="border-t border-blue-200 pt-4">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <span>ℹ️</span>
                      <span className="text-sm">
                        Extended time allocated for older vehicle ({vehicleYear})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-800">
                <div className="font-medium mb-2">📝 Before Your Appointment:</div>
                <ul className="text-sm space-y-1">
                  <li>• Arrive 10 minutes early for check-in</li>
                  <li>• Bring your vehicle registration and insurance</li>
                  <li>• Remove personal items from your vehicle</li>
                  <li>• Note any additional concerns to discuss</li>
                </ul>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="flex justify-center">
              <button
                onClick={handleConfirm}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                ✅ Confirm Appointment
              </button>
            </div>
          </div>
        )}

        {/* Progress Summary (when not on service step) */}
        {currentStep !== 'service' && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                {selectedService && (
                  <span>🔧 {selectedService.serviceName}</span>
                )}
                {selectedDate && (
                  <span>📅 {selectedDate.toLocaleDateString()}</span>
                )}
                {selectedTimeSlot && (
                  <span>🕐 {formatTime(selectedTimeSlot.start)}</span>
                )}
              </div>
              {selectedService?.estimatedPrice && (
                <span className="font-medium">
                  ~${selectedService.estimatedPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentScheduler;