import React, { useState, useEffect } from 'react';
import TechJobCard from './TechJobCard';
import browserDatabase from '../services/browserDatabase';
import type { WorkOrder, Customer, Vehicle } from '../types/models';

interface TechJobWithDetails {
  workOrder: WorkOrder;
  customer: Customer;
  vehicle: Vehicle;
}

const TechDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<TechJobWithDetails[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'all'>('assigned');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // For MVP, we'll use a hardcoded tech ID
  const currentTechId = 'tech-001';

  useEffect(() => {
    loadJobs();
  }, [activeTab, statusFilter]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const workOrders = browserDatabase.getWorkOrders();
      const jobsWithDetails: TechJobWithDetails[] = [];

      for (const workOrder of workOrders) {
        // Filter by assignment (for MVP, all jobs are available to all techs)
        if (activeTab === 'assigned' && workOrder.assigned_tech && workOrder.assigned_tech !== currentTechId) {
          continue;
        }

        // Filter by status
        if (statusFilter !== 'all' && workOrder.status !== statusFilter) {
          continue;
        }

        const customer = browserDatabase.getCustomer(workOrder.customer_id);
        const vehicle = browserDatabase.getVehicle(workOrder.vehicle_id);

        if (customer && vehicle) {
          jobsWithDetails.push({ workOrder, customer, vehicle });
        }
      }

      setJobs(jobsWithDetails);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartJob = (workOrderId: string) => {
    try {
      // Update work order status to in_progress
      const data = browserDatabase.exportData();
      const workOrder = data.work_orders.find(wo => wo.id === workOrderId);

      if (workOrder) {
        workOrder.status = 'in_progress';
        workOrder.assigned_tech = currentTechId;
        workOrder.started_at = Date.now();
        workOrder.updated_at = Date.now();

        browserDatabase.clearData();
        localStorage.setItem('shop_database', JSON.stringify(data));

        loadJobs();
      }
    } catch (error) {
      console.error('Failed to start job:', error);
    }
  };

  const handleCompleteJob = (workOrderId: string) => {
    try {
      const data = browserDatabase.exportData();
      const workOrder = data.work_orders.find(wo => wo.id === workOrderId);

      if (workOrder) {
        workOrder.status = 'completed';
        workOrder.completed_at = Date.now();
        workOrder.updated_at = Date.now();

        browserDatabase.clearData();
        localStorage.setItem('shop_database', JSON.stringify(data));

        loadJobs();
      }
    } catch (error) {
      console.error('Failed to complete job:', error);
    }
  };

  const handleRequestEstimate = (workOrderId: string) => {
    try {
      const data = browserDatabase.exportData();
      const workOrder = data.work_orders.find(wo => wo.id === workOrderId);

      if (workOrder) {
        workOrder.status = 'awaiting_approval';
        workOrder.updated_at = Date.now();

        browserDatabase.clearData();
        localStorage.setItem('shop_database', JSON.stringify(data));

        loadJobs();
      }
    } catch (error) {
      console.error('Failed to request estimate:', error);
    }
  };

  const getJobStats = () => {
    const total = jobs.length;
    const pending = jobs.filter(job => job.workOrder.status === 'pending').length;
    const inProgress = jobs.filter(job => job.workOrder.status === 'in_progress').length;
    const awaitingApproval = jobs.filter(job => job.workOrder.status === 'awaiting_approval').length;

    return { total, pending, inProgress, awaitingApproval };
  };

  const stats = getJobStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Tech Dashboard</h1>
            <div className="text-sm text-gray-500">
              Welcome back, Tech #{currentTechId.slice(-3)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Jobs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{stats.awaitingApproval}</div>
            <div className="text-sm text-gray-500">Need Approval</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Tab Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('assigned')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'assigned'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Jobs
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Jobs
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="text-gray-400 text-4xl mb-4">🔧</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500">
                {activeTab === 'assigned'
                  ? "You don't have any assigned jobs at the moment."
                  : "No work orders match your current filters."}
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <TechJobCard
                key={job.workOrder.id}
                workOrder={job.workOrder}
                customer={job.customer}
                vehicle={job.vehicle}
                onStartJob={handleStartJob}
                onCompleteJob={handleCompleteJob}
                onRequestEstimate={handleRequestEstimate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TechDashboard;