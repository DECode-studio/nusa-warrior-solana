import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import bs58 from "bs58";

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const result = {};
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function decodePrivateKey(raw) {
  if (!raw) return null;
  if (raw.startsWith("[")) {
    return Uint8Array.from(JSON.parse(raw));
  }
  return bs58.decode(raw);
}

const projectRoot = process.cwd();
const envMap = loadEnvFile(path.join(projectRoot, ".env"));
const rawKey =
  process.env.SOLANA_DEPLOYER_PRIVATE_KEY ||
  envMap.SOLANA_DEPLOYER_PRIVATE_KEY ||
  process.env.SOLANA_SETTLER_PRIVATE_KEY ||
  envMap.SOLANA_SETTLER_PRIVATE_KEY;

if (!rawKey) {
  console.error(
    "Error: Set SOLANA_DEPLOYER_PRIVATE_KEY (or SOLANA_SETTLER_PRIVATE_KEY) in .env first."
  );
  process.exit(1);
}

const secretBytes = decodePrivateKey(rawKey.trim());
if (!secretBytes || secretBytes.length !== 64) {
  console.error("Error: Private key must decode to 64 bytes.");
  process.exit(1);
}

const tmpKeypairPath = path.join(
  os.tmpdir(),
  `nusa-auction-deployer-${process.pid}.json`
);
fs.writeFileSync(tmpKeypairPath, JSON.stringify(Array.from(secretBytes)), {
  mode: 0o600,
});

try {
  const anchorBin = fs.existsSync(
    path.join(os.homedir(), ".cargo/bin/anchor")
  )
    ? path.join(os.homedir(), ".cargo/bin/anchor")
    : "anchor";

  const anchorDir = path.join(projectRoot, "programs/nusa-auction");
  console.log("Building and deploying nusa_auction to Devnet...");
  execFileSync(anchorBin, ["build"], { cwd: anchorDir, stdio: "inherit" });
  execFileSync(anchorBin, ["keys", "sync"], { cwd: anchorDir, stdio: "inherit" });
  execFileSync(anchorBin, ["build"], { cwd: anchorDir, stdio: "inherit" });
  execFileSync(
    anchorBin,
    [
      "deploy",
      "--provider.cluster",
      "devnet",
      "--provider.wallet",
      tmpKeypairPath,
    ],
    { cwd: anchorDir, stdio: "inherit" }
  );
} finally {
  if (fs.existsSync(tmpKeypairPath)) {
    fs.unlinkSync(tmpKeypairPath);
  }
}
