// Shared appointment types for consistency across components

export interface Appointment {
  id: number;
  // Patient information
  patientId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  // Doctor information
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  doctorEmail: string;
  doctorPhone: string;
  doctorProfilePicture?: string;
  // Appointment details
  date: string;
  time: string;
  description: string;
  shareMedicalRecords: boolean;
  isVideoCall?: boolean; // Video call appointment (only for psychiatry doctors)
  isCallActive?: boolean; // Whether the doctor has started the video call
  status: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
  createdAt: string;
  // Optional fields
  doctorNotes?: string;
  medicalRecords?: PatientMedicalRecords;
  // Insurance information (always available for doctors)
  insuranceProvider?: string;
  insuranceNumber?: string;
}

export interface PatientMedicalRecords {
  // Basic Info
  gender: string;
  dateOfBirth: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  
  // Medical History
  allergies?: string;
  medicalConditions?: string;
  previousSurgeries?: string;
  familyMedicalHistory?: string;
  
  // Lifestyle
  dietaryHabits?: string;
  alcoholConsumption?: string;
  physicalActivity?: string;
  smokingStatus?: string;
  mentalHealthCondition?: string;
  
  // Medications
  medications: MedicationData[];
  mentalHealthMedications: MentalHealthMedicationData[];
  
  // Lab Results
  labResults: LabResult[];
}

export interface MedicationData {
  id: number;
  medicationName: string;
  medicationDosage: string;
  medicationFrequency: string;
  medicationStartDate: string;
  medicationEndDate: string;
  inUse: boolean;
}

export interface MentalHealthMedicationData {
  id: number;
  medicationName: string;
  medicationDosage: string;
  medicationFrequency: string;
  medicationStartDate: string;
  medicationEndDate: string;
  inUse: boolean;
}

export interface LabResult {
  id: number;
  description: string;
  hasImage: boolean;
  imageSize: number;
}

export interface DayAvailabilityData {
  dayOfWeek: string;
  enabled: boolean;
  startTime?: string;
  endTime?: string;
}

export interface DoctorData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  bio?: string;
  specializations: string[];
  clinicName?: string;
  consultationFee?: number;
  availableDays?: string[];
  availableTimeStart?: string;
  availableTimeEnd?: string;
  dayAvailabilities?: DayAvailabilityData[];
  appointmentDurationMinutes?: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}
