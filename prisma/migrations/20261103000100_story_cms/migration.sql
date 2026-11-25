CREATE TABLE "story_campaign_content" (
    "id" TEXT NOT NULL,
    "kingdom" "Kingdom" NOT NULL,
    "content" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "story_campaign_content_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "story_media_assets" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "fileBytes" BYTEA NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "story_media_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "story_campaign_content_kingdom_key" ON "story_campaign_content"("kingdom");
CREATE UNIQUE INDEX "story_media_assets_sha256_key" ON "story_media_assets"("sha256");
CREATE INDEX "story_media_assets_createdAt_idx" ON "story_media_assets"("createdAt");

ALTER TABLE "story_campaign_content" ADD CONSTRAINT "story_campaign_content_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "story_media_assets" ADD CONSTRAINT "story_media_assets_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
