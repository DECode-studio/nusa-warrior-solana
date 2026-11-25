import "server-only";

export function validateProductionSecurityConfig(): void {
  if (process.env.NODE_ENV !== "production") return;

  const errors: string[] = [];
  const jwtSecret = process.env.JWT_SECRET?.trim() ?? "";
  if (
    jwtSecret.length < 32 ||
    /nusantara-card-super-secret|change-me|replace-with|generate-a-unique/i.test(jwtSecret)
  ) {
    errors.push("JWT_SECRET must be unique and at least 32 characters");
  }
  if (process.env.NUSANTARA_STORAGE_DRIVER !== "prisma") {
    errors.push("NUSANTARA_STORAGE_DRIVER must be prisma");
  }
  if (!process.env.DATABASE_URL?.trim()) {
    errors.push("DATABASE_URL is required");
  }
  try {
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
    if (appUrl.protocol !== "https:" || appUrl.origin === "null") {
      errors.push("NEXT_PUBLIC_APP_URL must use HTTPS");
    }
  } catch {
    errors.push("NEXT_PUBLIC_APP_URL must be an absolute HTTPS URL");
  }
  if ((process.env.ADMIN_USERNAME ?? "").trim().length < 4) {
    errors.push("ADMIN_USERNAME must contain at least 4 characters");
  }
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const bcryptHash = adminPasswordHash.match(/^\$2[aby]\$(\d\d)\$[./A-Za-z0-9]{53}$/);
  if (!bcryptHash || Number(bcryptHash[1]) < 10) {
    errors.push("ADMIN_PASSWORD_HASH must be a valid bcrypt hash");
  }
  if (!/^[a-fA-F0-9]{64}$/.test(process.env.BATTLE_RNG_ENCRYPTION_KEY ?? "")) {
    errors.push("BATTLE_RNG_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters");
  }

  if (errors.length) {
    throw new Error(`Invalid production security configuration: ${errors.join("; ")}`);
  }
}
