import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const url = process.env.POSTGRES_URL;
if (!url) { console.log("No POSTGRES_URL set â€” local file store will be used. Nothing to migrate."); process.exit(0); }
const { default: postgres } = await import("postgres");
const sql = postgres(url, { ssl: "require", max: 1 });
const { SCHEMA } = await import("../lib/schema.mjs");
for (const stmt of SCHEMA) { await sql.unsafe(stmt); }
console.log("Migration complete: all tables ready.");
await sql.end();