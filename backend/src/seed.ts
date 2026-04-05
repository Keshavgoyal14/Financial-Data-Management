import bcrypt from "bcryptjs";
import { db, initializeDatabase } from "./db";

initializeDatabase();

const now = new Date().toISOString();
const seedDemoUsers = process.env.SEED_DEMO_USERS === "true";

type SeedUserInput = {
  name: string;
  email: string;
  password: string;
  role: "viewer" | "analyst" | "admin";
  status?: "active" | "inactive";
};

type SeedRecordInput = {
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string | null;
  createdByEmail: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseJsonEnv<T>(name: string): T {
  const raw = requireEnv(name);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Invalid JSON in environment variable: ${name}`);
  }
}

async function seed() {
  const userIdByEmail = new Map<string, number>();

  db.transaction(() => {
    db.prepare("DELETE FROM financial_records").run();

    if (seedDemoUsers) {
      db.prepare("DELETE FROM users").run();
      const users = parseJsonEnv<SeedUserInput[]>("SEED_USERS_JSON");

      const insertUser = db.prepare(
        `INSERT INTO users (name, email, password, role, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      for (const user of users) {
        const hashedPassword = bcrypt.hashSync(user.password, 10);
        const result = insertUser.run(
          user.name,
          user.email,
          hashedPassword,
          user.role,
          user.status ?? "active",
          now,
          now
        );
        userIdByEmail.set(user.email, Number(result.lastInsertRowid));
      }
    }

    const insertRecord = db.prepare(
      `INSERT INTO financial_records (amount, type, category, date, notes, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    if (!seedDemoUsers) {
      return;
    }

    const records = parseJsonEnv<SeedRecordInput[]>("SEED_RECORDS_JSON");

    for (const record of records) {
      const createdBy = userIdByEmail.get(record.createdByEmail);
      if (!createdBy) {
        throw new Error(`No seeded user found for record.createdByEmail: ${record.createdByEmail}`);
      }

      insertRecord.run(
        record.amount,
        record.type,
        record.category,
        record.date,
        record.notes ?? null,
        createdBy,
        now,
        now
      );
    }
  })();

  // eslint-disable-next-line no-console
  console.log("Database seeded successfully.");

  if (seedDemoUsers) {
    // eslint-disable-next-line no-console
    console.log("Demo users and records seeded from SEED_USERS_JSON and SEED_RECORDS_JSON.");
  } else {
    // eslint-disable-next-line no-console
    console.log("Demo data was not seeded. Set SEED_DEMO_USERS=true to seed from environment JSON.");
  }
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seeding failed:", error);
  process.exit(1);
});
