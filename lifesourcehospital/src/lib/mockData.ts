// Mock data for the hospital management system

export interface HospitalInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  services: string[];
  isVerified: boolean;
  licenseNumber: string;
  registrationDate: string;
}

export interface DonationAppointment {
  id: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  bloodType: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'rejected' | 'rescheduled';
  notes?: string;
}

export interface BloodUnit {
  id: string;
  bloodType: string;
  quantity: number;
  donorId: string;
  donorName: string;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  status: 'available' | 'reserved' | 'used' | 'expired' | 'discarded';
}

export interface RecipientRequest {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  bloodType: string;
  unitsNeeded: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  requestDate: string;
  requiredBy: string;
  status: 'pending' | 'fulfilled' | 'partially_fulfilled' | 'unavailable';
  matchedUnits?: string[];
  notes?: string;
}

export interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodType: string;
  dateOfBirth: string;
  address: string;
  totalDonations: number;
  lastDonationDate: string;
  eligibleToDonateSince: string;
  status: 'active' | 'inactive' | 'deferred';
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodType: string;
  dateOfBirth: string;
  address: string;
  totalTransfusions: number;
  lastTransfusionDate: string;
  medicalCondition: string;
  status: 'active' | 'inactive';
}

// Initial mock data
export const mockHospitalInfo: HospitalInfo = {
  id: '1',
  name: 'City General Hospital',
  address: '123 Medical Center Drive',
  city: 'Lagos',
  state: 'Lagos State',
  zipCode: '100001',
  phone: '+234 801 234 5678',
  email: 'admin@citygeneralhospital.com',
  website: 'www.citygeneralhospital.com',
  services: ['Blood Transfusion', 'Blood Testing', 'Platelet Donation', 'Plasma Collection', 'Emergency Services'],
  isVerified: true,
  licenseNumber: 'FMOH-BB-2024-0001',
  registrationDate: '2024-01-15'
};

export const mockAppointments: DonationAppointment[] = [
  { id: '1', donorName: 'John Doe', donorPhone: '+234 802 111 2222', donorEmail: 'john@email.com', bloodType: 'O+', appointmentDate: '2024-01-20', appointmentTime: '09:00', status: 'pending' },
  { id: '2', donorName: 'Jane Smith', donorPhone: '+234 803 333 4444', donorEmail: 'jane@email.com', bloodType: 'A-', appointmentDate: '2024-01-20', appointmentTime: '10:30', status: 'confirmed' },
  { id: '3', donorName: 'Michael Johnson', donorPhone: '+234 804 555 6666', donorEmail: 'michael@email.com', bloodType: 'B+', appointmentDate: '2024-01-21', appointmentTime: '11:00', status: 'pending' },
  { id: '4', donorName: 'Sarah Williams', donorPhone: '+234 805 777 8888', donorEmail: 'sarah@email.com', bloodType: 'AB+', appointmentDate: '2024-01-22', appointmentTime: '14:00', status: 'completed' },
  { id: '5', donorName: 'David Brown', donorPhone: '+234 806 999 0000', donorEmail: 'david@email.com', bloodType: 'O-', appointmentDate: '2024-01-23', appointmentTime: '09:30', status: 'rejected', notes: 'Recent illness' },
];

export const mockBloodInventory: BloodUnit[] = [
  { id: '1', bloodType: 'O+', quantity: 10, donorId: '1', donorName: 'John Doe', collectionDate: '2024-01-10', expiryDate: '2024-02-15', storageLocation: 'Refrigerator A', status: 'available' },
  { id: '2', bloodType: 'O-', quantity: 5, donorId: '2', donorName: 'Jane Smith', collectionDate: '2024-01-12', expiryDate: '2024-02-17', storageLocation: 'Refrigerator A', status: 'available' },
  { id: '3', bloodType: 'A+', quantity: 8, donorId: '3', donorName: 'Michael Johnson', collectionDate: '2024-01-08', expiryDate: '2024-02-13', storageLocation: 'Refrigerator B', status: 'available' },
  { id: '4', bloodType: 'A-', quantity: 3, donorId: '4', donorName: 'Sarah Williams', collectionDate: '2024-01-05', expiryDate: '2024-02-10', storageLocation: 'Refrigerator B', status: 'reserved' },
  { id: '5', bloodType: 'B+', quantity: 6, donorId: '5', donorName: 'David Brown', collectionDate: '2024-01-15', expiryDate: '2024-02-20', storageLocation: 'Refrigerator C', status: 'available' },
  { id: '6', bloodType: 'B-', quantity: 2, donorId: '6', donorName: 'Emily Davis', collectionDate: '2023-12-20', expiryDate: '2024-01-25', storageLocation: 'Refrigerator C', status: 'expired' },
  { id: '7', bloodType: 'AB+', quantity: 4, donorId: '7', donorName: 'Chris Miller', collectionDate: '2024-01-14', expiryDate: '2024-02-19', storageLocation: 'Refrigerator D', status: 'available' },
  { id: '8', bloodType: 'AB-', quantity: 1, donorId: '8', donorName: 'Lisa Wilson', collectionDate: '2024-01-11', expiryDate: '2024-02-16', storageLocation: 'Refrigerator D', status: 'used' },
];

export const mockRecipientRequests: RecipientRequest[] = [
  { id: '1', recipientName: 'Patient A', recipientPhone: '+234 807 111 2222', recipientEmail: 'patientA@email.com', bloodType: 'O+', unitsNeeded: 3, urgency: 'critical', requestDate: '2024-01-18', requiredBy: '2024-01-19', status: 'pending' },
  { id: '2', recipientName: 'Patient B', recipientPhone: '+234 808 333 4444', recipientEmail: 'patientB@email.com', bloodType: 'A-', unitsNeeded: 2, urgency: 'high', requestDate: '2024-01-17', requiredBy: '2024-01-20', status: 'fulfilled', matchedUnits: ['4'] },
  { id: '3', recipientName: 'Patient C', recipientPhone: '+234 809 555 6666', recipientEmail: 'patientC@email.com', bloodType: 'B+', unitsNeeded: 1, urgency: 'medium', requestDate: '2024-01-16', requiredBy: '2024-01-25', status: 'pending' },
  { id: '4', recipientName: 'Patient D', recipientPhone: '+234 810 777 8888', recipientEmail: 'patientD@email.com', bloodType: 'AB-', unitsNeeded: 4, urgency: 'low', requestDate: '2024-01-15', requiredBy: '2024-01-30', status: 'unavailable' },
  { id: '5', recipientName: 'Patient E', recipientPhone: '+234 811 999 0000', recipientEmail: 'patientE@email.com', bloodType: 'O-', unitsNeeded: 2, urgency: 'critical', requestDate: '2024-01-19', requiredBy: '2024-01-19', status: 'partially_fulfilled', matchedUnits: ['2'] },
];

export const mockDonors: Donor[] = [
  { id: '1', name: 'John Doe', email: 'john@email.com', phone: '+234 802 111 2222', bloodType: 'O+', dateOfBirth: '1990-05-15', address: '45 Victoria Island, Lagos', totalDonations: 12, lastDonationDate: '2024-01-10', eligibleToDonateSince: '2024-04-10', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@email.com', phone: '+234 803 333 4444', bloodType: 'A-', dateOfBirth: '1985-08-22', address: '123 Ikeja GRA, Lagos', totalDonations: 8, lastDonationDate: '2024-01-12', eligibleToDonateSince: '2024-04-12', status: 'active' },
  { id: '3', name: 'Michael Johnson', email: 'michael@email.com', phone: '+234 804 555 6666', bloodType: 'B+', dateOfBirth: '1992-03-10', address: '78 Lekki Phase 1, Lagos', totalDonations: 5, lastDonationDate: '2024-01-08', eligibleToDonateSince: '2024-04-08', status: 'active' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@email.com', phone: '+234 805 777 8888', bloodType: 'AB+', dateOfBirth: '1988-11-28', address: '56 Surulere, Lagos', totalDonations: 15, lastDonationDate: '2024-01-05', eligibleToDonateSince: '2024-04-05', status: 'active' },
  { id: '5', name: 'David Brown', email: 'david@email.com', phone: '+234 806 999 0000', bloodType: 'O-', dateOfBirth: '1995-07-03', address: '90 Yaba, Lagos', totalDonations: 3, lastDonationDate: '2023-12-15', eligibleToDonateSince: '2024-03-15', status: 'deferred' },
];

export const mockRecipients: Recipient[] = [
  { id: '1', name: 'Patient A', email: 'patientA@email.com', phone: '+234 807 111 2222', bloodType: 'O+', dateOfBirth: '1980-02-14', address: '12 Marina, Lagos', totalTransfusions: 4, lastTransfusionDate: '2024-01-15', medicalCondition: 'Anemia', status: 'active' },
  { id: '2', name: 'Patient B', email: 'patientB@email.com', phone: '+234 808 333 4444', bloodType: 'A-', dateOfBirth: '1975-09-30', address: '34 Apapa, Lagos', totalTransfusions: 2, lastTransfusionDate: '2024-01-10', medicalCondition: 'Surgery Recovery', status: 'active' },
  { id: '3', name: 'Patient C', email: 'patientC@email.com', phone: '+234 809 555 6666', bloodType: 'B+', dateOfBirth: '1998-12-05', address: '67 Festac, Lagos', totalTransfusions: 1, lastTransfusionDate: '2024-01-08', medicalCondition: 'Accident Trauma', status: 'inactive' },
  { id: '4', name: 'Patient D', email: 'patientD@email.com', phone: '+234 810 777 8888', bloodType: 'AB-', dateOfBirth: '1970-06-18', address: '89 Gbagada, Lagos', totalTransfusions: 6, lastTransfusionDate: '2024-01-05', medicalCondition: 'Chronic Blood Disorder', status: 'active' },
];

// Blood type compatibility data
export const bloodCompatibility: Record<string, string[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

export const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
