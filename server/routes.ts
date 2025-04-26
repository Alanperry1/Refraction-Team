import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateAge } from "../client/src/lib/utils";
import { z } from "zod";
import { insertPatientSchema, insertPatientWithAgeSchema, insertSecuritySettingsSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes (login, register, logout, get user)
  setupAuth(app);
  
  // Initialize with a default security PIN if not exists
  const securitySettings = await storage.getSecuritySettings();
  if (!securitySettings) {
    await storage.createSecuritySettings({
      securityPin: "1234" // Default PIN for demonstration
    });
  }
  
  // Create a default admin user if no users exist
  const adminUser = await storage.getUserByUsername("admin");
  if (!adminUser) {
    // Import the password hashing function from auth.ts
    const { hashPassword } = await import("./auth");
    await storage.createUser({
      username: "admin",
      password: await hashPassword("admin")
    });
    console.log("Default admin user created: admin/admin");
  }
  
  // Get all patients
  app.get("/api/patients", async (req, res) => {
    try {
      const patients = await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });
  
  // Get a single patient by ID
  app.get("/api/patients/:id", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const patient = await storage.getPatient(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });
  
  // Create a new patient
  app.post("/api/patients", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertPatientSchema.parse(req.body);
      
      // Calculate age based on date of birth
      const age = calculateAge(validatedData.dob);
      
      // Create the patient
      const newPatient = await storage.createPatient({
        ...validatedData,
        age
      });
      
      res.status(201).json(newPatient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });
  
  // Update a patient
  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      
      // Validate the request body
      const validatedData = insertPatientSchema.parse(req.body);
      
      // Calculate age based on date of birth
      const age = calculateAge(validatedData.dob);
      
      // Update the patient
      const updatedPatient = await storage.updatePatient(patientId, {
        ...validatedData,
        age
      });
      
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(updatedPatient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      }
      
      console.error("Error updating patient:", error);
      res.status(500).json({ message: "Failed to update patient" });
    }
  });
  
  // Update patient status (pending/reviewed)
  app.patch("/api/patients/:id/status", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (status !== "pending" && status !== "reviewed") {
        return res.status(400).json({ message: "Invalid status. Must be 'pending' or 'reviewed'." });
      }
      
      const updatedPatient = await storage.updatePatientStatus(patientId, status);
      
      if (!updatedPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(updatedPatient);
    } catch (error) {
      console.error("Error updating patient status:", error);
      res.status(500).json({ message: "Failed to update patient status" });
    }
  });
  
  // Delete a patient
  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      
      const success = await storage.deletePatient(patientId);
      
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });
  
  // Get security PIN (for verification)
  app.get("/api/security-settings", async (req, res) => {
    try {
      const securitySettings = await storage.getSecuritySettings();
      
      if (!securitySettings) {
        return res.status(404).json({ message: "Security settings not found" });
      }
      
      res.json(securitySettings);
    } catch (error) {
      console.error("Error fetching security settings:", error);
      res.status(500).json({ message: "Failed to fetch security settings" });
    }
  });
  
  // Update security PIN
  app.patch("/api/security-settings", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertSecuritySettingsSchema.parse(req.body);
      
      const updatedSettings = await storage.updateSecuritySettings(validatedData);
      
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid security settings", errors: error.errors });
      }
      
      console.error("Error updating security settings:", error);
      res.status(500).json({ message: "Failed to update security settings" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
