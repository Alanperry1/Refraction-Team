import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Patient schema for storing prescription data
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  location: text("location").notNull(),
  dob: text("dob").notNull(),
  age: integer("age").notNull(),
  examDate: text("exam_date").notNull(),
  rightEye: jsonb("right_eye").notNull(),
  leftEye: jsonb("left_eye").notNull(),
  pdType: text("pd_type").notNull(),
  pd: real("pd"),
  pdOd: real("pd_od"),
  pdOs: real("pd_os"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create insert schema without the auto-generated fields
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Extend to allow age to be passed in
export const insertPatientWithAgeSchema = insertPatientSchema.extend({
  age: z.number(),
});

export type InsertPatient = z.infer<typeof insertPatientWithAgeSchema>;
export type Patient = typeof patients.$inferSelect;

// For storing the security PIN
export const securitySettings = pgTable("security_settings", {
  id: serial("id").primaryKey(),
  securityPin: text("security_pin").notNull(),
});

export const insertSecuritySettingsSchema = createInsertSchema(securitySettings).omit({
  id: true,
});

export type InsertSecuritySettings = z.infer<typeof insertSecuritySettingsSchema>;
export type SecuritySettings = typeof securitySettings.$inferSelect;
