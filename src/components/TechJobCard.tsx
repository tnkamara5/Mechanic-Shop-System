import React, { useState } from 'react';
import type { WorkOrder, Customer, Vehicle } from '../types/models';

interface TechJobCardProps {
  workOrder: WorkOrder;
  customer: Customer;
  vehicle: Vehicle;
  onStartJob: (workOrderId: string) => void;
  onCompleteJob: (workOrderId: string) => void;
  onRequestEstimate: (workOrderId: string) => void;
}

const TechJobCard: React.FC<TechJobCardProps> = ({
  workOrder,
  customer,
  vehicle,
  onStartJob,
  onCompleteJob,
  onRequestEstimate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'awaiting_approval':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = () => {
    // For now, we'll use a simple priority indicator
    return '⚡'; // Can be expanded to show actual priority levels
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-4">
      {/* Card Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getPriorityIcon()}</span>
              <span className="font-semibold text-gray-900">
                #{workOrder.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workOrder.status)}`}>
              {workOrder.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>{formatDate(workOrder.created_at)}</div>
            {workOrder.mileage && (
              <div>{workOrder.mileage.toLocaleString()} mi</div>
            )}
          </div>
        </div>

        {/* Customer and Vehicle Info */}
        <div className="mt-3">
          <div className="font-medium text-gray-900">{customer.name}</div>
          <div className="text-sm text-gray-600">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {vehicle.license_plate && `License: ${vehicle.license_plate} • `}
            {vehicle.color && `Color: ${vehicle.color}`}
          </div>
        </div>

        {/* Customer Concern (Preview) */}
        {workOrder.customer_concern && (
          <div className="mt-3 p-3 bg-gray-50 rounded">
            <div className="text-sm font-medium text-gray-700">Customer Concern:</div>
            <div className="text-sm text-gray-600 mt-1">
              {isExpanded
                ? workOrder.customer_concern
                : `${workOrder.customer_concern.slice(0, 100)}${workOrder.customer_concern.length > 100 ? '...' : ''}`
              }
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {/* Diagnosis Section */}
          {workOrder.diagnosis && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <div className="text-sm font-medium text-blue-700">Diagnosis:</div>
              <div className="text-sm text-blue-600 mt-1">{workOrder.diagnosis}</div>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="text-sm">
              <div className="font-medium text-gray-700">Phone:</div>
              <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-800">
                {customer.phone}
              </a>
            </div>
            {customer.email && (
              <div className="text-sm">
                <div className="font-medium text-gray-700">Email:</div>
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                  {customer.email}
                </a>
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          {vehicle.vin && (
            <div className="mt-3 text-sm">
              <div className="font-medium text-gray-700">VIN:</div>
              <div className="text-gray-600 font-mono">{vehicle.vin}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {workOrder.status === 'pending' && (
              <button
                onClick={() => onStartJob(workOrder.id)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Job
              </button>
            )}

            {workOrder.status === 'in_progress' && (
              <>
                <button
                  onClick={() => onRequestEstimate(workOrder.id)}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Request Estimate
                </button>
                <button
                  onClick={() => onCompleteJob(workOrder.id)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Mark Complete
                </button>
              </>
            )}

            {workOrder.status === 'approved' && (
              <button
                onClick={() => onCompleteJob(workOrder.id)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Mark Complete
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors">
              📷 Add Photo
            </button>
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors">
              📋 Add Note
            </button>
            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors">
              ⏱️ Log Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechJobCard;