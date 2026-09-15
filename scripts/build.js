const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("==> [TRISHUL VERCEL BUILD] Starting pre-build orchestration...");

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
  console.log("==> [TRISHUL VERCEL BUILD] Set default DATABASE_URL to file:./dev.db");
}

try {
  // 1. Prisma Generate
  console.log("==> [TRISHUL VERCEL BUILD] Running prisma generate...");
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });

  // 2. Prisma DB Push (Ensures SQLite tables are always created on fresh Vercel clone)
  console.log("==> [TRISHUL VERCEL BUILD] Syncing database schema with prisma db push...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });

  // 3. Next.js Build
  console.log("==> [TRISHUL VERCEL BUILD] Running next build...");
  execSync("npx next build", { stdio: "inherit", env: process.env });

  console.log("==> [TRISHUL VERCEL BUILD] Build completed successfully!");
} catch (error) {
  console.error("==> [TRISHUL VERCEL BUILD] Error during build orchestration:", error);
  process.exit(1);
}
