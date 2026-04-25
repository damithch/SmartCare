import "dotenv/config";
import { Pool } from "pg";

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_hvNfB60xWmnl@ep-polished-tooth-ana39obz-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const connectDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS smartcare_documents (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (collection, id)
    );

    CREATE INDEX IF NOT EXISTS smartcare_documents_collection_idx
      ON smartcare_documents (collection);
  `);

  console.log("PostgreSQL connected");
};

export default connectDB;
