// Loads .env for command-line scripts (Next.js does this itself for the website).
import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");
