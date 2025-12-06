import { v4 as uuidv4 } from 'uuid';
import type {
  Customer,
  Vehicle,
  WorkOrder,
  LineItem,
  CheckIn,
  CommonService,
  CustomerCheckInForm,
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

    // Create work order
    const workOrder = this.createWorkOrder({
      vehicle_id: checkIn.vehicle_id!,
      customer_id: checkIn.customer_id!,
      status: 'pending',
      mileage: checkIn.mileage,
      customer_concern: checkIn.customer_concern,
    });

    // Update check-in status
    checkIn.status = 'work_order_created';
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