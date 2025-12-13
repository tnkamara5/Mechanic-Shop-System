import React, { useState, useEffect } from 'react';
import schedulingService from '../services/schedulingService';
import browserDatabase from '../services/browserDatabase';
import type { CommonService, ServiceDuration } from '../types/models';

interface ServiceSelectorProps {
  selectedService?: string;
  vehicleYear?: number;
  onServiceSelect: (service: {
    serviceId: string;
    serviceName: string;
    category: string;
    estimatedDuration: number;
    estimatedPrice?: number;
  }) => void;
  className?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  vehicleYear,
  onServiceSelect,
  className = '',
}) => {
  const [services, setServices] = useState<CommonService[]>([]);
  const [serviceDurations, setServiceDurations] = useState<ServiceDuration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadServices();
    loadServiceDurations();
  }, []);

  const loadServices = () => {
    const availableServices = browserDatabase.getCommonServices();
    setServices(availableServices);
  };

  const loadServiceDurations = () => {
    const durations = schedulingService.getAllServiceDurations();
    setServiceDurations(durations);
  };

  const getServiceDuration = (serviceId: string): number => {
    return schedulingService.calculateServiceDuration(serviceId, vehicleYear);
  };

  const getServiceDurationConfig = (serviceId: string): ServiceDuration | undefined => {
    return serviceDurations.find(sd => sd.service_id === serviceId);
  };

  const getServiceCategories = (): string[] => {
    const categories = services.map(service => service.category || 'general');
    return ['all', ...Array.from(new Set(categories))];
  };

  const getFilteredServices = (): CommonService[] => {
    if (selectedCategory === 'all') {
      return services;
    }
    return services.filter(service => service.category === selectedCategory);
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      all: '🔧',
      maintenance: '🛠️',
      inspection: '🔍',
      repair: '⚙️',
      electrical: '⚡',
      engine: '🚗',
      brake: '🛑',
      tire: '🛞',
      general: '🔧',
    };
    return icons[category] || '🔧';
  };

  const getComplexityIndicator = (serviceId: string): string => {
    const config = getServiceDurationConfig(serviceId);
    if (!config) return '';

    if (config.complexity_multiplier > 1.3) return '🔴'; // Complex
    if (config.complexity_multiplier > 1.1) return '🟡'; // Moderate
    return '🟢'; // Simple
  };

  const getServiceDescription = (service: CommonService): string => {
    const config = getServiceDurationConfig(service.id);

    let description = service.description || '';

    if (config && vehicleYear && vehicleYear < 2010) {
      description += ` (Extended time for older vehicle)`;
    }

    return description;
  };

  const handleServiceSelection = (service: CommonService) => {
    const duration = getServiceDuration(service.id);

    onServiceSelect({
      serviceId: service.id,
      serviceName: service.name,
      category: service.category || 'general',
      estimatedDuration: duration,
      estimatedPrice: service.base_price,
    });
  };

  const categories = getServiceCategories();
  const filteredServices = getFilteredServices();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Select Service Type
        </h3>

        {/* Category Filter */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{getCategoryIcon(category)}</span>
                <span className="capitalize">{category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredServices.map((service) => {
            const duration = getServiceDuration(service.id);
            const config = getServiceDurationConfig(service.id);
            const isSelected = selectedService === service.id;
            const complexityIndicator = getComplexityIndicator(service.id);

            return (
              <div
                key={service.id}
                onClick={() => handleServiceSelection(service)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryIcon(service.category || 'general')}</span>
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    {complexityIndicator && (
                      <span className="text-sm" title={
                        complexityIndicator === '🔴' ? 'Complex service' :
                        complexityIndicator === '🟡' ? 'Moderate complexity' :
                        'Simple service'
                      }>
                        {complexityIndicator}
                      </span>
                    )}
                  </div>
                  {service.base_price && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ${service.base_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">starting</div>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  {getServiceDescription(service)}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span>⏱️</span>
                      <span className="text-gray-600">
                        ~{Math.round(duration / 15) * 15} min
                      </span>
                    </div>
                    {config?.requires_specialist && (
                      <div className="flex items-center space-x-1">
                        <span>👨‍🔧</span>
                        <span className="text-gray-600">Specialist</span>
                      </div>
                    )}
                  </div>

                  {service.labor_hours && (
                    <div className="text-xs text-gray-500">
                      {service.labor_hours}h labor
                    </div>
                  )}
                </div>

                {/* Duration Range */}
                {config && (
                  <div className="mt-2 text-xs text-gray-500">
                    Range: {config.minimum_minutes}-{config.maximum_minutes} min
                    {config.buffer_minutes > 0 && ` (+${config.buffer_minutes} min cleanup)`}
                  </div>
                )}

                {/* Older Vehicle Notice */}
                {vehicleYear && vehicleYear < 2010 && config && config.complexity_multiplier > 1.0 && (
                  <div className="mt-2 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                    ⚠️ Extended time estimated for older vehicle
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No Services Message */}
        {filteredServices.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No services found
            </h3>
            <p className="text-gray-500">
              No services available in the "{selectedCategory}" category.
            </p>
          </div>
        )}

        {/* Service Duration Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-2">Duration Guide:</div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <span>🟢</span>
              <span>Quick service</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🟡</span>
              <span>Standard service</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🔴</span>
              <span>Complex service</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>👨‍🔧</span>
              <span>Requires specialist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelector;