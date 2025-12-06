import initSqlJs, { Database } from 'sql.js';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    // Browser-based initialization will be async
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const SQL = await initSqlJs({
        // Load SQL.js from CDN
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem('shop_database');
      if (savedDb) {
        const uInt8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(uInt8Array);
      } else {
        this.db = new SQL.Database();
      }

      await this.initializeSchema();
      this.isInitialized = true;

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Execute schema directly since we can't read files in browser
    const schema = `
      -- Auto Shop Management Database Schema
      -- SQLite database for local-first architecture

      -- Customers table
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Vehicles table
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        vin TEXT UNIQUE,
        year INTEGER,
        make TEXT,
        model TEXT,
        engine TEXT,
        trim TEXT,
        license_plate TEXT,
        color TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Work orders table
      CREATE TABLE IF NOT EXISTS work_orders (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'awaiting_approval', 'approved', 'completed', 'cancelled')) DEFAULT 'pending',
        assigned_tech TEXT,
        mileage INTEGER,
        customer_concern TEXT,
        diagnosis TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        started_at INTEGER,
        completed_at INTEGER,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Line items for work orders (services, parts, labor)
      CREATE TABLE IF NOT EXISTS line_items (
        id TEXT PRIMARY KEY,
        work_order_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('service', 'part', 'labor')) DEFAULT 'service',
        description TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        approved BOOLEAN DEFAULT FALSE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
      );

      -- Check-in data from customer self-service
      CREATE TABLE IF NOT EXISTS check_ins (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        vehicle_id TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'work_order_created')) DEFAULT 'pending',
        customer_concern TEXT,
        mileage INTEGER,
        photo_paths TEXT,
        appointment_date INTEGER,
        checked_in_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      );

      -- Common services database
      CREATE TABLE IF NOT EXISTS common_services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        category TEXT,
        base_price REAL,
        labor_hours REAL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
      CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
      CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle_id ON work_orders(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
      CREATE INDEX IF NOT EXISTS idx_check_ins_status ON check_ins(status);

      -- Insert some common services for initial setup
      INSERT OR IGNORE INTO common_services (id, name, description, category, base_price, labor_hours, created_at, updated_at) VALUES
        ('oil-change', 'Oil Change', 'Engine oil and filter replacement', 'maintenance', 49.99, 0.5, ${Date.now()}, ${Date.now()}),
        ('brake-inspection', 'Brake Inspection', 'Complete brake system inspection', 'inspection', 39.99, 0.75, ${Date.now()}, ${Date.now()}),
        ('tire-rotation', 'Tire Rotation', 'Rotate tires for even wear', 'maintenance', 29.99, 0.5, ${Date.now()}, ${Date.now()}),
        ('brake-pads', 'Brake Pad Replacement', 'Replace front or rear brake pads', 'repair', 189.99, 1.5, ${Date.now()}, ${Date.now()}),
        ('alignment', 'Wheel Alignment', '4-wheel alignment service', 'maintenance', 89.99, 1.0, ${Date.now()}, ${Date.now()});
    `;

    this.db.exec(schema);
    this.saveDatabase();
  }

  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public saveDatabase(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const buffer = Array.from(data);
      localStorage.setItem('shop_database', JSON.stringify(buffer));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  public close(): void {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
    }
  }

  // Utility method for transactions (simplified for sql.js)
  public transaction<T>(fn: () => T): T {
    try {
      this.db?.exec('BEGIN TRANSACTION');
      const result = fn();
      this.db?.exec('COMMIT');
      this.saveDatabase();
      return result;
    } catch (error) {
      this.db?.exec('ROLLBACK');
      throw error;
    }
  }

  // Export database for backup
  public exportDatabase(): Uint8Array {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }
}

export default DatabaseConnection;