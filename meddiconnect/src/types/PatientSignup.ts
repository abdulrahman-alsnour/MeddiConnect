export type BloodType =
  | 'A+' | 'A-'
  | 'B+' | 'B-'
  | 'AB+' | 'AB-'
  | 'O+' | 'O-';

export type SmokingStatus =
  | 'Never Smoked'
  | 'Former Smoker'
  | 'Occasional Smoker'
  | 'Regular Smoker'
  | 'Heavy Smoker'
  | 'Prefer Not to Say';

export type AlcoholConsumption =
  | 'Never Drinks'
  | 'Occasionally Drinks (social drinking)'
  | 'Regularly Drinks (weekly)'
  | 'Heavy Drinker'
  | 'Former Drinker'
  | 'Prefer Not to Say';

export type PhysicalActivity =
  | 'Sedentary (Little to no exercise)'
  | 'Lightly Active (Light exercise 1-3 days/week)'
  | 'Moderately Active (Moderate exercise 3-5 days/week)'
  | 'Very Active (Intense exercise 6-7 days/week)'
  | 'Athlete / High-Performance Training'
  | 'Prefer Not to Say';

export type DietaryHabits =
  | 'Balanced Diet (Includes all food groups)'
  | 'Vegetarian'
  | 'Vegan'
  | 'Pescatarian'
  | 'Keto / Low Carb'
  | 'Gluten-Free'
  | 'High Protein'
  | 'Other'
  | 'Prefer Not to Say';

export type MentalHealthCondition =
  | 'No Known Mental Health Conditions'
  | 'Depression'
  | 'Anxiety Disorder (Generalized Anxiety Disorder)'
  | 'Bipolar Disorder'
  | 'Post-Traumatic Stress Disorder (PTSD)'
  | 'Obsessive-Compulsive Disorder (OCD)'
  | 'Schizophrenia'
  | 'Schizoaffective Disorder'
  | 'Attention Deficit Hyperactivity Disorder (ADHD)'
  | 'Autism Spectrum Disorder (ASD)'
  | 'Panic Disorder'
  | 'Social Anxiety Disorder'
  | 'Eating Disorder (e.g., Anorexia, Bulimia)'
  | 'Personality Disorder (e.g., Borderline Personality Disorder)'
  | 'Substance Use Disorder (Alcohol or Drugs)'
  | 'Insomnia / Chronic Sleep Disorder'
  | 'Dementia / Cognitive Decline'
  | "Alzheimer's Disease"
  | 'Adjustment Disorder'
  | 'Psychotic Disorder (Other than Schizophrenia)'
  | 'Other'
  | 'Prefer Not to Say';

export interface MentalHealthMedicationDTO {
  medicationName: string;
  medicationDosage: string;
  medicationFrequency: string;
  medicationStartDate: string; // ISO date string
  medicationEndDate: string;   // ISO date string
  inUse: boolean;
}

export interface CurrentMedicationDTO {
  medicationName: string;
  medicationDosage: string;
  medicationFrequency: string;
  medicationStartDate: string; // ISO date string
  medicationEndDate: string;   // ISO date string
  inUse: boolean;
}

export interface LaboratoryResultDTO {
  testType: string; // Maps to description in backend
  resultUrl?: string | null; // Optional, files uploaded later via profile
}

export interface SignupPatientRequestDTO {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string; // ISO date string
  phoneNumber: string;
  height?: number; // Made nullable to match Java Double
  weight?: number; // Made nullable to match Java Double
  allergies: string;
  medicalConditions: string;
  previousSurgeries: string;
  familyMedicalHistory: string;
  bloodType?: string; // Backend enum as string
  dietaryHabits?: string; // Backend enum as string
  alcoholConsumption?: string; // Backend enum as string
  physicalActivity?: string; // Backend enum as string
  smokingStatus?: string; // Backend enum as string
  mentalHealthCondition?: string; // Backend enum as string
  medications: CurrentMedicationDTO[];
  mentalHealthMedications: MentalHealthMedicationDTO[];
  laboratoryResults?: LaboratoryResultDTO[]; // Optional, lab results with descriptions only
  // Insurance Information
  insuranceProvider?: string;
  insuranceNumber?: string;
} 