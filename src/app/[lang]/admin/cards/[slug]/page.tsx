import React from "react";
import { AdminCardDetailView } from "@/client/presentation/views/admin/cards";

interface AdminCardDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export default async function AdminCardDetailPage({
  params,
}: AdminCardDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return <AdminCardDetailView slug={slug} />;
}
