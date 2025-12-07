import React, { useState, useEffect } from 'react';
import PhotoCapture from './PhotoCapture';
import pricingEngine from '../services/pricingEngine';
import type { EstimateLineItem, TechPhoto } from '../types/models';

interface EstimateBuilderProps {
  workOrderId: string;
  onSaveEstimate: (estimate: {
    lineItems: EstimateLineItem[];
    photos: TechPhoto[];
    notes?: string;
  }) => void;
  onCancel: () => void;
}

const EstimateBuilder: React.FC<EstimateBuilderProps> = ({
  workOrderId,
  onSaveEstimate,
  onCancel,
}) => {
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([]);
  const [photos, setPhotos] = useState<TechPhoto[]>([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showPartSearch, setShowPartSearch] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const results = pricingEngine.searchParts(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const addLineItem = (item: EstimateLineItem) => {
    setLineItems([...lineItems, { ...item, id: `${item.type}_${Date.now()}` }]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, updates: Partial<EstimateLineItem>) => {
    setLineItems(lineItems.map(item =>
      item.id === id
        ? { ...item, ...updates, total_price: (updates.quantity || item.quantity) * (updates.unit_price || item.unit_price) }
        : item
    ));
  };

  const addPartFromSearch = (part: any) => {
    const lineItem = pricingEngine.createPartLineItem(part.part_number);
    if (lineItem) {
      addLineItem(lineItem);
      setSearchQuery('');
      setShowPartSearch(false);
    }
  };

  const addQuickService = (serviceType: string) => {
    const template = pricingEngine.getEstimateTemplate(serviceType);
    template.forEach(item => addLineItem(item));
  };

  const addCustomLabor = () => {
    const description = prompt('Enter labor description:');
    const hours = prompt('Enter hours (e.g., 1.5):');
    const category = prompt('Enter category (general, brake, engine, etc.):') || 'general';

    if (description && hours) {
      const laborItem = pricingEngine.createLaborLineItem(description, parseFloat(hours), category);
      addLineItem(laborItem);
    }
  };

  const addCustomPart = () => {
    const description = prompt('Enter part description:');
    const partNumber = prompt('Enter part number:');
    const cost = prompt('Enter cost (without markup):');
    const markup = prompt('Enter markup percentage (default 40):');

    if (description && partNumber && cost) {
      const customPart = pricingEngine.addCustomPart(
        description,
        partNumber,
        parseFloat(cost),
        markup ? parseFloat(markup) : 40
      );
      addLineItem(customPart);
    }
  };

  const handlePhotoTaken = (photoData: { url: string; category: string; caption?: string }) => {
    const newPhoto: TechPhoto = {
      id: `photo_${Date.now()}`,
      work_order_id: workOrderId,
      url: photoData.url,
      caption: photoData.caption,
      category: photoData.category as any,
      taken_at: Date.now(),
      uploaded_at: Date.now(),
    };
    setPhotos([...photos, newPhoto]);
    setShowPhotoCapture(false);
  };

  const removePhoto = (photoId: string) => {
    setPhotos(photos.filter(photo => photo.id !== photoId));
  };

  const totals = pricingEngine.calculateEstimateTotal(lineItems);

  const quickServices = [
    { id: 'oil-change', name: 'Oil Change', icon: '🛢️' },
    { id: 'brake-pads-front', name: 'Front Brake Pads', icon: '🛑' },
    { id: 'brake-pads-rear', name: 'Rear Brake Pads', icon: '🛑' },
    { id: 'diagnostic', name: 'Diagnostic', icon: '🔍' },
    { id: 'tune-up-basic', name: 'Basic Tune-up', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              Build Estimate - #{workOrderId.slice(-6).toUpperCase()}
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onSaveEstimate({ lineItems, photos, notes })}
                disabled={lineItems.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Estimate
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Quick Add</h2>

          {/* Quick Services */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            {quickServices.map((service) => (
              <button
                key={service.id}
                onClick={() => addQuickService(service.id)}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl mb-1">{service.icon}</span>
                <span className="text-xs font-medium text-center">{service.name}</span>
              </button>
            ))}
          </div>

          {/* Add Custom Items */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPartSearch(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <span>🔍</span>
              <span>Search Parts</span>
            </button>
            <button
              onClick={addCustomLabor}
              className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <span>⚙️</span>
              <span>Add Labor</span>
            </button>
            <button
              onClick={addCustomPart}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <span>🔧</span>
              <span>Custom Part</span>
            </button>
            <button
              onClick={() => setShowPhotoCapture(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <span>📷</span>
              <span>Add Photo</span>
            </button>
          </div>
        </div>

        {/* Parts Search Modal */}
        {showPartSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Search Parts</h3>
                  <button
                    onClick={() => setShowPartSearch(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by part name or number..."
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                {searchResults.length === 0 && searchQuery.length > 2 && (
                  <p className="text-gray-500 text-center">No parts found</p>
                )}
                {searchResults.map((part) => (
                  <div
                    key={part.part_number}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => addPartFromSearch(part)}
                  >
                    <div>
                      <div className="font-medium">{part.description}</div>
                      <div className="text-sm text-gray-500">{part.part_number}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${pricingEngine.calculatePartPrice(part.price, part.markup_percentage)}</div>
                      <div className="text-xs text-gray-500">{part.supplier}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Photo Capture Modal */}
        {showPhotoCapture && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Add Photo</h3>
                  <button
                    onClick={() => setShowPhotoCapture(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <PhotoCapture
                workOrderId={workOrderId}
                onPhotoTaken={handlePhotoTaken}
                className="border-0 shadow-none"
              />
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Estimate Items</h2>
          </div>

          {lineItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>No items added yet. Use the quick add buttons above to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {lineItems.map((item, index) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.type === 'labor' ? 'bg-blue-100 text-blue-800' :
                          item.type === 'part' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="mt-1 font-medium">{item.description}</div>
                      {item.part_number && (
                        <div className="text-sm text-gray-500">Part #: {item.part_number}</div>
                      )}
                      {item.notes && (
                        <div className="text-sm text-gray-500">{item.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                            min="0.1"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-500">×</span>
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="text-sm font-medium text-right mt-1">
                          ${item.total_price.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Photos ({photos.length})</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Work photo'}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <div className="absolute top-1 right-1">
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="bg-red-500 text-white text-xs px-1 py-0.5 rounded hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1">
                      <span className="bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                        {photo.category}
                      </span>
                    </div>
                    {photo.caption && (
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Notes</h2>
          </div>
          <div className="p-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about the estimate..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        </div>

        {/* Totals */}
        {lineItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Estimate Total</h2>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Labor:</span>
                  <span>${totals.laborTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Parts:</span>
                  <span>${totals.partsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Services:</span>
                  <span>${totals.servicesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimateBuilder;