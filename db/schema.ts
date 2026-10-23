import { pgTable, serial, text, timestamp, integer, doublePrecision } from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: serial().primaryKey(),
  username: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial().primaryKey(),
  name: text().notNull(),
  category: text().notNull(),
  material: text().notNull().default(""),
  stone: text().notNull().default(""),
  price: doublePrecision().notNull().default(0),
  image: text().notNull().default(""),
  description: text().notNull().default(""),
  stock: integer().notNull().default(0),
  featured: integer().notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const enquiries = pgTable("enquiries", {
  id: serial().primaryKey(),
  name: text().notNull(),
  phone: text().notNull(),
  email: text().notNull().default(""),
  message: text().notNull().default(""),
  status: text().notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
