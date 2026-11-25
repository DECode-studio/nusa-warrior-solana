import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { once } from "node:events";
import { createInterface } from "node:readline";
import os from "node:os";
import path from "node:path";
import { Client } from "pg";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // Environment variables may be provided by the shell or deployment platform.
  }
}

type DatabaseIdentity = {
  database: string;
  address: string | null;
  port: number;
};

function requiredUrl(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set`);
  return value;
}

async function inspectDatabase(connectionString: string): Promise<{
  identity: DatabaseIdentity;
  rowCount: number;
  tableNames: string[];
}> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const identityResult = await client.query<DatabaseIdentity>(
      `SELECT current_database() AS database,
              inet_server_addr()::text AS address,
              inet_server_port() AS port`,
    );
    const tables = await client.query<{ table_name: string }>(`
      SELECT tablename AS table_name
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    `);

    let rowCount = 0;
    for (const { table_name: tableName } of tables.rows) {
      const quotedName = `"${tableName.replaceAll('"', '""')}"`;
      const count = await client.query<{ count: string }>(
        `SELECT count(*)::text AS count FROM public.${quotedName}`,
      );
      rowCount += Number(count.rows[0]?.count ?? 0);
    }

    return {
      identity: identityResult.rows[0],
      rowCount,
      tableNames: tables.rows.map(({ table_name: tableName }) => tableName),
    };
  } finally {
    await client.end();
  }
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", (error) => {
      reject(new Error(`Could not start ${command}: ${error.message}`));
    });
    child.once("close", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed (${signal ?? `exit ${code}`})`));
    });
  });
}

async function removeUnsupportedTransactionTimeout(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const lines = createInterface({ input: createReadStream(inputPath), crlfDelay: Infinity });
  const output = createWriteStream(outputPath);
  try {
    for await (const line of lines) {
      if (/^\s*SET\s+transaction_timeout\s*=\s*0\s*;\s*$/i.test(line)) continue;
      if (!output.write(`${line}\n`)) await once(output, "drain");
    }
    output.end();
    await once(output, "finish");
  } catch (error) {
    output.destroy();
    throw error;
  }
}

async function main(): Promise<void> {
  const sourceUrl = requiredUrl("LEGACY_DATABASE_URL");
  const targetUrl = requiredUrl("DATABASE_URL");
  const [source, target] = await Promise.all([
    inspectDatabase(sourceUrl),
    inspectDatabase(targetUrl),
  ]);

  const isSameDatabase =
    source.identity.database === target.identity.database &&
    source.identity.address === target.identity.address &&
    source.identity.port === target.identity.port;
  if (isSameDatabase) {
    throw new Error("LEGACY_DATABASE_URL and DATABASE_URL point to the same database");
  }
  if (target.rowCount > 0) {
    throw new Error(
      `Target database is not empty (${target.rowCount} rows found); refusing to import`,
    );
  }
  if (target.tableNames.length > 0) {
    throw new Error(
      `Target database already has application tables: ${target.tableNames.join(", ")}; refusing to import`,
    );
  }
  if (source.rowCount === 0) {
    throw new Error("Legacy database has no application data to migrate");
  }

  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nusa-db-migration-"));
  const dumpPath = path.join(tempDirectory, "legacy.dump");
  const restorePath = path.join(tempDirectory, "restore.sql");
  const compatibleRestorePath = path.join(tempDirectory, "restore-compatible.sql");
  try {
    console.log(`Exporting ${source.identity.database} (${source.rowCount} rows)...`);
    await run("pg_dump", [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      "--exclude-table=public._prisma_migrations",
      "--dbname",
      sourceUrl,
      "--file",
      dumpPath,
    ]);

    await run("pg_restore", [
      "--no-owner",
      "--no-privileges",
      "--file",
      restorePath,
      dumpPath,
    ]);
    await removeUnsupportedTransactionTimeout(restorePath, compatibleRestorePath);

    console.log(`Restoring legacy schema and data into ${target.identity.database}...`);
    await run("psql", [
      "--set",
      "ON_ERROR_STOP=1",
      "--single-transaction",
      "--dbname",
      targetUrl,
      "--file",
      compatibleRestorePath,
    ]);
    console.log("Database data migration completed.");
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Database migration failed");
  process.exitCode = 1;
});
