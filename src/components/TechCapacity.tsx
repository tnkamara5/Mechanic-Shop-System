import React, { useState, useEffect } from 'react';
import browserDatabase from '../services/browserDatabase';
import type { TechProfile, WorkOrder } from '../types/models';

interface TechWorkloadData {
  tech: TechProfile;
  activeJobs: number;
  totalHours: number;
  weeklyHours: number;
  efficiency: number;
  avgJobTime: number;
  upcomingJobs: WorkOrder[];
}

interface TechCapacityProps {
  onClose: () => void;
}

const TechCapacity: React.FC<TechCapacityProps> = ({ onClose }) => {
  const [techData, setTechData] = useState<TechWorkloadData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTechCapacityData();
  }, [selectedTimeframe]);

  const loadTechCapacityData = () => {
    setIsLoading(true);
    try {
      const techs = browserDatabase.getAllTechProfiles();
      const workOrders = browserDatabase.getWorkOrders();

      const techWorkloadData: TechWorkloadData[] = techs.map(tech => {
        const workload = browserDatabase.getTechWorkload(tech.id);
        const assignedOrders = workOrders.filter(wo => wo.assigned_tech === tech.id && wo.status !== 'completed' && wo.status !== 'cancelled');

        // Calculate efficiency metrics
        const completedOrders = workOrders.filter(wo => wo.assigned_tech === tech.id && wo.status === 'completed');
        const totalCompletedHours = completedOrders.length * 2; // Approximate average
        const avgJobTime = completedOrders.length > 0 ? totalCompletedHours / completedOrders.length : 0;

        // Calculate weekly hours based on timeframe
        let weeklyHours = 0;
        const now = new Date();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

        if (selectedTimeframe === 'week') {
          weeklyHours = workload.estimatedHours;
        } else if (selectedTimeframe === 'today') {
          weeklyHours = workload.estimatedHours / 5; // Daily estimate
        } else {
          weeklyHours = workload.estimatedHours * 4; // Monthly estimate
        }

        const efficiency = tech.hourly_rate ? Math.min(100, (weeklyHours / 40) * 100) : 0;

        return {
          tech,
          activeJobs: workload.activeJobs,
          totalHours: workload.estimatedHours,
          weeklyHours,
          efficiency,
          avgJobTime,
          upcomingJobs: assignedOrders.slice(0, 3)
        };
      });

      setTechData(techWorkloadData);
    } catch (error) {
      console.error('Failed to load tech capacity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCapacityColor = (efficiency: number): string => {
    if (efficiency >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (efficiency >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (efficiency >= 40) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  const getCapacityLabel = (efficiency: number): string => {
    if (efficiency >= 90) return 'Overloaded';
    if (efficiency >= 70) return 'Busy';
    if (efficiency >= 40) return 'Optimal';
    return 'Available';
  };

  const getEfficiencyBarColor = (efficiency: number): string => {
    if (efficiency >= 90) return 'bg-red-500';
    if (efficiency >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTotalShopCapacity = (): { current: number; max: number; percentage: number } => {
    const totalCurrent = techData.reduce((sum, data) => sum + data.weeklyHours, 0);
    const totalMax = techData.length * 40; // 40 hours per week per tech
    const percentage = totalMax > 0 ? (totalCurrent / totalMax) * 100 : 0;

    return { current: totalCurrent, max: totalMax, percentage };
  };

  const getTimeframeLabel = (): string => {
    switch (selectedTimeframe) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'This Week';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading capacity data...</p>
          </div>
        </div>
      </div>
    );
  }

  const shopCapacity = getTotalShopCapacity();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tech Capacity Dashboard</h2>
              <p className="text-gray-600">Monitor technician workloads and shop capacity</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Timeframe Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['today', 'week', 'month'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {timeframe === 'today' ? 'Today' : timeframe === 'week' ? 'Week' : 'Month'}
                  </button>
                ))}
              </div>
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
        </div>

        {/* Shop Overview */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Shop Capacity Overview - {getTimeframeLabel()}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Techs</p>
                  <p className="text-2xl font-bold text-gray-900">{techData.length}</p>
                </div>
                <span className="text-2xl">👥</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {techData.reduce((sum, data) => sum + data.activeJobs, 0)}
                  </p>
                </div>
                <span className="text-2xl">🔧</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shop Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">{shopCapacity.percentage.toFixed(0)}%</p>
                </div>
                <span className="text-2xl">📊</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.max(0, shopCapacity.max - shopCapacity.current).toFixed(0)}h
                  </p>
                </div>
                <span className="text-2xl">⏰</span>
              </div>
            </div>
          </div>

          {/* Overall Capacity Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Shop Capacity</span>
              <span className="text-sm text-gray-600">{shopCapacity.current.toFixed(0)}h / {shopCapacity.max}h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getEfficiencyBarColor(shopCapacity.percentage)}`}
                style={{ width: `${Math.min(100, shopCapacity.percentage)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tech Details */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {techData.map((data) => (
              <div key={data.tech.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{data.tech.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCapacityColor(data.efficiency)}`}>
                          {getCapacityLabel(data.efficiency)}
                        </span>
                        <span className="text-sm text-gray-500">${data.tech.hourly_rate}/hr</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {data.tech.specialties?.slice(0, 3).map((specialty) => (
                          <span key={specialty} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{data.efficiency.toFixed(0)}%</p>
                    <p className="text-sm text-gray-600">capacity</p>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Workload</span>
                    <span className="text-sm text-gray-600">{data.weeklyHours.toFixed(1)}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getEfficiencyBarColor(data.efficiency)}`}
                      style={{ width: `${Math.min(100, data.efficiency)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{data.activeJobs}</p>
                    <p className="text-xs text-gray-600">Active Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{data.totalHours.toFixed(1)}h</p>
                    <p className="text-xs text-gray-600">Total Hours</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{data.avgJobTime.toFixed(1)}h</p>
                    <p className="text-xs text-gray-600">Avg Job Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{data.tech.certifications?.length || 0}</p>
                    <p className="text-xs text-gray-600">Certifications</p>
                  </div>
                </div>

                {/* Upcoming Jobs */}
                {data.upcomingJobs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming Jobs</h4>
                    <div className="space-y-2">
                      {data.upcomingJobs.map((job) => {
                        const customer = browserDatabase.getCustomer(job.customer_id);
                        const vehicle = browserDatabase.getVehicle(job.vehicle_id);

                        return (
                          <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div>
                              <span className="font-medium">#{job.id.slice(-6).toUpperCase()}</span>
                              <span className="text-gray-600 ml-2">
                                {customer?.name} - {vehicle?.year} {vehicle?.make}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {techData.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Technicians</h3>
                <p className="text-gray-500">Add technicians to track capacity and workload</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              💡 Monitor workloads to ensure balanced job distribution and optimal efficiency
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Optimal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Busy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Overloaded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechCapacity;