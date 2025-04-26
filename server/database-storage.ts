import { 
  users, type User, type InsertUser,
  patients, type Patient, type InsertPatient,
  securitySettings, type SecuritySettings, type InsertSecuritySettings
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { pool } from "./db";
import { IStorage } from "./storage";

// Use proper import for connect-pg-simple for PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Patient management
  async getAllPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const now = new Date();
    
    // Calculate age based on dob
    const dob = new Date(insertPatient.dob);
    const ageDate = new Date(now.getTime() - dob.getTime());
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    
    const [patient] = await db.insert(patients).values({
      ...insertPatient,
      age,
      status: "pending",
      createdAt: now,
      updatedAt: now
    }).returning();
    
    return patient;
  }

  async updatePatient(id: number, updateData: InsertPatient): Promise<Patient | undefined> {
    // Calculate age based on dob
    const dob = new Date(updateData.dob);
    const now = new Date();
    const ageDate = new Date(now.getTime() - dob.getTime());
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    
    const [updatedPatient] = await db.update(patients)
      .set({
        ...updateData,
        age,
        updatedAt: now
      })
      .where(eq(patients.id, id))
      .returning();
    
    return updatedPatient;
  }

  async updatePatientStatus(id: number, status: string): Promise<Patient | undefined> {
    const now = new Date();
    
    const [updatedPatient] = await db.update(patients)
      .set({ 
        status: status as "pending" | "reviewed",
        updatedAt: now
      })
      .where(eq(patients.id, id))
      .returning();
    
    return updatedPatient;
  }

  async deletePatient(id: number): Promise<boolean> {
    await db.delete(patients).where(eq(patients.id, id));
    return true; // In Drizzle, if no error is thrown, deletion succeeded
  }

  // Security settings management
  async getSecuritySettings(): Promise<SecuritySettings | undefined> {
    const [settings] = await db.select().from(securitySettings);
    return settings;
  }

  async createSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    const [createdSettings] = await db.insert(securitySettings)
      .values(settings)
      .returning();
    
    return createdSettings;
  }

  async updateSecuritySettings(settings: InsertSecuritySettings): Promise<SecuritySettings> {
    const existingSettings = await this.getSecuritySettings();
    
    if (existingSettings) {
      const [updatedSettings] = await db.update(securitySettings)
        .set(settings)
        .where(eq(securitySettings.id, existingSettings.id))
        .returning();
      
      return updatedSettings;
    } else {
      return await this.createSecuritySettings(settings);
    }
  }
}