import React from "react";
import { AdminCardEditView } from "@/client/presentation/views/admin/cards";

interface AdminCardEditPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export default async function AdminCardEditPage({
  params,
}: AdminCardEditPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return <AdminCardEditView slug={slug} />;
}
