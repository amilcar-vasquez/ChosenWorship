// Scheduling and notification utilities for worship services

export interface RecurringService {
  id: string;
  title: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // "HH:mm" format
  location: string;
  type: string;
  setlistReminderDays: number;
  teamReminderDays: number;
  active: boolean;
  defaultDuration: number;
  requiredRoles: string[];
}

export interface SetlistNotification {
  id: string;
  type: 'setlist-reminder' | 'team-reminder' | 'service-reminder';
  serviceId: string;
  targetDate: string;
  createdAt: string;
  status: 'pending' | 'acknowledged' | 'completed';
  assignedTo: string;
  message: string;
}

export interface SetlistTemplate {
  id: string;
  name: string;
  serviceType: string;
  structure: Record<string, {
    count: number;
    type: 'praise' | 'worship';
    tempo: 'slow' | 'medium' | 'fast' | 'mixed';
  }>;
  totalSongs: number;
  estimatedDuration: number;
}

// Calculate next service date for a recurring service
export function getNextServiceDate(service: RecurringService, fromDate = new Date()): Date {
  const targetDay = service.dayOfWeek;
  const currentDay = fromDate.getDay();
  
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
  }
  
  const nextDate = new Date(fromDate);
  nextDate.setDate(nextDate.getDate() + daysUntilTarget);
  
  // Set the time
  const [hours, minutes] = service.time.split(':').map(Number);
  nextDate.setHours(hours, minutes, 0, 0);
  
  return nextDate;
}

// Calculate reminder dates
export function calculateReminderDates(service: RecurringService, serviceDate: Date) {
  const setlistReminderDate = new Date(serviceDate);
  setlistReminderDate.setDate(serviceDate.getDate() - service.setlistReminderDays);
  
  const teamReminderDate = new Date(serviceDate);
  teamReminderDate.setDate(serviceDate.getDate() - service.teamReminderDays);
  
  return {
    setlistReminder: setlistReminderDate,
    teamReminder: teamReminderDate
  };
}

// Generate notifications for upcoming services
export function generateUpcomingNotifications(
  services: RecurringService[],
  existingNotifications: SetlistNotification[],
  weeksAhead = 4
): SetlistNotification[] {
  const newNotifications: SetlistNotification[] = [];
  const now = new Date();
  
  services.forEach(service => {
    if (!service.active) return;
    
    for (let week = 0; week < weeksAhead; week++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + (week * 7));
      
      const serviceDate = getNextServiceDate(service, checkDate);
      const { setlistReminder, teamReminder } = calculateReminderDates(service, serviceDate);
      
      // Check if setlist reminder already exists
      const existingSetlistReminder = existingNotifications.find(n => 
        n.serviceId === service.id && 
        n.type === 'setlist-reminder' &&
        new Date(n.targetDate).toDateString() === serviceDate.toDateString()
      );
      
      if (!existingSetlistReminder && setlistReminder > now) {
        newNotifications.push({
          id: `notif_setlist_${service.id}_${serviceDate.getTime()}`,
          type: 'setlist-reminder',
          serviceId: service.id,
          targetDate: serviceDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          status: 'pending',
          assignedTo: 'user_neo123', // Default to musical director
          message: `Reminder: Create setlist for ${service.title} (${serviceDate.toLocaleDateString()})`
        });
      }
    }
  });
  
  return newNotifications;
}

// Get active notifications that should be displayed
export function getActiveNotifications(
  notifications: SetlistNotification[],
  currentDate = new Date()
): SetlistNotification[] {
  return notifications.filter(notification => {
    if (notification.status !== 'pending') return false;
    
    const targetDate = new Date(notification.targetDate);
    const daysDiff = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Show notifications for services in the next 7 days
    return daysDiff >= 0 && daysDiff <= 7;
  });
}

// Format service time for display
export function formatServiceTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Get day name from dayOfWeek number
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

// Calculate if a setlist is overdue
export function isSetlistOverdue(service: RecurringService, targetDate: string, hasSetlist: boolean): boolean {
  if (hasSetlist) return false;
  
  const serviceDate = new Date(targetDate);
  const now = new Date();
  const reminderDate = new Date(serviceDate);
  reminderDate.setDate(serviceDate.getDate() - service.setlistReminderDays);
  
  return now > reminderDate;
}

// Generate setlist ID based on service and date
export function generateSetlistId(serviceId: string, targetDate: string): string {
  const dateStr = targetDate.replace(/-/g, '');
  return `setlist_${serviceId}_${dateStr}`;
}