import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/core/constants/routes";

export default function RootRedirectPage(): never {
  redirect(`/${DEFAULT_LOCALE}`);
}

