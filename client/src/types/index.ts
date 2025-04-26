export interface Patient {
  id: number;
  name: string;
  phone: string;
  email: string;
  location: string;
  dob: string;
  age: number;
  examDate: string;
  rightEye: {
    sph: number;
    cyl: number;
    axis: number;
    add: number;
  };
  leftEye: {
    sph: number;
    cyl: number;
    axis: number;
    add: number;
  };
  pdType: "single" | "dual";
  pd?: number;
  pdOd?: number;
  pdOs?: number;
  status: "pending" | "reviewed";
  createdAt: string;
}

export type PatientFormData = Omit<Patient, "id" | "age" | "status" | "createdAt">;

export interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  patientName?: string;
}

export interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  patientName?: string;
}

export interface PatientPrescriptionDisplay {
  patient: Patient;
}

export interface InsertPatient {
  name: string;
  phone: string;
  email: string;
  location: string;
  dob: string;
  examDate: string;
  rightEye: {
    sph: number;
    cyl: number;
    axis: number;
    add: number;
  };
  leftEye: {
    sph: number;
    cyl: number;
    axis: number;
    add: number;
  };
  pdType: "single" | "dual";
  pd?: number;
  pdOd?: number;
  pdOs?: number;
}
