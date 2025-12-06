import { v4 as uuidv4 } from 'uuid';
import DatabaseConnection from '../database/connection';
import type {
  Customer,
  Vehicle,
  WorkOrder,
  LineItem,
  CheckIn,
  CommonService,
  WorkOrderWithDetails,
  CustomerCheckInForm,
  VehicleWithCustomer
} from '../types/models';

class DatabaseService {
  private dbConnection = DatabaseConnection.getInstance();

  async ensureInitialized() {
    await this.dbConnection.initialize();
  }

  private getDb() {
    return this.dbConnection.getDatabase();
  }

  // Customer operations
  async createCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    await this.ensureInitialized();
    const db = this.getDb();

    const now = Date.now();
    const customer: Customer = {
      id: uuidv4(),
      ...customerData,
      created_at: now,
      updated_at: now,
    };

    const stmt = db.prepare(`
      INSERT INTO customers (id, name, phone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run([customer.id, customer.name, customer.phone, customer.email, customer.created_at, customer.updated_at]);
    this.dbConnection.saveDatabase();
    return customer;
  }

  findCustomerByPhone(phone: string): Customer | null {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE phone = ?');
    return stmt.get(phone) as Customer | null;
  }

  // Vehicle operations
  createVehicle(vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Vehicle {
    const now = Date.now();
    const vehicle: Vehicle = {
      id: uuidv4(),
      ...vehicleData,
      created_at: now,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO vehicles (id, customer_id, vin, year, make, model, engine, trim, license_plate, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      vehicle.id,
      vehicle.customer_id,
      vehicle.vin,
      vehicle.year,
      vehicle.make,
      vehicle.model,
      vehicle.engine,
      vehicle.trim,
      vehicle.license_plate,
      vehicle.color,
      vehicle.created_at,
      vehicle.updated_at
    );

    return vehicle;
  }

  findVehicleByVin(vin: string): Vehicle | null {
    const stmt = this.db.prepare('SELECT * FROM vehicles WHERE vin = ?');
    return stmt.get(vin) as Vehicle | null;
  }

  getVehicleWithCustomer(vehicleId: string): VehicleWithCustomer | null {
    const stmt = this.db.prepare(`
      SELECT
        v.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email
      FROM vehicles v
      JOIN customers c ON v.customer_id = c.id
      WHERE v.id = ?
    `);

    const result = stmt.get(vehicleId) as any;
    if (!result) return null;

    return {
      id: result.id,
      customer_id: result.customer_id,
      vin: result.vin,
      year: result.year,
      make: result.make,
      model: result.model,
      engine: result.engine,
      trim: result.trim,
      license_plate: result.license_plate,
      color: result.color,
      created_at: result.created_at,
      updated_at: result.updated_at,
      customer: {
        id: result.customer_id,
        name: result.customer_name,
        phone: result.customer_phone,
        email: result.customer_email,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
      service_history: [], // TODO: Implement service history lookup
    };
  }

  // Check-in operations
  createCheckIn(checkInData: Omit<CheckIn, 'id' | 'created_at'>): CheckIn {
    const now = Date.now();
    const checkIn: CheckIn = {
      id: uuidv4(),
      ...checkInData,
      created_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO check_ins (id, customer_id, vehicle_id, status, customer_concern, mileage, photo_paths, appointment_date, checked_in_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      checkIn.id,
      checkIn.customer_id,
      checkIn.vehicle_id,
      checkIn.status,
      checkIn.customer_concern,
      checkIn.mileage,
      checkIn.photo_paths,
      checkIn.appointment_date,
      checkIn.checked_in_at,
      checkIn.created_at
    );

    return checkIn;
  }

  // Process customer check-in form
  processCustomerCheckIn(formData: CustomerCheckInForm): CheckIn {
    return DatabaseConnection.getInstance().transaction(() => {
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
    });
  }

  // Work order operations
  createWorkOrder(workOrderData: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>): WorkOrder {
    const now = Date.now();
    const workOrder: WorkOrder = {
      id: uuidv4(),
      ...workOrderData,
      created_at: now,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO work_orders (id, vehicle_id, customer_id, status, assigned_tech, mileage, customer_concern, diagnosis, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      workOrder.id,
      workOrder.vehicle_id,
      workOrder.customer_id,
      workOrder.status,
      workOrder.assigned_tech,
      workOrder.mileage,
      workOrder.customer_concern,
      workOrder.diagnosis,
      workOrder.created_at,
      workOrder.updated_at
    );

    return workOrder;
  }

  createWorkOrderFromCheckIn(checkInId: string): WorkOrder {
    return DatabaseConnection.getInstance().transaction(() => {
      // Get check-in data
      const checkInStmt = this.db.prepare('SELECT * FROM check_ins WHERE id = ?');
      const checkIn = checkInStmt.get(checkInId) as CheckIn;

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
      const updateStmt = this.db.prepare('UPDATE check_ins SET status = ? WHERE id = ?');
      updateStmt.run('work_order_created', checkInId);

      return workOrder;
    });
  }

  getWorkOrdersWithDetails(): WorkOrderWithDetails[] {
    const stmt = this.db.prepare(`
      SELECT
        wo.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        v.year as vehicle_year,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.vin as vehicle_vin,
        v.license_plate as vehicle_license_plate
      FROM work_orders wo
      JOIN customers c ON wo.customer_id = c.id
      JOIN vehicles v ON wo.vehicle_id = v.id
      ORDER BY wo.created_at DESC
    `);

    const results = stmt.all() as any[];

    return results.map(row => ({
      id: row.id,
      vehicle_id: row.vehicle_id,
      customer_id: row.customer_id,
      status: row.status,
      assigned_tech: row.assigned_tech,
      mileage: row.mileage,
      customer_concern: row.customer_concern,
      diagnosis: row.diagnosis,
      created_at: row.created_at,
      updated_at: row.updated_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
      customer: {
        id: row.customer_id,
        name: row.customer_name,
        phone: row.customer_phone,
        email: row.customer_email,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      vehicle: {
        id: row.vehicle_id,
        customer_id: row.customer_id,
        vin: row.vehicle_vin,
        year: row.vehicle_year,
        make: row.vehicle_make,
        model: row.vehicle_model,
        engine: row.engine,
        trim: row.trim,
        license_plate: row.vehicle_license_plate,
        color: row.color,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      line_items: [], // TODO: Load line items
      attachments: [], // TODO: Load attachments
    }));
  }

  getPendingCheckIns(): CheckIn[] {
    const stmt = this.db.prepare('SELECT * FROM check_ins WHERE status = ? ORDER BY checked_in_at ASC');
    return stmt.all('pending') as CheckIn[];
  }

  // Common services
  getCommonServices(): CommonService[] {
    const stmt = this.db.prepare('SELECT * FROM common_services ORDER BY name ASC');
    return stmt.all() as CommonService[];
  }

  // Line item operations
  addLineItem(lineItemData: Omit<LineItem, 'id' | 'created_at' | 'updated_at'>): LineItem {
    const now = Date.now();
    const lineItem: LineItem = {
      id: uuidv4(),
      ...lineItemData,
      created_at: now,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO line_items (id, work_order_id, type, description, quantity, unit_price, total_price, approved, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      lineItem.id,
      lineItem.work_order_id,
      lineItem.type,
      lineItem.description,
      lineItem.quantity,
      lineItem.unit_price,
      lineItem.total_price,
      lineItem.approved,
      lineItem.created_at,
      lineItem.updated_at
    );

    return lineItem;
  }
}

export default new DatabaseService();