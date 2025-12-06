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

-- Service history for reporting and customer records
CREATE TABLE IF NOT EXISTS service_history (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  work_order_id TEXT NOT NULL,
  date INTEGER NOT NULL,
  mileage INTEGER,
  services_performed TEXT, -- JSON array of services
  total_cost REAL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
);

-- Common services database (predefined services with pricing)
CREATE TABLE IF NOT EXISTS common_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- 'maintenance', 'repair', 'inspection', etc.
  base_price REAL,
  labor_hours REAL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Photos/attachments for work orders
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  work_order_id TEXT,
  line_item_id TEXT,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  FOREIGN KEY (line_item_id) REFERENCES line_items(id)
);

-- Check-in data from customer self-service
CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  vehicle_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'work_order_created')) DEFAULT 'pending',
  customer_concern TEXT,
  mileage INTEGER,
  photo_paths TEXT, -- JSON array of photo file paths
  appointment_date INTEGER,
  checked_in_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Sync status for data synchronization
CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  last_sync INTEGER,
  sync_state TEXT NOT NULL CHECK (sync_state IN ('pending', 'synced', 'conflict')) DEFAULT 'pending',
  device_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle_id ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_tech ON work_orders(assigned_tech);
CREATE INDEX IF NOT EXISTS idx_line_items_work_order_id ON line_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_service_history_vehicle_id ON service_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON check_ins(status);
CREATE INDEX IF NOT EXISTS idx_sync_status_table_record ON sync_status(table_name, record_id);

-- Insert some common services for initial setup
INSERT OR IGNORE INTO common_services (id, name, description, category, base_price, labor_hours, created_at, updated_at) VALUES
  ('oil-change', 'Oil Change', 'Engine oil and filter replacement', 'maintenance', 49.99, 0.5, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('brake-inspection', 'Brake Inspection', 'Complete brake system inspection', 'inspection', 39.99, 0.75, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('tire-rotation', 'Tire Rotation', 'Rotate tires for even wear', 'maintenance', 29.99, 0.5, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('brake-pads', 'Brake Pad Replacement', 'Replace front or rear brake pads', 'repair', 189.99, 1.5, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('alignment', 'Wheel Alignment', '4-wheel alignment service', 'maintenance', 89.99, 1.0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);