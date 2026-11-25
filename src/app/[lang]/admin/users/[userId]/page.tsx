import React from "react";
import { AdminUserDetailView } from "@/client/presentation/views/admin/users";

interface AdminUserDetailPageProps {
  params: Promise<{ lang: string; userId: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps): Promise<React.ReactElement> {
  const { userId } = await params;
  return <AdminUserDetailView userId={userId} />;
}
