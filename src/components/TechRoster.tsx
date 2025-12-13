import React, { useState, useEffect } from 'react';
import browserDatabase from '../services/browserDatabase';
import type { TechProfile } from '../types/models';

interface TechRosterProps {
  onClose: () => void;
}

const TechRoster: React.FC<TechRosterProps> = ({ onClose }) => {
  const [techs, setTechs] = useState<TechProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTech, setEditingTech] = useState<TechProfile | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadTechs();
  }, []);

  const loadTechs = async () => {
    setIsLoading(true);
    try {
      const allTechs = browserDatabase.getAllTechProfiles();
      setTechs(allTechs);
    } catch (error) {
      console.error('Failed to load techs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTech = () => {
    setEditingTech({
      id: '',
      name: '',
      employee_id: '',
      certifications: [],
      specialties: [],
      hourly_rate: 40.00,
      active: true,
      created_at: 0,
      updated_at: 0,
    });
    setShowAddForm(true);
  };

  const handleEditTech = (tech: TechProfile) => {
    setEditingTech({ ...tech });
    setShowAddForm(true);
  };

  const handleSaveTech = async () => {
    if (!editingTech) return;

    try {
      if (editingTech.id && editingTech.created_at > 0) {
        // Update existing tech
        await browserDatabase.updateTechProfile(editingTech.id, {
          name: editingTech.name,
          employee_id: editingTech.employee_id,
          certifications: editingTech.certifications,
          specialties: editingTech.specialties,
          hourly_rate: editingTech.hourly_rate,
          active: editingTech.active,
        });
      } else {
        // Create new tech
        await browserDatabase.createTechProfile({
          name: editingTech.name,
          employee_id: editingTech.employee_id,
          certifications: editingTech.certifications || [],
          specialties: editingTech.specialties || [],
          hourly_rate: editingTech.hourly_rate,
          active: editingTech.active,
        });
      }

      setShowAddForm(false);
      setEditingTech(null);
      loadTechs();
    } catch (error) {
      console.error('Failed to save tech:', error);
      alert('Failed to save technician. Please try again.');
    }
  };

  const handleDeleteTech = async (techId: string, techName: string) => {
    if (!confirm(`Are you sure you want to delete ${techName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await browserDatabase.deleteTechProfile(techId);
      loadTechs();
    } catch (error) {
      console.error('Failed to delete tech:', error);
      alert('Failed to delete technician. Please try again.');
    }
  };

  const handleToggleActive = async (techId: string, currentActive: boolean) => {
    try {
      await browserDatabase.updateTechProfile(techId, { active: !currentActive });
      loadTechs();
    } catch (error) {
      console.error('Failed to update tech status:', error);
    }
  };

  const getSpecialtyIcon = (specialty: string): string => {
    const icons: Record<string, string> = {
      brake: '🛑',
      engine: '🚗',
      electrical: '⚡',
      transmission: '⚙️',
      suspension: '🔧',
      diagnostic: '🔍',
      general: '🛠️',
      tire: '🛞',
      ac: '❄️',
    };
    return icons[specialty] || '🔧';
  };

  const availableSpecialties = [
    { value: 'brake', label: 'Brake Systems', icon: '🛑' },
    { value: 'engine', label: 'Engine Work', icon: '🚗' },
    { value: 'electrical', label: 'Electrical', icon: '⚡' },
    { value: 'transmission', label: 'Transmission', icon: '⚙️' },
    { value: 'suspension', label: 'Suspension', icon: '🔧' },
    { value: 'diagnostic', label: 'Diagnostics', icon: '🔍' },
    { value: 'general', label: 'General Repair', icon: '🛠️' },
    { value: 'tire', label: 'Tires & Alignment', icon: '🛞' },
    { value: 'ac', label: 'Air Conditioning', icon: '❄️' },
  ];

  const availableCertifications = [
    'ASE A1 (Engine Repair)',
    'ASE A2 (Automatic Transmission)',
    'ASE A3 (Manual Drive Train)',
    'ASE A4 (Suspension & Steering)',
    'ASE A5 (Brakes)',
    'ASE A6 (Electrical/Electronic)',
    'ASE A7 (Heating & AC)',
    'ASE A8 (Engine Performance)',
    'ASE L1 (Advanced Engine Performance)',
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading technicians...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tech Roster Management</h2>
              <p className="text-gray-600">Manage your technician team and their specializations</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddTech}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Technician</span>
              </button>
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

        {/* Tech List */}
        <div className="flex-1 overflow-y-auto p-6">
          {techs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Technicians</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first technician</p>
              <button
                onClick={handleAddTech}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Technician
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {techs.map((tech) => (
                <div
                  key={tech.id}
                  className={`bg-white border rounded-lg p-6 transition-all hover:shadow-md ${
                    tech.active ? 'border-gray-200' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {tech.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                        {tech.employee_id && (
                          <p className="text-sm text-gray-500">ID: {tech.employee_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(tech.id, tech.active)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tech.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tech.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Hourly Rate */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hourly Rate:</span>
                      <span className="font-medium">${tech.hourly_rate?.toFixed(2) || 'N/A'}</span>
                    </div>

                    {/* Specialties */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Specialties:</div>
                      <div className="flex flex-wrap gap-1">
                        {tech.specialties?.length ? (
                          tech.specialties.map((specialty) => (
                            <span
                              key={specialty}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            >
                              <span>{getSpecialtyIcon(specialty)}</span>
                              <span>{specialty}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No specialties set</span>
                        )}
                      </div>
                    </div>

                    {/* Certifications */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Certifications:</div>
                      <div className="text-xs text-gray-500">
                        {tech.certifications?.length ? (
                          tech.certifications.slice(0, 2).map((cert, index) => (
                            <div key={index}>{cert}</div>
                          ))
                        ) : (
                          'No certifications listed'
                        )}
                        {tech.certifications && tech.certifications.length > 2 && (
                          <div>+{tech.certifications.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleEditTech(tech)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTech(tech.id, tech.name)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && editingTech && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingTech.created_at > 0 ? 'Edit Technician' : 'Add New Technician'}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editingTech.name}
                      onChange={(e) => setEditingTech({ ...editingTech, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={editingTech.employee_id || ''}
                      onChange={(e) => setEditingTech({ ...editingTech, employee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="EMP001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={editingTech.hourly_rate || 0}
                      onChange={(e) => setEditingTech({ ...editingTech, hourly_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingTech.active}
                        onChange={(e) => setEditingTech({ ...editingTech, active: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active Employee</span>
                    </label>
                  </div>
                </div>

                {/* Specialties */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Specialties
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSpecialties.map((specialty) => (
                      <label key={specialty.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingTech.specialties?.includes(specialty.value) || false}
                          onChange={(e) => {
                            const specialties = editingTech.specialties || [];
                            if (e.target.checked) {
                              setEditingTech({
                                ...editingTech,
                                specialties: [...specialties, specialty.value]
                              });
                            } else {
                              setEditingTech({
                                ...editingTech,
                                specialties: specialties.filter(s => s !== specialty.value)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{specialty.icon} {specialty.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    ASE Certifications
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableCertifications.map((cert) => (
                      <label key={cert} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingTech.certifications?.includes(cert) || false}
                          onChange={(e) => {
                            const certifications = editingTech.certifications || [];
                            if (e.target.checked) {
                              setEditingTech({
                                ...editingTech,
                                certifications: [...certifications, cert]
                              });
                            } else {
                              setEditingTech({
                                ...editingTech,
                                certifications: certifications.filter(c => c !== cert)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{cert}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingTech(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTech}
                disabled={!editingTech.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingTech.created_at > 0 ? 'Update' : 'Create'} Technician
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechRoster;