// Core data models for the auto shop system

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  created_at: number;
  updated_at: number;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  engine?: string;
  trim?: string;
  license_plate?: string;
  color?: string;
  created_at: number;
  updated_at: number;
}

export type WorkOrderStatus = 'pending' | 'in_progress' | 'awaiting_approval' | 'approved' | 'completed' | 'cancelled';

export interface WorkOrder {
  id: string;
  vehicle_id: string;
  customer_id: string;
  status: WorkOrderStatus;
  assigned_tech?: string;
  mileage?: number;
  customer_concern?: string;
  diagnosis?: string;
  created_at: number;
  updated_at: number;
  started_at?: number;
  completed_at?: number;
}

export type LineItemType = 'service' | 'part' | 'labor';

export interface LineItem {
  id: string;
  work_order_id: string;
  type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  approved: boolean;
  created_at: number;
  updated_at: number;
}

export interface ServiceHistory {
  id: string;
  vehicle_id: string;
  work_order_id: string;
  date: number;
  mileage?: number;
  services_performed: string; // JSON array
  total_cost?: number;
  notes?: string;
  created_at: number;
}

export interface CommonService {
  id: string;
  name: string;
  description?: string;
  category?: string;
  base_price?: number;
  labor_hours?: number;
  created_at: number;
  updated_at: number;
}

export interface Attachment {
  id: string;
  work_order_id?: string;
  line_item_id?: string;
  filename: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  created_at: number;
}

export type CheckInStatus = 'pending' | 'completed' | 'work_order_created';

export interface CheckIn {
  id: string;
  customer_id?: string;
  vehicle_id?: string;
  status: CheckInStatus;
  customer_concern?: string;
  mileage?: number;
  photo_paths?: string; // JSON array
  appointment_date?: number;
  checked_in_at: number;
  created_at: number;
}

export type SyncState = 'pending' | 'synced' | 'conflict';

export interface SyncStatus {
  id: number;
  table_name: string;
  record_id: string;
  last_sync?: number;
  sync_state: SyncState;
  device_id?: string;
  created_at: number;
  updated_at: number;
}

// Extended models with joined data for UI
export interface WorkOrderWithDetails extends WorkOrder {
  customer: Customer;
  vehicle: Vehicle;
  line_items: LineItem[];
  attachments: Attachment[];
}

export interface VehicleWithCustomer extends Vehicle {
  customer: Customer;
  service_history: ServiceHistory[];
}

// VIN Decoder response type
export interface VinDecodeResponse {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  EngineHP?: string;
  EngineCylinders?: string;
  EngineL?: string;
  Trim?: string;
  ErrorCode?: string;
  ErrorText?: string;
}

// Form types for customer input
export interface CustomerCheckInForm {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
    license_plate?: string;
    color?: string;
  };
  service: {
    mileage?: number;
    customer_concern?: string;
    appointment_date?: string;
    photos?: File[];
  };
}

// Estimate approval form
export interface EstimateApprovalForm {
  work_order_id: string;
  line_items: {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  total_estimate: number;
  photos?: string[];
  notes?: string;
}