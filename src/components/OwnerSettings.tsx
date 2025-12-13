import React, { useState, useEffect } from 'react';
import schedulingService from '../services/schedulingService';
import type { ShopSchedule, ServiceDuration } from '../types/models';

interface OwnerSettingsProps {
  onClose: () => void;
}

const OwnerSettings: React.FC<OwnerSettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'hours' | 'services' | 'rules'>('hours');
  const [shopSchedules, setShopSchedules] = useState<ShopSchedule[]>([]);
  const [serviceDurations, setServiceDurations] = useState<ServiceDuration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const schedules = schedulingService.getAllShopSchedules();
      const durations = schedulingService.getAllServiceDurations();

      setShopSchedules(schedules);
      setServiceDurations(durations);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateShopSchedule = async (dayOfWeek: number, updates: Partial<ShopSchedule>) => {
    try {
      const updated = schedulingService.updateShopSchedule(dayOfWeek, updates);
      if (updated) {
        setShopSchedules(prev =>
          prev.map(schedule =>
            schedule.day_of_week === dayOfWeek ? updated : schedule
          )
        );
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Failed to update shop schedule:', error);
    }
  };

  const updateServiceDuration = async (serviceId: string, updates: Partial<ServiceDuration>) => {
    try {
      const updated = schedulingService.updateServiceDuration(serviceId, updates);
      if (updated) {
        setServiceDurations(prev =>
          prev.map(duration =>
            duration.service_id === serviceId ? updated : duration
          )
        );
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Failed to update service duration:', error);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  // const formatTime = (time: string): string => {
  //   // Convert 24h to 12h format for display
  //   const [hours, minutes] = time.split(':').map(Number);
  //   const period = hours >= 12 ? 'PM' : 'AM';
  //   const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  //   return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  // };

  const tabs = [
    { key: 'hours', label: 'Business Hours', icon: '🕐' },
    { key: 'services', label: 'Service Times', icon: '⚙️' },
    { key: 'rules', label: 'Booking Rules', icon: '📋' },
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Shop Settings</h2>
              <p className="text-gray-600">Configure your business hours, service times, and booking rules</p>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h3>
                <p className="text-gray-600 mb-6">
                  Set your shop's operating hours for each day of the week.
                </p>

                <div className="space-y-4">
                  {shopSchedules.sort((a, b) => a.day_of_week - b.day_of_week).map((schedule) => (
                    <div key={schedule.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={!schedule.is_closed}
                              onChange={(e) =>
                                updateShopSchedule(schedule.day_of_week, {
                                  is_closed: !e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 font-medium text-gray-900 w-24">
                              {getDayName(schedule.day_of_week)}
                            </span>
                          </label>

                          {!schedule.is_closed && (
                            <>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={schedule.open_time}
                                  onChange={(e) =>
                                    updateShopSchedule(schedule.day_of_week, {
                                      open_time: e.target.value,
                                    })
                                  }
                                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                  type="time"
                                  value={schedule.close_time}
                                  onChange={(e) =>
                                    updateShopSchedule(schedule.day_of_week, {
                                      close_time: e.target.value,
                                    })
                                  }
                                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Lunch:</span>
                                <input
                                  type="time"
                                  value={schedule.lunch_start || ''}
                                  onChange={(e) =>
                                    updateShopSchedule(schedule.day_of_week, {
                                      lunch_start: e.target.value || undefined,
                                    })
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                                  placeholder="Start"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                  type="time"
                                  value={schedule.lunch_end || ''}
                                  onChange={(e) =>
                                    updateShopSchedule(schedule.day_of_week, {
                                      lunch_end: e.target.value || undefined,
                                    })
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                                  placeholder="End"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {schedule.is_closed && (
                          <span className="text-red-600 text-sm font-medium">Closed</span>
                        )}
                      </div>

                      {!schedule.is_closed && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-4 text-sm">
                            <label className="flex items-center space-x-2">
                              <span className="text-gray-600">Max appointments/hour:</span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={schedule.max_appointments_per_hour || 4}
                                onChange={(e) =>
                                  updateShopSchedule(schedule.day_of_week, {
                                    max_appointments_per_hour: parseInt(e.target.value) || 4,
                                  })
                                }
                                className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Service Duration Settings</h3>
                <p className="text-gray-600 mb-6">
                  Configure estimated times for each service. These times are used for appointment scheduling.
                </p>

                <div className="space-y-4">
                  {serviceDurations.map((duration) => (
                    <div key={duration.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{duration.service_name}</h4>
                          <span className="text-sm text-gray-600 capitalize">{duration.category}</span>
                        </div>
                        <label className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Requires specialist:</span>
                          <input
                            type="checkbox"
                            checked={duration.requires_specialist}
                            onChange={(e) =>
                              updateServiceDuration(duration.service_id, {
                                requires_specialist: e.target.checked,
                              })
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Estimated (min)</label>
                          <input
                            type="number"
                            min="5"
                            max="480"
                            step="5"
                            value={duration.estimated_minutes}
                            onChange={(e) =>
                              updateServiceDuration(duration.service_id, {
                                estimated_minutes: parseInt(e.target.value) || 30,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Minimum (min)</label>
                          <input
                            type="number"
                            min="5"
                            max="240"
                            step="5"
                            value={duration.minimum_minutes}
                            onChange={(e) =>
                              updateServiceDuration(duration.service_id, {
                                minimum_minutes: parseInt(e.target.value) || 15,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Maximum (min)</label>
                          <input
                            type="number"
                            min="15"
                            max="480"
                            step="5"
                            value={duration.maximum_minutes}
                            onChange={(e) =>
                              updateServiceDuration(duration.service_id, {
                                maximum_minutes: parseInt(e.target.value) || 60,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Buffer (min)</label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            step="5"
                            value={duration.buffer_minutes}
                            onChange={(e) =>
                              updateServiceDuration(duration.service_id, {
                                buffer_minutes: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Complexity multiplier for older vehicles:</span>
                            <input
                              type="number"
                              min="1.0"
                              max="3.0"
                              step="0.1"
                              value={duration.complexity_multiplier}
                              onChange={(e) =>
                                updateServiceDuration(duration.service_id, {
                                  complexity_multiplier: parseFloat(e.target.value) || 1.0,
                                })
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </label>

                          <label className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Can overlap with other work:</span>
                            <input
                              type="checkbox"
                              checked={duration.can_overlap}
                              onChange={(e) =>
                                updateServiceDuration(duration.service_id, {
                                  can_overlap: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Rules</h3>
                <p className="text-gray-600 mb-6">
                  Configure general booking policies and restrictions.
                </p>

                <div className="space-y-6">
                  {/* Booking Window */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Booking Window</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700 w-48">Maximum days in advance:</span>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          defaultValue="30"
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700 w-48">Minimum hours in advance:</span>
                        <input
                          type="number"
                          min="1"
                          max="48"
                          defaultValue="2"
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Same-Day Policies */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Same-Day Service</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Allow same-day bookings</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Charge premium for rush jobs (+20%)</span>
                      </label>
                    </div>
                  </div>

                  {/* Cancellation Policies */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Cancellation Policy</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700 w-48">Free cancellation window:</span>
                        <input
                          type="number"
                          min="1"
                          max="48"
                          defaultValue="24"
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">hours</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Charge no-show fee</span>
                      </label>
                    </div>
                  </div>

                  {/* Customer Limits */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Customer Limits</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700 w-48">Max concurrent appointments:</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          defaultValue="2"
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </label>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Require phone verification for new customers</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Changes are saved automatically
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerSettings;