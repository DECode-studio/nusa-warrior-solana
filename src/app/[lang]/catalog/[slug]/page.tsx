import React from "react";
import { CatalogDetailView } from "@/client/presentation/views/public";

interface CatalogDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export default async function CatalogDetailPage({
  params,
}: CatalogDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return <CatalogDetailView slug={slug} />;
}
