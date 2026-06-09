import dotenv from "dotenv";
import pg from "pg";
import path from "path";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const pool = new pg.Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || "5432"),
});

export default pool;
