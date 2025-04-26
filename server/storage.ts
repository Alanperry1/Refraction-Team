import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  securitySettings, type SecuritySettings, type InsertSecuritySettings
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: InsertPatient): Promise<Patient | undefined>;
  updatePatientStatus(id: number, status: string): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  
  getSecuritySettings(): Promise<SecuritySettings | undefined>;
  createSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings>;
  updateSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patientsMap: Map<number, Patient>;
  private securitySettingsMap: Map<number, SecuritySettings>;
  sessionStore: session.Store;
  currentUserId: number;
  currentPatientId: number;
  currentSecuritySettingsId: number;

  constructor() {
    this.users = new Map();
    this.patientsMap = new Map();
    this.securitySettingsMap = new Map();
    this.currentUserId = 1;
    this.currentPatientId = 1;
    this.currentSecuritySettingsId = 1;
    
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Patient management
  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patientsMap.values()).sort((a, b) => {
      // Sort by created date descending (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patientsMap.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentPatientId++;
    const now = new Date();
    
    const patient: Patient = { 
      ...insertPatient, 
      id,
      status: "pending",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    this.patientsMap.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updateData: InsertPatient): Promise<Patient | undefined> {
    const existingPatient = this.patientsMap.get(id);
    
    if (!existingPatient) {
      return undefined;
    }
    
    const updatedPatient: Patient = {
      ...existingPatient,
      ...updateData,
      id, // Ensure ID remains the same
      updatedAt: new Date().toISOString()
    };
    
    this.patientsMap.set(id, updatedPatient);
    return updatedPatient;
  }

  async updatePatientStatus(id: number, status: string): Promise<Patient | undefined> {
    const existingPatient = this.patientsMap.get(id);
    
    if (!existingPatient) {
      return undefined;
    }
    
    const updatedPatient: Patient = {
      ...existingPatient,
      status: status as "pending" | "reviewed",
      updatedAt: new Date().toISOString()
    };
    
    this.patientsMap.set(id, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    return this.patientsMap.delete(id);
  }

  // Security settings management
  async getSecuritySettings(): Promise<SecuritySettings | undefined> {
    // There should only be one security settings record
    return Array.from(this.securitySettingsMap.values())[0];
  }

  async createSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    const id = this.currentSecuritySettingsId++;
    const securitySettings: SecuritySettings = { ...settings, id };
    this.securitySettingsMap.set(id, securitySettings);
    return securitySettings;
  }

  async updateSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    const existingSettings = await this.getSecuritySettings();
    
    if (existingSettings) {
      const updatedSettings: SecuritySettings = {
        ...existingSettings,
        ...settings
      };
      
      this.securitySettingsMap.set(existingSettings.id, updatedSettings);
      return updatedSettings;
    } else {
      // If no settings exist, create new ones
      return this.createSecuritySettings(settings);
    }
  }
}

// Use DatabaseStorage instead of MemStorage
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
