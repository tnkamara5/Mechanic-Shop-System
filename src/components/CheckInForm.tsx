import React, { useState } from 'react';
import vinDecoderService from '../services/vinDecoder';
import { cleanMileage, cleanPhoneNumber, formatPhoneNumber, cleanYear } from '../utils/inputCleaning';
import AppointmentScheduler from './AppointmentScheduler';
import type { CustomerCheckInForm, TimeSlot } from '../types/models';

interface CheckInFormProps {
  onSubmit: (data: CustomerCheckInForm) => void;
  isLoading?: boolean;
}

const CheckInForm: React.FC<CheckInFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<CustomerCheckInForm>({
    customer: {
      name: '',
      phone: '',
      email: '',
    },
    vehicle: {
      vin: '',
      year: undefined,
      make: '',
      model: '',
      license_plate: '',
      color: '',
    },
    service: {
      mileage: undefined,
      customer_concern: '',
      appointment_date: '',
      photos: [],
    },
  });

  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinError, setVinError] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{
    service: any;
    date: Date;
    timeSlot: TimeSlot;
  } | null>(null);

  // Display values for formatted inputs
  const [displayValues, setDisplayValues] = useState({
    phone: '',
    mileage: '',
    year: '',
  });

  const handleVinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = vinDecoderService.cleanVin(e.target.value);
    setVinError('');

    setFormData(prev => ({
      ...prev,
      vehicle: { ...prev.vehicle, vin }
    }));

    // Auto-decode when VIN is 17 characters
    if (vin.length === 17 && vinDecoderService.isValidVin(vin)) {
      setIsDecodingVin(true);
      try {
        const decoded = await vinDecoderService.decodeVin(vin);

        if (decoded.ErrorCode && decoded.ErrorCode !== '0') {
          setVinError(decoded.ErrorText || 'Invalid VIN');
        } else {
          setFormData(prev => ({
            ...prev,
            vehicle: {
              ...prev.vehicle,
              year: decoded.ModelYear ? parseInt(decoded.ModelYear) : undefined,
              make: decoded.Make || '',
              model: decoded.Model || '',
            }
          }));
        }
      } catch (error) {
        setVinError(error instanceof Error ? error.message : 'Failed to decode VIN');
      } finally {
        setIsDecodingVin(false);
      }
    }
  };

  const handleInputChange = (
    section: keyof CustomerCheckInForm,
    field: string,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanPhoneNumber(input);
    const formatted = formatPhoneNumber(cleaned);

    setDisplayValues(prev => ({ ...prev, phone: formatted }));
    handleInputChange('customer', 'phone', cleaned);
  };

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValues(prev => ({ ...prev, mileage: input }));

    const cleaned = cleanMileage(input);
    if (cleaned !== null) {
      handleInputChange('service', 'mileage', cleaned);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValues(prev => ({ ...prev, year: input }));

    const cleaned = cleanYear(input);
    if (cleaned !== null) {
      handleInputChange('vehicle', 'year', cleaned);
    }
  };

  const handleAppointmentSelect = (appointment: {
    service: any;
    date: Date;
    timeSlot: TimeSlot;
  }) => {
    setSelectedAppointment(appointment);
    setShowScheduler(false);

    // Update form data with appointment info
    setFormData(prev => ({
      ...prev,
      service: {
        ...prev.service,
        appointment_date: appointment.timeSlot.start.toISOString().slice(0, 16),
        customer_concern: prev.service.customer_concern || `${appointment.service.serviceName} service requested`,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If appointment was scheduled, create it in the scheduling system
    if (selectedAppointment) {
      try {
        const appointment = {
          customer_id: 'temp', // Will be updated after customer is created
          service_type: selectedAppointment.service.serviceId,
          service_category: selectedAppointment.service.category,
          scheduled_start: selectedAppointment.timeSlot.start.getTime(),
          scheduled_end: selectedAppointment.timeSlot.end.getTime(),
          duration_minutes: selectedAppointment.service.estimatedDuration,
          status: 'scheduled' as const,
          priority: 'normal' as const,
          estimated_price: selectedAppointment.service.estimatedPrice,
          customer_notes: formData.service.customer_concern,
          created_by: 'customer',
        };

        // Store appointment data for later processing
        sessionStorage.setItem('pendingAppointment', JSON.stringify(appointment));
      } catch (error) {
        console.error('Failed to prepare appointment:', error);
      }
    }

    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-shop-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-shop-900 mb-2">
            Welcome to Auto Shop
          </h1>
          <p className="text-shop-600">
            Check in before your appointment to save time
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-shop-900 mb-4">
              Your Information
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-shop-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="input"
                  value={formData.customer.name}
                  onChange={(e) => handleInputChange('customer', 'name', e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-shop-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  className="input"
                  value={displayValues.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-shop-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  className="input"
                  value={formData.customer.email}
                  onChange={(e) => handleInputChange('customer', 'email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-shop-900 mb-4">
              Vehicle Information
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="vin" className="block text-sm font-medium text-shop-700 mb-2">
                  VIN (Vehicle Identification Number)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="vin"
                    className={`input ${vinError ? 'border-danger-500' : ''}`}
                    value={formData.vehicle.vin}
                    onChange={handleVinChange}
                    placeholder="1HGCM82633A123456"
                    maxLength={17}
                  />
                  {isDecodingVin && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-shop-600"></div>
                    </div>
                  )}
                </div>
                {vinError && (
                  <p className="mt-1 text-sm text-danger-600">{vinError}</p>
                )}
                {formData.vehicle.vin && formData.vehicle.vin.length === 17 && !vinError && (
                  <p className="mt-1 text-sm text-success-600">
                    ✓ VIN decoded successfully
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-shop-700 mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    id="year"
                    className="input"
                    value={displayValues.year}
                    onChange={handleYearChange}
                    placeholder="2020"
                  />
                </div>

                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-shop-700 mb-2">
                    Make
                  </label>
                  <input
                    type="text"
                    id="make"
                    className="input"
                    value={formData.vehicle.make}
                    onChange={(e) => handleInputChange('vehicle', 'make', e.target.value)}
                    placeholder="Honda"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-shop-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  className="input"
                  value={formData.vehicle.model}
                  onChange={(e) => handleInputChange('vehicle', 'model', e.target.value)}
                  placeholder="Accord"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="license_plate" className="block text-sm font-medium text-shop-700 mb-2">
                    License Plate
                  </label>
                  <input
                    type="text"
                    id="license_plate"
                    className="input"
                    value={formData.vehicle.license_plate}
                    onChange={(e) => handleInputChange('vehicle', 'license_plate', e.target.value)}
                    placeholder="ABC123"
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-shop-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    className="input"
                    value={formData.vehicle.color}
                    onChange={(e) => handleInputChange('vehicle', 'color', e.target.value)}
                    placeholder="Silver"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-shop-900 mb-4">
              Service Details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-shop-700 mb-2">
                  Current Mileage
                </label>
                <input
                  type="text"
                  id="mileage"
                  className="input"
                  value={displayValues.mileage}
                  onChange={handleMileageChange}
                  placeholder="75,000 or 75k"
                />
              </div>

              <div>
                <label htmlFor="concern" className="block text-sm font-medium text-shop-700 mb-2">
                  What brings you in today? *
                </label>
                <textarea
                  id="concern"
                  required
                  rows={4}
                  className="input resize-none"
                  value={formData.service.customer_concern}
                  onChange={(e) => handleInputChange('service', 'customer_concern', e.target.value)}
                  placeholder="Describe the issue or service needed. For example: 'Squeaking noise when braking, especially when it rains'"
                />
              </div>

              {/* Appointment Scheduling */}
              <div>
                <label className="block text-sm font-medium text-shop-700 mb-2">
                  Appointment Scheduling
                </label>

                {!selectedAppointment ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-blue-900">Schedule an Appointment</h4>
                          <p className="text-sm text-blue-700">
                            Book your service time in advance and skip the wait!
                          </p>
                        </div>
                        <div className="text-2xl">📅</div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => setShowScheduler(true)}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          📅 Schedule Appointment
                        </button>
                        <div className="text-center text-sm text-blue-600 py-2">
                          or continue for walk-in service
                        </div>
                      </div>
                    </div>

                    {/* Manual Date Input (Fallback) */}
                    <details className="group">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                        Already have an appointment? Enter details manually
                      </summary>
                      <div className="mt-2">
                        <input
                          type="datetime-local"
                          id="appointment_date"
                          className="input"
                          value={formData.service.appointment_date}
                          onChange={(e) => handleInputChange('service', 'appointment_date', e.target.value)}
                          placeholder="Select appointment date and time"
                        />
                      </div>
                    </details>
                  </div>
                ) : (
                  /* Selected Appointment Display */
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-green-600">✅</span>
                          <h4 className="font-medium text-green-900">
                            Appointment Scheduled
                          </h4>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="text-green-800">
                            <strong>{selectedAppointment.service.serviceName}</strong>
                          </div>
                          <div className="text-green-700">
                            {selectedAppointment.date.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-green-700">
                            {selectedAppointment.timeSlot.start.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })} - {selectedAppointment.timeSlot.end.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                          <div className="text-green-600">
                            Duration: ~{selectedAppointment.service.estimatedDuration} minutes
                          </div>
                          {selectedAppointment.service.estimatedPrice && (
                            <div className="text-green-700">
                              Estimated price: ${selectedAppointment.service.estimatedPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppointment(null);
                          setFormData(prev => ({
                            ...prev,
                            service: {
                              ...prev.service,
                              appointment_date: '',
                            },
                          }));
                        }}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Remove appointment"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-4 text-lg font-semibold"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Checking In...
              </span>
            ) : (
              'Complete Check-In'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-shop-500 mt-6">
          Your information is secure and will only be used for this service appointment.
        </p>
      </div>

      {/* Appointment Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Schedule Your Appointment
                </h2>
                <button
                  onClick={() => setShowScheduler(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4">
              <AppointmentScheduler
                vehicleYear={formData.vehicle.year}
                onAppointmentSelect={handleAppointmentSelect}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInForm;