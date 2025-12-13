import { v4 as uuidv4 } from 'uuid';
import type {
  Customer,
  Vehicle,
  WorkOrder,
  LineItem,
  CheckIn,
  CommonService,
  CustomerCheckInForm,
  TechProfile,
  TimeEntry,
} from '../types/models';

// Simple browser-based database using localStorage
// This is a temporary solution for the MVP - can be replaced with IndexedDB or sql.js later

interface StorageData {
  customers: Customer[];
  vehicles: Vehicle[];
  work_orders: WorkOrder[];
  line_items: LineItem[];
  check_ins: CheckIn[];
  common_services: CommonService[];
  tech_profiles: TechProfile[];
  time_entries: TimeEntry[];
}

class BrowserDatabaseService {
  private storageKey = 'shop_database';

  private getStorageData(): StorageData {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }

    // Initialize with default data
    const initialData: StorageData = {
      customers: [],
      vehicles: [],
      work_orders: [],
      line_items: [],
      check_ins: [],
      tech_profiles: [
        {
          id: 'tech-001',
          name: 'Mike Johnson',
          employee_id: 'EMP001',
          certifications: ['ASE A1', 'ASE A5', 'ASE A8'],
          specialties: ['brake', 'suspension', 'general'],
          hourly_rate: 45.00,
          active: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'tech-002',
          name: 'Sarah Chen',
          employee_id: 'EMP002',
          certifications: ['ASE A6', 'ASE A7', 'ASE L1'],
          specialties: ['electrical', 'engine', 'diagnostic'],
          hourly_rate: 50.00,
          active: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'tech-003',
          name: 'Carlos Rodriguez',
          employee_id: 'EMP003',
          certifications: ['ASE A2', 'ASE A3'],
          specialties: ['transmission', 'engine', 'general'],
          hourly_rate: 42.00,
          active: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
      ],
      time_entries: [],
      common_services: [
        {
          id: 'oil-change',
          name: 'Oil Change',
          description: 'Engine oil and filter replacement',
          category: 'maintenance',
          base_price: 49.99,
          labor_hours: 0.5,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'brake-inspection',
          name: 'Brake Inspection',
          description: 'Complete brake system inspection',
          category: 'inspection',
          base_price: 39.99,
          labor_hours: 0.75,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'tire-rotation',
          name: 'Tire Rotation',
          description: 'Rotate tires for even wear',
          category: 'maintenance',
          base_price: 29.99,
          labor_hours: 0.5,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'brake-pads',
          name: 'Brake Pad Replacement',
          description: 'Replace front or rear brake pads',
          category: 'repair',
          base_price: 189.99,
          labor_hours: 1.5,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        {
          id: 'alignment',
          name: 'Wheel Alignment',
          description: '4-wheel alignment service',
          category: 'maintenance',
          base_price: 89.99,
          labor_hours: 1.0,
          created_at: Date.now(),
          updated_at: Date.now(),
        }
      ]
    };

    this.saveStorageData(initialData);
    return initialData;
  }

  private saveStorageData(data: StorageData): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Customer operations
  createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer {
    const data = this.getStorageData();
    const now = Date.now();

    const customer: Customer = {
      id: uuidv4(),
      ...customerData,
      created_at: now,
      updated_at: now,
    };

    data.customers.push(customer);
    this.saveStorageData(data);
    return customer;
  }

  findCustomerByPhone(phone: string): Customer | null {
    const data = this.getStorageData();
    return data.customers.find(c => c.phone === phone) || null;
  }

  // Vehicle operations
  createVehicle(vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Vehicle {
    const data = this.getStorageData();
    const now = Date.now();

    const vehicle: Vehicle = {
      id: uuidv4(),
      ...vehicleData,
      created_at: now,
      updated_at: now,
    };

    data.vehicles.push(vehicle);
    this.saveStorageData(data);
    return vehicle;
  }

  findVehicleByVin(vin: string): Vehicle | null {
    const data = this.getStorageData();
    return data.vehicles.find(v => v.vin === vin) || null;
  }

  // Check-in operations
  createCheckIn(checkInData: Omit<CheckIn, 'id' | 'created_at'>): CheckIn {
    const data = this.getStorageData();
    const now = Date.now();

    const checkIn: CheckIn = {
      id: uuidv4(),
      ...checkInData,
      created_at: now,
    };

    data.check_ins.push(checkIn);
    this.saveStorageData(data);
    return checkIn;
  }

  // Process customer check-in form
  processCustomerCheckIn(formData: CustomerCheckInForm): CheckIn {
    // Find or create customer
    let customer = this.findCustomerByPhone(formData.customer.phone);
    if (!customer) {
      customer = this.createCustomer(formData.customer);
    }

    // Find or create vehicle
    let vehicle: Vehicle | null = null;
    if (formData.vehicle.vin) {
      vehicle = this.findVehicleByVin(formData.vehicle.vin);
    }

    if (!vehicle) {
      vehicle = this.createVehicle({
        customer_id: customer.id,
        ...formData.vehicle,
      });
    }

    // Create check-in record
    const checkIn = this.createCheckIn({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      status: 'pending',
      customer_concern: formData.service.customer_concern,
      mileage: formData.service.mileage,
      appointment_date: formData.service.appointment_date ?
        new Date(formData.service.appointment_date).getTime() : undefined,
      checked_in_at: Date.now(),
    });

    return checkIn;
  }

  // Work order operations
  createWorkOrder(workOrderData: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>): WorkOrder {
    const data = this.getStorageData();
    const now = Date.now();

    const workOrder: WorkOrder = {
      id: uuidv4(),
      ...workOrderData,
      created_at: now,
      updated_at: now,
    };

    data.work_orders.push(workOrder);
    this.saveStorageData(data);
    return workOrder;
  }

  createWorkOrderFromCheckIn(checkInId: string): WorkOrder {
    const data = this.getStorageData();

    // Get check-in data
    const checkIn = data.check_ins.find(ci => ci.id === checkInId);
    if (!checkIn) {
      throw new Error('Check-in not found');
    }

    // Create work order and update check-in in the same transaction
    const now = Date.now();
    const workOrder: WorkOrder = {
      id: uuidv4(),
      vehicle_id: checkIn.vehicle_id!,
      customer_id: checkIn.customer_id!,
      status: 'pending',
      mileage: checkIn.mileage,
      customer_concern: checkIn.customer_concern,
      created_at: now,
      updated_at: now,
    };

    // Add work order to data
    data.work_orders.push(workOrder);

    // Update check-in status
    checkIn.status = 'work_order_created';

    // Save everything at once
    this.saveStorageData(data);

    return workOrder;
  }

  getPendingCheckIns(): CheckIn[] {
    const data = this.getStorageData();
    return data.check_ins.filter(ci => ci.status === 'pending').sort((a, b) => a.checked_in_at - b.checked_in_at);
  }

  getWorkOrders(): WorkOrder[] {
    const data = this.getStorageData();
    return data.work_orders.sort((a, b) => b.created_at - a.created_at);
  }

  // Common services
  getCommonServices(): CommonService[] {
    const data = this.getStorageData();
    return data.common_services.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get customer and vehicle details for display
  getCustomer(customerId: string): Customer | null {
    const data = this.getStorageData();
    return data.customers.find(c => c.id === customerId) || null;
  }

  getVehicle(vehicleId: string): Vehicle | null {
    const data = this.getStorageData();
    return data.vehicles.find(v => v.id === vehicleId) || null;
  }

  // Tech Profile operations
  createTechProfile(techData: Omit<TechProfile, 'id' | 'created_at' | 'updated_at'>): TechProfile {
    const data = this.getStorageData();
    const now = Date.now();

    const tech: TechProfile = {
      id: uuidv4(),
      ...techData,
      created_at: now,
      updated_at: now,
    };

    data.tech_profiles.push(tech);
    this.saveStorageData(data);
    return tech;
  }

  updateTechProfile(techId: string, updates: Partial<TechProfile>): TechProfile | null {
    const data = this.getStorageData();
    const techIndex = data.tech_profiles.findIndex(t => t.id === techId);

    if (techIndex === -1) return null;

    data.tech_profiles[techIndex] = {
      ...data.tech_profiles[techIndex],
      ...updates,
      updated_at: Date.now(),
    };

    this.saveStorageData(data);
    return data.tech_profiles[techIndex];
  }

  deleteTechProfile(techId: string): boolean {
    const data = this.getStorageData();
    const initialLength = data.tech_profiles.length;

    data.tech_profiles = data.tech_profiles.filter(t => t.id !== techId);

    if (data.tech_profiles.length < initialLength) {
      this.saveStorageData(data);
      return true;
    }

    return false;
  }

  getAllTechProfiles(): TechProfile[] {
    const data = this.getStorageData();
    return data.tech_profiles.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name));
  }

  getTechProfile(techId: string): TechProfile | null {
    const data = this.getStorageData();
    return data.tech_profiles.find(t => t.id === techId) || null;
  }

  getTechsBySpecialty(specialty: string): TechProfile[] {
    const data = this.getStorageData();
    return data.tech_profiles.filter(t =>
      t.active && t.specialties && t.specialties.includes(specialty)
    ).sort((a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0)); // Sort by rate desc
  }

  // Work Order Assignment
  assignTechToWorkOrder(workOrderId: string, techId: string): WorkOrder | null {
    const data = this.getStorageData();
    const workOrderIndex = data.work_orders.findIndex(wo => wo.id === workOrderId);

    if (workOrderIndex === -1) return null;

    // Verify tech exists
    const tech = data.tech_profiles.find(t => t.id === techId);
    if (!tech || !tech.active) return null;

    data.work_orders[workOrderIndex] = {
      ...data.work_orders[workOrderIndex],
      assigned_tech: techId,
      updated_at: Date.now(),
    };

    this.saveStorageData(data);
    return data.work_orders[workOrderIndex];
  }

  unassignTechFromWorkOrder(workOrderId: string): WorkOrder | null {
    const data = this.getStorageData();
    const workOrderIndex = data.work_orders.findIndex(wo => wo.id === workOrderId);

    if (workOrderIndex === -1) return null;

    data.work_orders[workOrderIndex] = {
      ...data.work_orders[workOrderIndex],
      assigned_tech: undefined,
      updated_at: Date.now(),
    };

    this.saveStorageData(data);
    return data.work_orders[workOrderIndex];
  }

  getWorkOrdersForTech(techId: string, status?: string): WorkOrder[] {
    const data = this.getStorageData();
    return data.work_orders.filter(wo =>
      wo.assigned_tech === techId &&
      (!status || wo.status === status)
    ).sort((a, b) => b.created_at - a.created_at);
  }

  getUnassignedWorkOrders(): WorkOrder[] {
    const data = this.getStorageData();
    return data.work_orders.filter(wo =>
      !wo.assigned_tech &&
      wo.status !== 'completed' &&
      wo.status !== 'cancelled'
    ).sort((a, b) => b.created_at - a.created_at);
  }

  // Time Entry operations
  createTimeEntry(timeData: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>): TimeEntry {
    const data = this.getStorageData();
    const now = Date.now();

    const timeEntry: TimeEntry = {
      id: uuidv4(),
      ...timeData,
      created_at: now,
      updated_at: now,
    };

    data.time_entries.push(timeEntry);
    this.saveStorageData(data);
    return timeEntry;
  }

  updateTimeEntry(entryId: string, updates: Partial<TimeEntry>): TimeEntry | null {
    const data = this.getStorageData();
    const entryIndex = data.time_entries.findIndex(te => te.id === entryId);

    if (entryIndex === -1) return null;

    data.time_entries[entryIndex] = {
      ...data.time_entries[entryIndex],
      ...updates,
      updated_at: Date.now(),
    };

    this.saveStorageData(data);
    return data.time_entries[entryIndex];
  }

  getTimeEntriesForTech(techId: string, startDate?: number, endDate?: number): TimeEntry[] {
    const data = this.getStorageData();
    return data.time_entries.filter(te => {
      if (te.tech_id !== techId) return false;
      if (startDate && te.start_time < startDate) return false;
      if (endDate && te.start_time > endDate) return false;
      return true;
    }).sort((a, b) => b.start_time - a.start_time);
  }

  getTimeEntriesForWorkOrder(workOrderId: string): TimeEntry[] {
    const data = this.getStorageData();
    return data.time_entries.filter(te => te.work_order_id === workOrderId)
      .sort((a, b) => a.start_time - b.start_time);
  }

  // Tech capacity and availability
  getTechWorkload(techId: string): {
    activeJobs: number;
    totalEstimatedHours: number;
    todayHours: number;
    weekHours: number;
  } {
    const data = this.getStorageData();
    const activeJobs = data.work_orders.filter(wo =>
      wo.assigned_tech === techId &&
      (wo.status === 'pending' || wo.status === 'in_progress')
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const todayEntries = data.time_entries.filter(te =>
      te.tech_id === techId && te.start_time >= today.getTime()
    );

    const weekEntries = data.time_entries.filter(te =>
      te.tech_id === techId && te.start_time >= weekStart.getTime()
    );

    const todayHours = todayEntries.reduce((sum, entry) =>
      sum + ((entry.duration || 0) / 60), 0
    );

    const weekHours = weekEntries.reduce((sum, entry) =>
      sum + ((entry.duration || 0) / 60), 0
    );

    return {
      activeJobs: activeJobs.length,
      totalEstimatedHours: activeJobs.length * 2, // Simple estimate
      todayHours,
      weekHours,
    };
  }

  // Smart assignment suggestions
  suggestTechForWorkOrder(workOrderId: string): TechProfile[] {
    const data = this.getStorageData();
    const workOrder = data.work_orders.find(wo => wo.id === workOrderId);

    if (!workOrder) return [];

    const allTechs = data.tech_profiles.filter(t => t.active);
    if (allTechs.length === 0) return [];

    // Score techs based on job requirements
    const scoredTechs = allTechs.map(tech => {
      let score = 0;
      const workload = this.getTechWorkload(tech.id);

      // Workload penalty/bonus
      if (workload.activeJobs >= 4) score -= 50;
      else if (workload.activeJobs >= 3) score -= 30;
      else if (workload.activeJobs >= 2) score -= 15;
      else if (workload.activeJobs === 0) score += 25;

      // Experience bonus based on hourly rate
      if (tech.hourly_rate) {
        if (tech.hourly_rate >= 35) score += 15; // Senior tech
        else if (tech.hourly_rate >= 25) score += 10; // Mid-level
        else score += 5; // Junior
      }

      // Certification bonus
      if (tech.certifications && tech.certifications.length > 0) {
        score += tech.certifications.length * 5;
      }

      // Match specialties to job requirements
      if (tech.specialties && tech.specialties.length > 0) {
        const concern = workOrder.customer_concern?.toLowerCase() || '';
        const services = workOrder.description?.toLowerCase() || '';
        const jobText = `${concern} ${services}`.toLowerCase();

        let specialtyMatch = false;
        tech.specialties.forEach(specialty => {
          const specialtyLower = specialty.toLowerCase();

          // Direct matches
          if (jobText.includes(specialtyLower)) {
            score += 40;
            specialtyMatch = true;
          }

          // Keyword-based matches
          else if (this.matchesSpecialtyKeywords(specialtyLower, jobText)) {
            score += 30;
            specialtyMatch = true;
          }

          // Category matches
          else if (this.matchesSpecialtyCategory(specialtyLower, jobText)) {
            score += 20;
            specialtyMatch = true;
          }
        });

        // Penalty for no specialty match
        if (!specialtyMatch) score -= 10;
      }

      // Vehicle age consideration
      if (workOrder.vehicle_id) {
        const vehicle = data.vehicles.find(v => v.id === workOrder.vehicle_id);
        if (vehicle && vehicle.year < 2010) {
          // Prefer experienced techs for older vehicles
          if (tech.hourly_rate && tech.hourly_rate >= 30) score += 10;
        }
      }

      // Priority job bonus
      const isUrgent = this.isUrgentJob(workOrder);
      if (isUrgent && tech.hourly_rate && tech.hourly_rate >= 30) {
        score += 15; // Prefer experienced techs for urgent jobs
      }

      return { ...tech, score, workload };
    }).sort((a, b) => b.score - a.score);

    return scoredTechs.slice(0, 5);
  }

  private matchesSpecialtyKeywords(specialty: string, jobText: string): boolean {
    const keywordMap: Record<string, string[]> = {
      'brake': ['brake', 'stop', 'squeaking', 'grinding', 'pedal'],
      'engine': ['engine', 'motor', 'performance', 'power', 'stall', 'rough idle'],
      'electrical': ['electric', 'battery', 'alternator', 'starter', 'wiring', 'lights'],
      'transmission': ['transmission', 'shift', 'gear', 'clutch', 'automatic'],
      'suspension': ['suspension', 'shock', 'strut', 'bounce', 'ride', 'alignment'],
      'hvac': ['heat', 'air conditioning', 'ac', 'climate', 'defrost', 'blower'],
      'tire': ['tire', 'wheel', 'alignment', 'balance', 'rotation']
    };

    const keywords = keywordMap[specialty] || [];
    return keywords.some(keyword => jobText.includes(keyword));
  }

  private matchesSpecialtyCategory(specialty: string, jobText: string): boolean {
    // Broader category matches
    const categoryMap: Record<string, string[]> = {
      'engine': ['maintenance', 'service', 'tune-up', 'oil'],
      'brake': ['safety', 'inspection'],
      'electrical': ['diagnostic', 'check engine', 'warning light'],
      'transmission': ['fluid', 'service'],
      'hvac': ['comfort', 'cabin'],
      'tire': ['safety', 'maintenance']
    };

    const categories = categoryMap[specialty] || [];
    return categories.some(category => jobText.includes(category));
  }

  private isUrgentJob(workOrder: WorkOrder): boolean {
    const concern = workOrder.customer_concern?.toLowerCase() || '';
    const urgentKeywords = ['urgent', 'emergency', 'broke down', 'won\'t start', 'dangerous', 'unsafe'];
    return urgentKeywords.some(keyword => concern.includes(keyword));
  }

  // Clear all data (for testing)
  clearData(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Export data for backup
  exportData(): StorageData {
    return this.getStorageData();
  }
}

export default new BrowserDatabaseService();