import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
  path: process.env.NODE_ENV === "production" ? ".env.production.local" : ".env.local",
});

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
