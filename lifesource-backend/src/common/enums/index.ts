export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum UserRole {
  USER = 'user',
  // DONOR = 'donor',
  // RECIPIENT = 'recipient',
  HOSPITAL_ADMIN = 'hospital-admin',
  SUPER_ADMIN = 'super-admin',
}

export enum ActiveRole {
  DONOR = 'donor',
  RECIPIENT = 'recipient',
}

export enum RequestStatus {
  PENDING = 'pending',
  NOTIFIED_DONORS = 'notified_donors',
  CONFIRMED_BY_HOSPITAL = 'confirmed_by_hospital',
  FULFILLED = 'fulfilled',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  UNAVAILABLE = 'unavailable',
  CANCELLED = 'cancelled',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  RESCHEDULED = 'rescheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum InventoryStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  USED = 'used',
  EXPIRED = 'expired',
  DISCARDED = 'discarded',
}

export enum DonationType {
  WHOLE_BLOOD = 'whole_blood',
  PLATELET = 'platelet',
  PLASMA = 'plasma',
  DOUBLE_RED_CELLS = 'double_red_cells',
}

export enum UrgencyLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum NotificationType {
  BLOOD_REQUEST = 'blood_request',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  DONATION_CONFIRMED = 'donation_confirmed',
  REQUEST_FULFILLED = 'request_fulfilled',
  BROADCAST = 'broadcast',
  ELIGIBILITY_RESTORED = 'eligibility_restored',
}

export enum BroadcastTarget {
  ALL = 'all',
  DONORS = 'donors',
  RECIPIENTS = 'recipients',
  HOSPITALS = 'hospitals',
}

export enum HospitalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

// Blood compatibility map - who can receive from whom
export const BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  [BloodType.A_POSITIVE]: [
    BloodType.A_POSITIVE,
    BloodType.A_NEGATIVE,
    BloodType.O_POSITIVE,
    BloodType.O_NEGATIVE,
  ],
  [BloodType.A_NEGATIVE]: [BloodType.A_NEGATIVE, BloodType.O_NEGATIVE],
  [BloodType.B_POSITIVE]: [
    BloodType.B_POSITIVE,
    BloodType.B_NEGATIVE,
    BloodType.O_POSITIVE,
    BloodType.O_NEGATIVE,
  ],
  [BloodType.B_NEGATIVE]: [BloodType.B_NEGATIVE, BloodType.O_NEGATIVE],
  [BloodType.AB_POSITIVE]: Object.values(BloodType), // Universal recipient
  [BloodType.AB_NEGATIVE]: [
    BloodType.A_NEGATIVE,
    BloodType.B_NEGATIVE,
    BloodType.AB_NEGATIVE,
    BloodType.O_NEGATIVE,
  ],
  [BloodType.O_POSITIVE]: [BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
  [BloodType.O_NEGATIVE]: [BloodType.O_NEGATIVE], // Universal donor
};
