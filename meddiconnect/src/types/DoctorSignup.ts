export type SpecializationType =
  | 'INTERNAL_MEDICINE'
  | 'GENERAL_SURGERY'
  | 'PEDIATRICS'
  | 'OBSTETRICS_GYNECOLOGY'
  | 'FAMILY_MEDICINE'
  | 'PSYCHIATRY'
  | 'EMERGENCY_MEDICINE'
  | 'ANESTHESIOLOGY'
  | 'RADIOLOGY'
  | 'PATHOLOGY'
  | 'ORTHOPEDIC_SURGERY'
  | 'NEUROSURGERY'
  | 'CARDIOLOGY'
  | 'DERMATOLOGY'
  | 'NEUROLOGY'
  | 'UROLOGY'
  | 'PLASTIC_SURGERY'
  | 'OPHTHALMOLOGY';

export interface SpecialtyDTO {
  specialtyName: string;
  description: string;
  providerId?: number;  // Optional since it's assigned by backend
  specialityId?: number; // Optional since it's assigned by backend
}

export interface EducationHistoryDTO {
  institutionName: string;
  startDate: string;      // ISO date string
  endDate: string;        // ISO date string
  stillEnrolled: boolean;
}

export interface WorkExperienceDTO {
  organizationName: string;
  roleTitle: string;
  startDate: string;      // ISO date string
  endDate: string;        // ISO date string
  stillWorking: boolean;
}

export interface SignupHPRequestDTO {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string; // ISO date string
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  consultationFee: number;
  bio: string;
  clinicName: string;
  licenseNumber: string;
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
  specializations: SpecializationType[];
  educationHistories: EducationHistoryDTO[];
  workExperiences: WorkExperienceDTO[];
} 