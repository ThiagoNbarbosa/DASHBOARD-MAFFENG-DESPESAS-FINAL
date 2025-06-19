import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function addStatusColumn() {
  try {
    console.log("Adding status column to expenses table...");
    
    // Add the status column with default value 'active'
    await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`;
    
    console.log("Status column added successfully!");
  } catch (error) {
    console.error("Error adding status column:", error);
  }
}

addStatusColumn();