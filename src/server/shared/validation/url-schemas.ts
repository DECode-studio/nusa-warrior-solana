import { z } from "zod";

export const httpUrlSchema = z
  .string()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "URL harus menggunakan HTTP atau HTTPS.");
