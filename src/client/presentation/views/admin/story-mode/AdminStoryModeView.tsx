"use client";

import React, { useState } from "react";
import { Eye, Globe2, RotateCcw, Save } from "lucide-react";
import { Button, IntellioCard, SelectField } from "@/client/presentation/components/ui";
import { useTranslator } from "@/core/translator";
import { ADMIN_STORY_MODE_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_STORY_MODE_TEXT_CONSTANT } from "./constants/TextConstant";
import { AdminStoryEditor, StoryPreviewModal } from "./components";
import { useAdminStoryMode } from "./hooks/useAdminStoryMode";

export function AdminStoryModeView(): React.ReactElement {
  const { t, locale } = useTranslator();
  const story = useAdminStoryMode();
  const [previewMode, setPreviewMode] = useState<"draft" | "published" | null>(null);
  const campaign = story.selectedCampaign;

  if (story.loading) {
    return <main id={ADMIN_STORY_MODE_SEMANTIC_IDS.ROOT} className="space-y-6 text-white"><p className="text-sm text-subtle">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.LOADING)}</p></main>;
  }

  return (
    <main id={ADMIN_STORY_MODE_SEMANTIC_IDS.ROOT} className="space-y-6 text-white">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">STORY CMS</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.TITLE)}</h1>
        <p className="mt-2 max-w-3xl text-sm text-subtle">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.DESCRIPTION)}</p>
      </header>

      <IntellioCard variant="flat" padding="sm" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(15rem,0.6fr)_minmax(0,1fr)] lg:items-end">
          <SelectField
            id={ADMIN_STORY_MODE_SEMANTIC_IDS.KINGDOM_SELECT}
            label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.KINGDOM)}
            value={story.selectedKingdom}
            onChange={(event) => story.chooseKingdom(event.currentTarget.value as "MAJAPAHIT" | "PAJAJARAN")}
            options={[{ value: "MAJAPAHIT", label: "Majapahit" }, { value: "PAJAJARAN", label: "Pajajaran" }]}
            containerClassName="max-w-sm"
          />
          {campaign && <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold ${campaign.published ? "border-emerald/40 bg-emerald/10 text-emerald-light" : "border-amber/40 bg-amber/10 text-amber-light"}`}>
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t(campaign.published ? ADMIN_STORY_MODE_TEXT_CONSTANT.PUBLISHED : ADMIN_STORY_MODE_TEXT_CONSTANT.DRAFT)}
            </span>
            {campaign.hasDraft && <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-light">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.HAS_DRAFT)}</span>}
            {story.isDirty && <span role="status" className="rounded-full border border-amber/30 bg-amber/10 px-3 py-1.5 text-xs font-semibold text-amber-light">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.UNSAVED)}</span>}
            <span className="px-1 text-xs text-subtle">v{campaign.version}</span>
          </div>}
        </div>
        {campaign && <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-4">
          <Button variant="secondary" shape="rounded" disabled={story.saving} onClick={() => setPreviewMode("draft")} leftIcon={<Eye className="h-4 w-4" />}>{t(ADMIN_STORY_MODE_TEXT_CONSTANT.PREVIEW_DRAFT)}</Button>
          <Button variant="secondary" shape="rounded" disabled={story.saving} onClick={() => setPreviewMode("published")} leftIcon={<Eye className="h-4 w-4" />}>{t(ADMIN_STORY_MODE_TEXT_CONSTANT.PREVIEW_PUBLISHED)}</Button>
          {(campaign.hasDraft || story.isDirty) && <Button variant="ghost" shape="rounded" disabled={story.saving} onClick={story.restorePublishedVersion} leftIcon={<RotateCcw className="h-4 w-4" />}>{t(ADMIN_STORY_MODE_TEXT_CONSTANT.RESTORE_PUBLISHED)}</Button>}
          <span className="flex-1" />
          <Button id={ADMIN_STORY_MODE_SEMANTIC_IDS.SAVE} variant="secondary" shape="rounded" disabled={story.saving || !story.isDirty} isLoading={story.saving} onClick={() => void story.saveDraft()} leftIcon={<Save className="h-4 w-4" />}>{t(story.saving ? ADMIN_STORY_MODE_TEXT_CONSTANT.SAVING : ADMIN_STORY_MODE_TEXT_CONSTANT.SAVE_DRAFT)}</Button>
          {campaign.published ? <Button variant="danger" shape="rounded" disabled={story.saving} onClick={() => { if (window.confirm(t(ADMIN_STORY_MODE_TEXT_CONSTANT.UNPUBLISH_CONFIRM))) void story.updatePublication("UNPUBLISH"); }}>{t(ADMIN_STORY_MODE_TEXT_CONSTANT.UNPUBLISH)}</Button> : null}
          {(!campaign.published || campaign.hasDraft || story.isDirty) && <Button variant="primary" shape="rounded" disabled={story.saving} isLoading={story.saving} onClick={() => { if (window.confirm(t(ADMIN_STORY_MODE_TEXT_CONSTANT.PUBLISH_CONFIRM))) void story.updatePublication("PUBLISH"); }}>{t(ADMIN_STORY_MODE_TEXT_CONSTANT.PUBLISH)}</Button>}
        </div>}
      </IntellioCard>

      {story.error && <div role="alert" aria-live="assertive" className="whitespace-pre-line rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger-light">{story.error}<button type="button" onClick={() => { if (window.confirm(t(ADMIN_STORY_MODE_TEXT_CONSTANT.DISCARD_CONFIRM))) void story.retry(); }} className="ml-3 font-bold underline">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.RETRY)}</button></div>}
      {story.feedback && <p role="status" className="rounded-xl border border-emerald/40 bg-emerald/10 p-3 text-sm text-emerald-light">{story.feedback}</p>}

      {campaign && story.draft && <AdminStoryEditor key={campaign.campaign.kingdom} campaign={story.draft} assets={story.assets} onDraftChange={story.updateDraft} onUpload={story.upload} />}

      {campaign && <StoryPreviewModal
        campaign={previewMode === "published" ? campaign.publishedCampaign : campaign.campaign}
        title={`${t(previewMode === "published" ? ADMIN_STORY_MODE_TEXT_CONSTANT.PREVIEW_PUBLISHED : ADMIN_STORY_MODE_TEXT_CONSTANT.PREVIEW_DRAFT)} · ${campaign.campaign.title}`}
        isOpen={previewMode !== null}
        locale={locale}
        onClose={() => setPreviewMode(null)}
      />}
    </main>
  );
}
