import React, { useState } from 'react';
import vinDecoderService from '../services/vinDecoder';
import type { CustomerCheckInForm } from '../types/models';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                  value={formData.customer.phone}
                  onChange={(e) => handleInputChange('customer', 'phone', e.target.value)}
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
                    type="number"
                    id="year"
                    className="input"
                    value={formData.vehicle.year || ''}
                    onChange={(e) => handleInputChange('vehicle', 'year', parseInt(e.target.value))}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
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
                  type="number"
                  id="mileage"
                  className="input"
                  value={formData.service.mileage || ''}
                  onChange={(e) => handleInputChange('service', 'mileage', parseInt(e.target.value))}
                  placeholder="75000"
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

              <div>
                <label htmlFor="appointment_date" className="block text-sm font-medium text-shop-700 mb-2">
                  Appointment Date/Time (if scheduled)
                </label>
                <input
                  type="datetime-local"
                  id="appointment_date"
                  className="input"
                  value={formData.service.appointment_date}
                  onChange={(e) => handleInputChange('service', 'appointment_date', e.target.value)}
                />
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
    </div>
  );
};

export default CheckInForm;