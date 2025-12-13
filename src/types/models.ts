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

// Tech Interface Models
export interface TechWorkOrder extends WorkOrder {
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  labor_estimate?: number;
  parts_estimate?: number;
  time_estimate?: number; // in minutes
  diagnosis_photos?: string[];
  diagnostic_notes?: string;
  requires_approval?: boolean;
}

export interface EstimateRequest {
  id: string;
  work_order_id: string;
  tech_id: string;
  line_items: EstimateLineItem[];
  labor_hours: number;
  total_estimate: number;
  photos?: string[];
  notes?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: number;
  updated_at: number;
  submitted_at?: number;
  responded_at?: number;
}

export interface EstimateLineItem {
  id: string;
  type: LineItemType;
  description: string;
  part_number?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier?: string;
  notes?: string;
}

export interface TechPhoto {
  id: string;
  work_order_id: string;
  estimate_request_id?: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
  category: 'diagnostic' | 'before' | 'progress' | 'after' | 'issue';
  taken_at: number;
  uploaded_at: number;
}

export interface TechProfile {
  id: string;
  name: string;
  employee_id?: string;
  certifications?: string[];
  specialties?: string[];
  hourly_rate?: number;
  active: boolean;
  created_at: number;
  updated_at: number;
}

export interface TimeEntry {
  id: string;
  work_order_id: string;
  tech_id: string;
  start_time: number;
  end_time?: number;
  duration?: number; // in minutes
  description?: string;
  billable: boolean;
  created_at: number;
  updated_at: number;
}

// Enhanced Scheduling Models
export interface Appointment {
  id: string;
  customer_id: string;
  vehicle_id?: string;
  service_type: string;
  service_category: string;
  scheduled_start: number;
  scheduled_end: number;
  duration_minutes: number;
  assigned_tech?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'normal' | 'urgent' | 'rush';
  estimated_price?: number;
  customer_notes?: string;
  internal_notes?: string;
  created_at: number;
  updated_at: number;
  created_by: string; // customer or staff member
}

export interface ShopSchedule {
  id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  open_time: string; // "08:00"
  close_time: string; // "17:00"
  lunch_start?: string; // "12:00"
  lunch_end?: string; // "13:00"
  is_closed: boolean;
  max_appointments_per_hour?: number;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface ServiceDuration {
  id: string;
  service_id: string;
  service_name: string;
  category: string;
  estimated_minutes: number;
  minimum_minutes: number;
  maximum_minutes: number;
  buffer_minutes: number; // cleanup time after job
  complexity_multiplier: number; // 1.0 = normal, 1.5 = complex vehicles
  requires_specialist: boolean;
  can_overlap: boolean; // can be done while other work happens
  created_at: number;
  updated_at: number;
}

export interface TechSchedule {
  id: string;
  tech_id: string;
  date: number; // timestamp for the day
  shift_start: string; // "08:00"
  shift_end: string; // "17:00"
  lunch_start?: string;
  lunch_end?: string;
  available: boolean;
  max_concurrent_jobs: number;
  specializations: string[]; // brake, engine, electrical, etc.
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface TimeOffRequest {
  id: string;
  tech_id: string;
  request_type: 'vacation' | 'sick' | 'personal' | 'appointment' | 'training';
  start_date: number;
  end_date: number;
  start_time?: string; // for partial day requests
  end_time?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  requested_at: number;
  reviewed_at?: number;
  reviewed_by?: string;
  reviewer_notes?: string;
  impact_assessment?: string; // auto-generated conflict warnings
}

export interface BusinessRules {
  id: string;
  rule_name: string;
  rule_type: 'scheduling' | 'pricing' | 'capacity' | 'workflow';
  configuration: Record<string, any>; // flexible rule configuration
  is_active: boolean;
  priority: number; // for rule conflict resolution
  created_at: number;
  updated_at: number;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  reason?: string; // "booked", "lunch", "closed", "tech_unavailable"
  conflicting_appointment_id?: string;
  available_techs: string[];
  suggested_price?: number;
}

export interface AppointmentConflict {
  type: 'double_booking' | 'no_tech_available' | 'outside_hours' | 'insufficient_time';
  message: string;
  conflicting_appointment_id?: string;
  suggested_alternatives?: TimeSlot[];
}

export interface SchedulingPreferences {
  id: string;
  customer_id?: string;
  preferred_tech?: string;
  preferred_times: string[]; // ["morning", "afternoon", "evening"]
  preferred_days: number[]; // [1, 2, 3] for Mon, Tue, Wed
  avoid_rush_jobs: boolean;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    reminder_hours: number; // hours before appointment
  };
  created_at: number;
  updated_at: number;
}