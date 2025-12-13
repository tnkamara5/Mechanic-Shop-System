import React, { useState, useEffect } from 'react';
import browserDatabase from '../services/browserDatabase';
import type { WorkOrder, Customer, Vehicle, TechProfile } from '../types/models';

interface WorkOrderWithDetails extends WorkOrder {
  customer: Customer;
  vehicle: Vehicle;
}

interface AssignmentBoardProps {
  onClose: () => void;
}

const AssignmentBoard: React.FC<AssignmentBoardProps> = ({ onClose }) => {
  const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [techs, setTechs] = useState<TechProfile[]>([]);
  const [unassignedJobs, setUnassignedJobs] = useState<WorkOrderWithDetails[]>([]);
  const [assignedJobs, setAssignedJobs] = useState<{ [techId: string]: WorkOrderWithDetails[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [draggedJob, setDraggedJob] = useState<WorkOrderWithDetails | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all work orders
      const orders = browserDatabase.getWorkOrders();
      const techProfiles = browserDatabase.getAllTechProfiles();

      // Get details for each work order
      const ordersWithDetails: WorkOrderWithDetails[] = [];
      for (const order of orders) {
        if (order.status === 'completed' || order.status === 'cancelled') continue;

        const customer = browserDatabase.getCustomer(order.customer_id);
        const vehicle = browserDatabase.getVehicle(order.vehicle_id);

        if (customer && vehicle) {
          ordersWithDetails.push({ ...order, customer, vehicle });
        }
      }

      // Separate unassigned and assigned jobs
      const unassigned = ordersWithDetails.filter(order => !order.assigned_tech);
      const assigned: { [techId: string]: WorkOrderWithDetails[] } = {};

      techProfiles.forEach(tech => {
        assigned[tech.id] = ordersWithDetails.filter(order => order.assigned_tech === tech.id);
      });

      setWorkOrders(ordersWithDetails);
      setTechs(techProfiles);
      setUnassignedJobs(unassigned);
      setAssignedJobs(assigned);
    } catch (error) {
      console.error('Failed to load assignment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, job: WorkOrderWithDetails) => {
    setDraggedJob(job);
    e.dataTransfer.setData('text/plain', job.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTech = async (e: React.DragEvent, techId: string) => {
    e.preventDefault();

    if (!draggedJob) return;

    try {
      await browserDatabase.assignTechToWorkOrder(draggedJob.id, techId);
      loadData();
      setDraggedJob(null);
    } catch (error) {
      console.error('Failed to assign job:', error);
      alert('Failed to assign job. Please try again.');
    }
  };

  const handleDropOnUnassigned = async (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedJob || !draggedJob.assigned_tech) return;

    try {
      await browserDatabase.unassignTechFromWorkOrder(draggedJob.id);
      loadData();
      setDraggedJob(null);
    } catch (error) {
      console.error('Failed to unassign job:', error);
      alert('Failed to unassign job. Please try again.');
    }
  };

  const handleAssignJob = async (jobId: string, techId: string) => {
    try {
      await browserDatabase.assignTechToWorkOrder(jobId, techId);
      loadData();
    } catch (error) {
      console.error('Failed to assign job:', error);
      alert('Failed to assign job. Please try again.');
    }
  };

  const getSuggestedTechs = (job: WorkOrderWithDetails): TechProfile[] => {
    return browserDatabase.suggestTechForWorkOrder(job.id).slice(0, 3);
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      awaiting_approval: 'bg-orange-100 text-orange-800 border-orange-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityIcon = (workOrder: WorkOrderWithDetails): string => {
    // Simple priority logic based on creation time and customer concern keywords
    const urgent = workOrder.customer_concern?.toLowerCase().includes('urgent') ||
                  workOrder.customer_concern?.toLowerCase().includes('emergency');
    const brake = workOrder.customer_concern?.toLowerCase().includes('brake');

    if (urgent) return '🚨';
    if (brake) return '⚠️';
    return '📋';
  };

  const getTechWorkload = (techId: string): { jobs: number; capacity: string } => {
    const jobs = assignedJobs[techId]?.length || 0;
    let capacity = 'available';

    if (jobs >= 4) capacity = 'overloaded';
    else if (jobs >= 2) capacity = 'busy';

    return { jobs, capacity };
  };

  const getCapacityColor = (capacity: string): string => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      overloaded: 'bg-red-100 text-red-800',
    };
    return colors[capacity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assignment board...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Job Assignment Board</h2>
              <p className="text-gray-600">Drag and drop work orders to assign them to technicians</p>
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

        {/* Assignment Board */}
        <div className="flex-1 overflow-hidden flex">
          {/* Unassigned Jobs Column */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-900 flex items-center">
                <span className="mr-2">📋</span>
                Unassigned Jobs ({unassignedJobs.length})
              </h3>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
              onDragOver={handleDragOver}
              onDrop={handleDropOnUnassigned}
            >
              {unassignedJobs.map((job) => {
                const suggestedTechs = getSuggestedTechs(job);

                return (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job)}
                    className="bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getPriorityIcon(job)}</span>
                        <span className="font-medium text-gray-900">
                          #{job.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{job.customer.name}</div>
                      <div className="text-gray-600">
                        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                      </div>
                      {job.customer_concern && (
                        <div className="text-gray-500 text-xs truncate">
                          {job.customer_concern}
                        </div>
                      )}
                    </div>

                    {/* Suggested Techs */}
                    {suggestedTechs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">Suggested:</div>
                        <div className="flex flex-wrap gap-1">
                          {suggestedTechs.map((tech) => (
                            <button
                              key={tech.id}
                              onClick={() => handleAssignJob(job.id, tech.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              {tech.name.split(' ').map(n => n[0]).join('')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {unassignedJobs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p>All jobs are assigned!</p>
                </div>
              )}
            </div>
          </div>

          {/* Technician Columns */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex h-full">
              {techs.map((tech) => {
                const workload = getTechWorkload(tech.id);
                const jobs = assignedJobs[tech.id] || [];

                return (
                  <div key={tech.id} className="w-80 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{tech.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCapacityColor(workload.capacity)}`}>
                              {workload.capacity}
                            </span>
                            <span className="text-xs text-gray-500">
                              {workload.jobs} job{workload.jobs !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div>${tech.hourly_rate}/hr</div>
                          {tech.specialties && (
                            <div>{tech.specialties.slice(0, 2).join(', ')}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex-1 overflow-y-auto p-4 space-y-3 min-h-32"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnTech(e, tech.id)}
                    >
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, job)}
                          className="bg-white border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{getPriorityIcon(job)}</span>
                              <span className="text-sm font-medium text-gray-900">
                                #{job.id.slice(-6).toUpperCase()}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                              {job.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="font-medium">{job.customer.name}</div>
                            <div className="text-gray-600 text-xs">
                              {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                            </div>
                            {job.customer_concern && (
                              <div className="text-gray-500 text-xs truncate">
                                {job.customer_concern}
                              </div>
                            )}
                            {job.mileage && (
                              <div className="text-gray-500 text-xs">
                                📏 {job.mileage.toLocaleString()} mi
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {jobs.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-3xl mb-2">👤</div>
                          <p className="text-sm">No assigned jobs</p>
                          <p className="text-xs">Drop jobs here</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {techs.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-medium mb-2">No Technicians</h3>
                    <p className="text-sm">Add technicians to start assigning jobs</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              💡 Drag and drop jobs between columns to assign or reassign work
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                <span>Busy</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 rounded"></div>
                <span>Overloaded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentBoard;