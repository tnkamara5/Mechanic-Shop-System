import React, { useEffect, useState } from 'react';
import BrowserDatabaseService from '../services/browserDatabase';
import OwnerSettings from './OwnerSettings';
import type { CheckIn, WorkOrder, Customer, Vehicle } from '../types/models';

const OwnerDashboard: React.FC = () => {
  const [pendingCheckIns, setPendingCheckIns] = useState<CheckIn[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<{ [id: string]: Customer }>({});
  const [vehicles, setVehicles] = useState<{ [id: string]: Vehicle }>({});
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const checkIns = BrowserDatabaseService.getPendingCheckIns();
    const orders = BrowserDatabaseService.getWorkOrders();

    setPendingCheckIns(checkIns);
    setWorkOrders(orders);

    // Load customer and vehicle data
    const customerMap: { [id: string]: Customer } = {};
    const vehicleMap: { [id: string]: Vehicle } = {};

    [...checkIns, ...orders].forEach(item => {
      if (item.customer_id && !customerMap[item.customer_id]) {
        const customer = BrowserDatabaseService.getCustomer(item.customer_id);
        if (customer) customerMap[item.customer_id] = customer;
      }
      if (item.vehicle_id && !vehicleMap[item.vehicle_id]) {
        const vehicle = BrowserDatabaseService.getVehicle(item.vehicle_id);
        if (vehicle) vehicleMap[item.vehicle_id] = vehicle;
      }
    });

    setCustomers(customerMap);
    setVehicles(vehicleMap);
  };

  const createWorkOrderFromCheckIn = (checkInId: string) => {
    try {
      BrowserDatabaseService.createWorkOrderFromCheckIn(checkInId);
      loadData(); // Refresh data
      alert('Work order created successfully!');
    } catch (error) {
      console.error('Failed to create work order:', error);
      alert('Failed to create work order. Please try again.');
    }
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatVehicle = (vehicle: Vehicle) => {
    const parts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean);
    return parts.join(' ') || 'Unknown Vehicle';
  };

  return (
    <div className="min-h-screen bg-shop-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-shop-900">Owner Dashboard</h1>
              <p className="text-shop-600 mt-2">Manage customer check-ins and work orders</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700 font-medium">Settings</span>
              </button>
              <button
                onClick={loadData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Check-ins */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-shop-900">
                Pending Check-ins
              </h2>
              <span className="bg-warning-100 text-warning-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingCheckIns.length} pending
              </span>
            </div>

            {pendingCheckIns.length === 0 ? (
              <p className="text-shop-500 text-center py-8">No pending check-ins</p>
            ) : (
              <div className="space-y-4">
                {pendingCheckIns.map(checkIn => {
                  const customer = customers[checkIn.customer_id!];
                  const vehicle = vehicles[checkIn.vehicle_id!];

                  return (
                    <div key={checkIn.id} className="border border-shop-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-shop-900">
                              {customer?.name || 'Unknown Customer'}
                            </h3>
                            <span className="text-sm text-shop-500">
                              {formatDateTime(checkIn.checked_in_at)}
                            </span>
                          </div>

                          <div className="text-sm text-shop-600 mb-3">
                            <p>📞 {customer?.phone}</p>
                            {customer?.email && <p>✉️ {customer.email}</p>}
                            <p>🚗 {vehicle ? formatVehicle(vehicle) : 'Unknown Vehicle'}</p>
                            {vehicle?.license_plate && (
                              <p>🏷️ {vehicle.license_plate}</p>
                            )}
                            {checkIn.mileage && <p>📏 {checkIn.mileage.toLocaleString()} miles</p>}
                          </div>

                          {checkIn.customer_concern && (
                            <div className="bg-shop-50 p-3 rounded border-l-4 border-warning-400">
                              <p className="text-sm font-medium text-shop-700 mb-1">Customer Concern:</p>
                              <p className="text-sm text-shop-600">{checkIn.customer_concern}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-shop-200">
                        <button
                          onClick={() => createWorkOrderFromCheckIn(checkIn.id)}
                          className="btn-primary text-sm"
                        >
                          Create Work Order
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Work Orders */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-shop-900">
                Recent Work Orders
              </h2>
              <span className="bg-shop-100 text-shop-800 px-3 py-1 rounded-full text-sm font-medium">
                {workOrders.length} total
              </span>
            </div>

            {workOrders.length === 0 ? (
              <p className="text-shop-500 text-center py-8">No work orders yet</p>
            ) : (
              <div className="space-y-4">
                {workOrders.slice(0, 10).map(workOrder => {
                  const customer = customers[workOrder.customer_id];
                  const vehicle = vehicles[workOrder.vehicle_id];

                  const getStatusBadge = (status: string) => {
                    const styles = {
                      pending: 'bg-warning-100 text-warning-800',
                      in_progress: 'bg-blue-100 text-blue-800',
                      awaiting_approval: 'bg-yellow-100 text-yellow-800',
                      approved: 'bg-green-100 text-green-800',
                      completed: 'bg-success-100 text-success-800',
                      cancelled: 'bg-danger-100 text-danger-800'
                    };

                    return (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                        {status.replace('_', ' ')}
                      </span>
                    );
                  };

                  return (
                    <div key={workOrder.id} className="border border-shop-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-shop-900">
                            {customer?.name || 'Unknown Customer'}
                          </h3>
                          {getStatusBadge(workOrder.status)}
                        </div>
                        <span className="text-sm text-shop-500">
                          {formatDateTime(workOrder.created_at)}
                        </span>
                      </div>

                      <div className="text-sm text-shop-600 mb-2">
                        <p>🚗 {vehicle ? formatVehicle(vehicle) : 'Unknown Vehicle'}</p>
                        {workOrder.assigned_tech && <p>👨‍🔧 {workOrder.assigned_tech}</p>}
                        {workOrder.mileage && <p>📏 {workOrder.mileage.toLocaleString()} miles</p>}
                      </div>

                      {workOrder.customer_concern && (
                        <div className="text-sm text-shop-600">
                          <p className="font-medium">Concern:</p>
                          <p className="truncate">{workOrder.customer_concern}</p>
                        </div>
                      )}

                      {workOrder.diagnosis && (
                        <div className="text-sm text-shop-600 mt-2">
                          <p className="font-medium">Diagnosis:</p>
                          <p className="truncate">{workOrder.diagnosis}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border border-shop-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-warning-100">
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-shop-600">Pending Check-ins</p>
                <p className="text-2xl font-bold text-shop-900">{pendingCheckIns.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-shop-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <span className="text-2xl">🔧</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-shop-600">Active Work Orders</p>
                <p className="text-2xl font-bold text-shop-900">
                  {workOrders.filter(wo => ['pending', 'in_progress', 'awaiting_approval'].includes(wo.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-shop-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-success-100">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-shop-600">Completed Today</p>
                <p className="text-2xl font-bold text-shop-900">
                  {workOrders.filter(wo =>
                    wo.status === 'completed' &&
                    wo.completed_at &&
                    new Date(wo.completed_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-shop-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-shop-100">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-shop-600">Total Customers</p>
                <p className="text-2xl font-bold text-shop-900">{Object.keys(customers).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <OwnerSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default OwnerDashboard;