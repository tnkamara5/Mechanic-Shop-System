import { v4 as uuidv4 } from 'uuid';
import type {
  Appointment,
  ShopSchedule,
  ServiceDuration,
  TechSchedule,
  TimeOffRequest,
  TimeSlot,
  AppointmentConflict,
} from '../types/models';

class SchedulingService {
  private storageKey = 'shop_scheduling';

  private getSchedulingData(): {
    appointments: Appointment[];
    shop_schedules: ShopSchedule[];
    service_durations: ServiceDuration[];
    tech_schedules: TechSchedule[];
    time_off_requests: TimeOffRequest[];
  } {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }

    // Initialize with default scheduling data
    const defaultData = {
      appointments: [],
      shop_schedules: this.getDefaultShopSchedule(),
      service_durations: this.getDefaultServiceDurations(),
      tech_schedules: [],
      time_off_requests: [],
    };

    this.saveSchedulingData(defaultData);
    return defaultData;
  }

  private saveSchedulingData(data: any): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private getDefaultShopSchedule(): ShopSchedule[] {
    const days = [
      { day: 1, name: 'Monday', open: '08:00', close: '17:00' },
      { day: 2, name: 'Tuesday', open: '08:00', close: '17:00' },
      { day: 3, name: 'Wednesday', open: '08:00', close: '17:00' },
      { day: 4, name: 'Thursday', open: '08:00', close: '17:00' },
      { day: 5, name: 'Friday', open: '08:00', close: '17:00' },
      { day: 6, name: 'Saturday', open: '08:00', close: '15:00' },
      { day: 0, name: 'Sunday', open: '10:00', close: '14:00' },
    ];

    return days.map(day => ({
      id: `schedule_${day.day}`,
      day_of_week: day.day,
      open_time: day.open,
      close_time: day.close,
      lunch_start: '12:00',
      lunch_end: '13:00',
      is_closed: false,
      max_appointments_per_hour: 4,
      created_at: Date.now(),
      updated_at: Date.now(),
    }));
  }

  private getDefaultServiceDurations(): ServiceDuration[] {
    return [
      {
        id: 'oil-change-duration',
        service_id: 'oil-change',
        service_name: 'Oil Change',
        category: 'maintenance',
        estimated_minutes: 30,
        minimum_minutes: 20,
        maximum_minutes: 45,
        buffer_minutes: 10,
        complexity_multiplier: 1.0,
        requires_specialist: false,
        can_overlap: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: 'brake-inspection-duration',
        service_id: 'brake-inspection',
        service_name: 'Brake Inspection',
        category: 'inspection',
        estimated_minutes: 45,
        minimum_minutes: 30,
        maximum_minutes: 60,
        buffer_minutes: 15,
        complexity_multiplier: 1.2,
        requires_specialist: false,
        can_overlap: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: 'brake-pads-duration',
        service_id: 'brake-pads',
        service_name: 'Brake Pad Replacement',
        category: 'repair',
        estimated_minutes: 90,
        minimum_minutes: 60,
        maximum_minutes: 120,
        buffer_minutes: 15,
        complexity_multiplier: 1.5,
        requires_specialist: true,
        can_overlap: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: 'tire-rotation-duration',
        service_id: 'tire-rotation',
        service_name: 'Tire Rotation',
        category: 'maintenance',
        estimated_minutes: 25,
        minimum_minutes: 15,
        maximum_minutes: 35,
        buffer_minutes: 10,
        complexity_multiplier: 1.0,
        requires_specialist: false,
        can_overlap: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: 'alignment-duration',
        service_id: 'alignment',
        service_name: 'Wheel Alignment',
        category: 'maintenance',
        estimated_minutes: 60,
        minimum_minutes: 45,
        maximum_minutes: 90,
        buffer_minutes: 15,
        complexity_multiplier: 1.3,
        requires_specialist: true,
        can_overlap: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      }
    ];
  }

  // Get service duration configuration
  getServiceDuration(serviceId: string): ServiceDuration | null {
    const data = this.getSchedulingData();
    return data.service_durations.find(sd => sd.service_id === serviceId) || null;
  }

  // Calculate estimated duration for a service, considering vehicle complexity
  calculateServiceDuration(serviceId: string, vehicleYear?: number): number {
    const serviceDuration = this.getServiceDuration(serviceId);
    if (!serviceDuration) return 60; // default 1 hour

    let duration = serviceDuration.estimated_minutes;

    // Apply complexity multiplier for older vehicles
    if (vehicleYear && vehicleYear < 2010) {
      duration *= serviceDuration.complexity_multiplier;
    }

    return Math.ceil(duration);
  }

  // Get shop schedule for a specific day
  getShopScheduleForDay(date: Date): ShopSchedule | null {
    const data = this.getSchedulingData();
    const dayOfWeek = date.getDay();
    return data.shop_schedules.find(schedule => schedule.day_of_week === dayOfWeek) || null;
  }

  // Check if shop is open on a given date and time
  isShopOpen(dateTime: Date): boolean {
    const schedule = this.getShopScheduleForDay(dateTime);
    if (!schedule || schedule.is_closed) return false;

    const timeStr = dateTime.toTimeString().slice(0, 5); // "HH:MM"

    // Check if within business hours
    if (timeStr < schedule.open_time || timeStr >= schedule.close_time) {
      return false;
    }

    // Check if during lunch break
    if (schedule.lunch_start && schedule.lunch_end) {
      if (timeStr >= schedule.lunch_start && timeStr < schedule.lunch_end) {
        return false;
      }
    }

    return true;
  }

  // Get available time slots for a specific date
  getAvailableTimeSlots(
    date: Date,
    serviceId: string,
    vehicleYear?: number
  ): TimeSlot[] {
    const schedule = this.getShopScheduleForDay(date);
    if (!schedule || schedule.is_closed) return [];

    const serviceDuration = this.calculateServiceDuration(serviceId, vehicleYear);
    const slots: TimeSlot[] = [];

    // Create 30-minute intervals throughout the day
    const startTime = new Date(date);
    const [openHour, openMinute] = schedule.open_time.split(':').map(Number);
    startTime.setHours(openHour, openMinute, 0, 0);

    const endTime = new Date(date);
    const [closeHour, closeMinute] = schedule.close_time.split(':').map(Number);
    endTime.setHours(closeHour, closeMinute, 0, 0);

    const currentSlot = new Date(startTime);

    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);

      // Skip if slot would extend past closing
      if (slotEnd > endTime) break;

      // Check for lunch break conflict
      const slotStartTime = currentSlot.toTimeString().slice(0, 5);
      const slotEndTime = slotEnd.toTimeString().slice(0, 5);

      let isAvailable = true;
      let reason: string | undefined;

      // Check lunch break
      if (schedule.lunch_start && schedule.lunch_end) {
        if (slotStartTime < schedule.lunch_end && slotEndTime > schedule.lunch_start) {
          isAvailable = false;
          reason = 'lunch';
        }
      }

      // Check existing appointments
      if (isAvailable) {
        const conflict = this.checkAppointmentConflict(currentSlot, slotEnd);
        if (conflict) {
          isAvailable = false;
          reason = 'booked';
        }
      }

      slots.push({
        start: new Date(currentSlot),
        end: new Date(slotEnd),
        available: isAvailable,
        reason,
        available_techs: this.getAvailableTechs(currentSlot, slotEnd, serviceId),
      });

      // Move to next 30-minute slot
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    return slots;
  }

  // Check for appointment conflicts
  checkAppointmentConflict(startTime: Date, endTime: Date): AppointmentConflict | null {
    const data = this.getSchedulingData();

    for (const appointment of data.appointments) {
      if (appointment.status === 'cancelled') continue;

      const appointmentStart = new Date(appointment.scheduled_start);
      const appointmentEnd = new Date(appointment.scheduled_end);

      // Check for overlap
      if (startTime < appointmentEnd && endTime > appointmentStart) {
        return {
          type: 'double_booking',
          message: `Conflicts with existing appointment at ${appointmentStart.toLocaleTimeString()}`,
          conflicting_appointment_id: appointment.id,
        };
      }
    }

    return null;
  }

  // Get available technicians for a time slot
  getAvailableTechs(_startTime: Date, _endTime: Date, _serviceId: string): string[] {
    // For MVP, return a default tech list
    // In full implementation, this would check tech schedules, specializations, and time-off
    return ['tech-001', 'tech-002'];
  }

  // Create a new appointment
  createAppointment(appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Appointment {
    const data = this.getSchedulingData();

    const appointment: Appointment = {
      id: uuidv4(),
      ...appointmentData,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    data.appointments.push(appointment);
    this.saveSchedulingData(data);

    return appointment;
  }

  // Update appointment
  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    const data = this.getSchedulingData();
    const appointmentIndex = data.appointments.findIndex(a => a.id === id);

    if (appointmentIndex === -1) return null;

    data.appointments[appointmentIndex] = {
      ...data.appointments[appointmentIndex],
      ...updates,
      updated_at: Date.now(),
    };

    this.saveSchedulingData(data);
    return data.appointments[appointmentIndex];
  }

  // Get appointments for a date range
  getAppointments(startDate?: Date, endDate?: Date): Appointment[] {
    const data = this.getSchedulingData();

    if (!startDate && !endDate) {
      return data.appointments.sort((a, b) => a.scheduled_start - b.scheduled_start);
    }

    return data.appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.scheduled_start);

      if (startDate && appointmentDate < startDate) return false;
      if (endDate && appointmentDate > endDate) return false;

      return true;
    }).sort((a, b) => a.scheduled_start - b.scheduled_start);
  }

  // Get appointments for today
  getTodaysAppointments(): Appointment[] {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.getAppointments(startOfDay, endOfDay);
  }

  // Update service duration configuration
  updateServiceDuration(serviceId: string, updates: Partial<ServiceDuration>): ServiceDuration | null {
    const data = this.getSchedulingData();
    const durationIndex = data.service_durations.findIndex(sd => sd.service_id === serviceId);

    if (durationIndex === -1) return null;

    data.service_durations[durationIndex] = {
      ...data.service_durations[durationIndex],
      ...updates,
      updated_at: Date.now(),
    };

    this.saveSchedulingData(data);
    return data.service_durations[durationIndex];
  }

  // Update shop schedule
  updateShopSchedule(dayOfWeek: number, updates: Partial<ShopSchedule>): ShopSchedule | null {
    const data = this.getSchedulingData();
    const scheduleIndex = data.shop_schedules.findIndex(s => s.day_of_week === dayOfWeek);

    if (scheduleIndex === -1) return null;

    data.shop_schedules[scheduleIndex] = {
      ...data.shop_schedules[scheduleIndex],
      ...updates,
      updated_at: Date.now(),
    };

    this.saveSchedulingData(data);
    return data.shop_schedules[scheduleIndex];
  }

  // Get all service durations
  getAllServiceDurations(): ServiceDuration[] {
    const data = this.getSchedulingData();
    return data.service_durations;
  }

  // Get all shop schedules
  getAllShopSchedules(): ShopSchedule[] {
    const data = this.getSchedulingData();
    return data.shop_schedules;
  }

  // Clear all scheduling data (for testing)
  clearSchedulingData(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export default new SchedulingService();