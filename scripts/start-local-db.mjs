import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pgCtl = path.join(root, "node_modules/@embedded-postgres/linux-x64/native/bin/pg_ctl");
const dataDir = path.join(root, "data/db");
const logFile = path.join(dataDir, "logfile");

if (existsSync(pgCtl) && existsSync(dataDir)) {
  try {
    execSync(`"${pgCtl}" -D "${dataDir}" status`, { stdio: "ignore" });
    console.log("✓ Local PostgreSQL database is running.");
  } catch {
    console.log("Starting local PostgreSQL database...");
    execSync(`"${pgCtl}" -D "${dataDir}" -l "${logFile}" start`, { stdio: "inherit" });
    console.log("✓ Local PostgreSQL database started.");
  }
}
