import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
} from "node:crypto";
import { AppError } from "@/server/shared/errors/app-error";

export const AUDIT_RNG_ALGORITHM = "HMAC-SHA256-REJECTION-v1";

export interface RngDraw {
  counter: number;
  blocks: number;
  min: number;
  maxExclusive: number;
  value: number;
  label: string;
}

export interface AuditableRandom {
  int(min: number, maxExclusive: number, label: string): number;
  counter: number;
  draws: RngDraw[];
}

export function createBattleSeed(): string {
  return randomBytes(32).toString("hex");
}

export function commitBattleSeed(seed: string): string {
  return createHash("sha256").update(seed, "utf8").digest("hex");
}

export function encryptBattleSeed(seed: string): string {
  const key = getEncryptionKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw AppError.internal("BATTLE_RNG_ENCRYPTION_KEY wajib diatur di production.");
    }
    return `dev:${seed}`;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(seed, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptBattleSeed(value: string): string {
  if (value.startsWith("dev:")) {
    if (process.env.NODE_ENV === "production") {
      throw AppError.internal("Seed RNG development tidak boleh digunakan di production.");
    }
    return value.slice(4);
  }
  const key = getEncryptionKey();
  if (!key) throw AppError.internal("BATTLE_RNG_ENCRYPTION_KEY belum tersedia.");
  const [ivText, tagText, ciphertextText] = value.split(".");
  if (!ivText || !tagText || !ciphertextText) throw AppError.internal("Data seed RNG tidak valid.");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw AppError.internal("Seed RNG tidak dapat didekripsi.");
  }
}

function getEncryptionKey(): Buffer | null {
  const raw = process.env.BATTLE_RNG_ENCRYPTION_KEY;
  if (raw && /^[a-fA-F0-9]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  if (raw && !/^[a-fA-F0-9]{64}$/.test(raw)) {
    throw AppError.internal("BATTLE_RNG_ENCRYPTION_KEY harus berupa 32 byte hex.");
  }
  return null;
}

export function createAuditableRandom(seed: string, startCounter = 0): AuditableRandom {
  let counter = startCounter;
  const draws: RngDraw[] = [];
  return {
    int(min: number, maxExclusive: number, label: string): number {
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(maxExclusive) || maxExclusive <= min) {
        throw new RangeError("Invalid random integer range");
      }
      const range = maxExclusive - min;
      if (range > 0x1_0000_0000) throw new RangeError("Random range is too large");
      const limit = Math.floor(0x1_0000_0000 / range) * range;
      const start = counter;
      let sample: number;
      do {
        const digest = createHmac("sha256", Buffer.from(seed, "hex"))
          .update(`${counter}:${label}`)
          .digest();
        counter += 1;
        sample = digest.readUInt32BE(0);
      } while (sample >= limit);
      const value = min + (sample % range);
      draws.push({ counter: start, blocks: counter - start, min, maxExclusive, value, label });
      return value;
    },
    get counter() {
      return counter;
    },
    draws,
  };
}

export const secureBattleRandomInt = (min: number, maxExclusive: number): number =>
  randomInt(min, maxExclusive);
