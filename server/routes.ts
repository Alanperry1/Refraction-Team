import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateAge } from "../client/src/lib/utils";
import { z } from "zod";
import { insertPatientSchema, insertPatientWithAgeSchema, insertSecuritySettingsSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import Mailjet from 'node-mailjet';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes (login, register, logout, get user)
  setupAuth(app);
  
  // Initialize Mailjet if API keys are present
  let mailjetClient: any = null;
  if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
    mailjetClient = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );
    console.log("Mailjet initialized with API keys");
  } else {
    console.log("Mailjet API keys not found. Email functionality will be simulated.");
  }
  
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
      const patientWithAge = insertPatientWithAgeSchema.parse({
        ...validatedData,
        age
      });
      
      const newPatient = await storage.createPatient(patientWithAge);
      
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
      
      // Parse with extended schema to include age
      const patientWithAge = insertPatientWithAgeSchema.parse({
        ...validatedData,
        age
      });
      
      // Update the patient
      const updatedPatient = await storage.updatePatient(patientId, patientWithAge);
      
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
  
  // Verify doctor PIN
  app.post("/api/verify-doctor", async (req, res) => {
    try {
      const { pin } = req.body;
      
      if (!pin) {
        return res.status(400).json({ message: "PIN is required" });
      }
      
      const securitySettings = await storage.getSecuritySettings();
      
      if (!securitySettings) {
        return res.status(404).json({ message: "Security settings not found" });
      }
      
      const isValid = pin === securitySettings.securityPin;
      
      if (!isValid) {
        return res.status(403).json({ message: "Invalid PIN" });
      }
      
      // Set a session flag to indicate verified doctor
      if (req.session) {
        req.session.isDoctorVerified = true;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying doctor PIN:", error);
      res.status(500).json({ message: "Failed to verify doctor PIN" });
    }
  });
  
  // Check if doctor is verified
  app.get("/api/doctor-status", (req, res) => {
    const isVerified = req.session?.isDoctorVerified === true;
    res.json({ verified: isVerified });
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
  
  // Send Email via Mailjet
  app.post("/api/email/send", async (req, res) => {
    // Check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { to, subject, html, patientName } = req.body;
      
      // Validate required fields
      if (!to || !subject || !html) {
        return res.status(400).json({ message: "Missing required fields: to, subject, html" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // If Mailjet API keys not configured, simulate sending
      if (!mailjetClient) {
        console.log(`Simulating email send to ${to} for ${patientName}`);
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return res.status(200).json({ 
          message: "Email simulated successfully",
          simulated: true
        });
      }
      
      // Prepare the email message for Mailjet
      const data = {
        Messages: [
          {
            From: {
              Email: "no-reply@therefractionapp.com",
              Name: "The Refraction Team"
            },
            To: [
              {
                Email: to,
                Name: patientName || "Patient"
              }
            ],
            Subject: subject,
            HTMLPart: html
          }
        ]
      };
      
      // Send the email using Mailjet
      const result = await mailjetClient.post("send", { version: "v3.1" }).request(data);
      console.log(`Email sent to ${to} for ${patientName}`);
      
      res.status(200).json({ 
        message: "Email sent successfully", 
        mailjetResponse: result.body
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ 
        message: "Failed to send email", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
