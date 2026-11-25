import type {
  CharacterRoleValue,
  KingdomValue,
  VerificationStatusValue,
} from "@/core/constants/cards-catalog";

export function formatStatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(
    Math.max(0, Math.round(value))
  );
}

export function formatCurrencyIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatIdrCurrency = formatCurrencyIdr;

export function formatKingdomLabel(kingdom: KingdomValue): string {
  const labels: Record<KingdomValue, string> = {
    MAJAPAHIT: "Majapahit",
    PAJAJARAN: "Pajajaran",
    NUSANTARA_UMUM: "Nusantara Umum",
    DAHA_KADIRI: "Daha / Kadiri",
    PORTUGIS: "Portugis",
    DEMAK_CIREBON: "Demak–Cirebon",
    BANTEN: "Banten",
  };
  return labels[kingdom];
}

export function formatRoleLabel(role: CharacterRoleValue): string {
  const labels: Record<CharacterRoleValue, string> = {
    PEMIMPIN: "Pemimpin",
    PRAJURIT: "Prajurit",
    PEMUKA: "Pemuka",
    UTUSAN: "Utusan",
    PERAJIN: "Perajin",
  };
  return labels[role] ?? role;
}

export function formatVerificationBadge(
  status: VerificationStatusValue
): string {
  if (status === "VERIFIED") {
    return "Terverifikasi Prasasti / Naskah Primer";
  }
  if (status === "VISUAL_INTERPRETATION") {
    return "Interpretasi Visual Berbasis Tradisi Sejarah";
  }
  return "Dalam Peninjauan Kurator";
}

