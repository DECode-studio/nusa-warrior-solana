import React from "react";
import { redirect } from "next/navigation";
import { AdminPaymentGatewayView } from "@/client/presentation/views/admin/payment-gateway";
import { DEFAULT_LOCALE, isSupportedLocale, ROUTES } from "@/core/constants/routes";
import { getCurrentSession } from "@/server/shared/auth/session";

export default async function AdminPaymentGatewayPage({ params }: { params: Promise<{ lang: string }> }): Promise<React.ReactElement> {
  const { lang } = await params;
  const locale = isSupportedLocale(lang) ? lang : DEFAULT_LOCALE;
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") redirect(ROUTES.ADMIN_DASHBOARD(locale));
  return <AdminPaymentGatewayView />;
}
