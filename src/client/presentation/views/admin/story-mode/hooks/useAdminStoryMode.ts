"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getService } from "@/core/di/container";
import { STORY_MODE_USECASE_TOKEN } from "@/core/di/tokens";
import type {
  AdminStoryCampaignActionEntity,
  AdminStoryCampaignEntity,
  StoryCampaignContentEntity,
  StoryMediaAssetEntity,
} from "@/client/domain/story-mode/entity/story_mode_entity";
import { useTranslator } from "@/core/translator";
import { ADMIN_STORY_MODE_TEXT_CONSTANT } from "../constants/TextConstant";

function validateCampaign(campaign: StoryCampaignContentEntity, t: (key: string, values?: Record<string, string | number>) => string): string[] {
  const issues: string[] = [];
  const missionIds = new Set<string>();
  const required = (): string => t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_REQUIRED);
  if (!campaign.title.trim()) issues.push(required());
  if (!campaign.subtitle.trim()) issues.push(required());
  if (campaign.missions.length === 0) issues.push(t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_CONTENT));

  campaign.missions.forEach((mission, missionIndex) => {
    const label = t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_MISSION, { number: missionIndex + 1 });
    if (!mission.id.trim()) issues.push(t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_MISSION_ID, { number: missionIndex + 1 }));
    if (missionIds.has(mission.id)) issues.push(t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_MISSION_DUPLICATE, { number: missionIndex + 1 }));
    missionIds.add(mission.id);
    if (!mission.title.trim() || !mission.intro.trim() || !mission.objective.trim() || !mission.ending.trim()) issues.push(`${label}: ${required()}`);
    if (mission.dialogue.length === 0) issues.push(`${label}: ${t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_SCENE)}`);
    if ((mission.choiceAfterSceneIndex !== null && mission.choiceAfterSceneIndex >= mission.dialogue.length) || (mission.choices.length > 0 && mission.choiceAfterSceneIndex === null)) issues.push(`${label}: ${t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_CHOICE_SCENE)}`);
    if (mission.storyDeck.characterSlugs.length < 1 || mission.storyDeck.characterSlugs.length > 10 || mission.storyDeck.instrumentSlugs.length > 10) issues.push(`${label}: ${t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_DECK)}`);
    if (mission.opponentDeck && (mission.opponentDeck.characterSlugs.length < 1 || mission.opponentDeck.characterSlugs.length > 10 || mission.opponentDeck.instrumentSlugs.length > 10)) issues.push(`${label}: ${t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_DECK)}`);
    mission.dialogue.forEach((scene, sceneIndex) => {
      if (!scene.speaker.trim() || !scene.text.trim()) issues.push(`${label}, ${t(ADMIN_STORY_MODE_TEXT_CONSTANT.VALIDATION_SCENE_NUMBER, { number: sceneIndex + 1 })}: ${required()}`);
    });
  });
  return issues;
}

export function useAdminStoryMode() {
  const { t } = useTranslator();
  const [campaigns, setCampaigns] = useState<AdminStoryCampaignEntity[]>([]);
  const [assets, setAssets] = useState<StoryMediaAssetEntity[]>([]);
  const [selectedKingdom, setSelectedKingdom] = useState<"MAJAPAHIT" | "PAJAJARAN">("MAJAPAHIT");
  const selectedKingdomRef = useRef(selectedKingdom);
  selectedKingdomRef.current = selectedKingdom;
  const [draft, setDraft] = useState<StoryCampaignContentEntity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.campaign.kingdom === selectedKingdom) ?? null,
    [campaigns, selectedKingdom],
  );
  const isDirty = Boolean(draft && selectedCampaign && JSON.stringify(draft) !== JSON.stringify(selectedCampaign.campaign));

  const applySavedCampaign = (saved: AdminStoryCampaignEntity, syncDraft = true): void => {
    setCampaigns((current) => current.map((item) => item.campaign.kingdom === saved.campaign.kingdom ? saved : item));
    if (syncDraft && saved.campaign.kingdom === selectedKingdom) setDraft(saved.campaign);
  };

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const service = getService(STORY_MODE_USECASE_TOKEN);
      const [stories, media] = await Promise.all([service.getAdminCampaigns(), service.getAdminAssets()]);
      setCampaigns(stories);
      setAssets(media);
      const selected = stories.find((story) => story.campaign.kingdom === selectedKingdomRef.current) ?? stories[0];
      if (selected) {
        setSelectedKingdom(selected.campaign.kingdom);
        setDraft(selected.campaign);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t(ADMIN_STORY_MODE_TEXT_CONSTANT.LOAD_ERROR));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const preventClose = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventClose);
    return () => window.removeEventListener("beforeunload", preventClose);
  }, [isDirty]);

  const chooseKingdom = (kingdom: "MAJAPAHIT" | "PAJAJARAN"): void => {
    if (kingdom === selectedKingdom) return;
    if (isDirty && !window.confirm(t(ADMIN_STORY_MODE_TEXT_CONSTANT.DISCARD_CONFIRM))) return;
    const selected = campaigns.find((story) => story.campaign.kingdom === kingdom);
    if (!selected) return;
    setError(null);
    setFeedback(null);
    setSelectedKingdom(kingdom);
    setDraft(selected.campaign);
  };

  const updateDraft = (next: StoryCampaignContentEntity): void => {
    setDraft(next);
    setError(null);
  };

  const saveDraft = async (): Promise<AdminStoryCampaignEntity | null> => {
    if (!draft || !selectedCampaign) return null;
    const issues = validateCampaign(draft, t);
    if (issues.length > 0) {
      setError(issues.join("\n"));
      return null;
    }
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const saved = await getService(STORY_MODE_USECASE_TOKEN).saveAdminCampaign(draft, selectedCampaign.version);
      applySavedCampaign(saved);
      setFeedback(t(ADMIN_STORY_MODE_TEXT_CONSTANT.DRAFT_SAVED));
      return saved;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t(ADMIN_STORY_MODE_TEXT_CONSTANT.SAVE_ERROR));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updatePublication = async (action: AdminStoryCampaignActionEntity): Promise<void> => {
    if (!draft || !selectedCampaign) return;
    if (action === "PUBLISH") {
      const issues = validateCampaign(draft, t);
      if (issues.length > 0) {
        setError(issues.join("\n"));
        return;
      }
    }
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const service = getService(STORY_MODE_USECASE_TOKEN);
      const savedDraft = action === "PUBLISH" && isDirty
        ? await service.saveAdminCampaign(draft, selectedCampaign.version)
        : selectedCampaign;
      if (action === "PUBLISH" && isDirty) applySavedCampaign(savedDraft);
      const updated = await service.updateAdminCampaignPublication(
        selectedKingdom,
        action,
        savedDraft.version,
      );
      applySavedCampaign(updated, action === "PUBLISH");
      setFeedback(t(action === "PUBLISH" ? ADMIN_STORY_MODE_TEXT_CONSTANT.PUBLISH_SUCCESS : ADMIN_STORY_MODE_TEXT_CONSTANT.UNPUBLISH_SUCCESS));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t(ADMIN_STORY_MODE_TEXT_CONSTANT.SAVE_ERROR));
    } finally {
      setSaving(false);
    }
  };

  const restorePublishedVersion = (): void => {
    if (!selectedCampaign || !window.confirm(t(ADMIN_STORY_MODE_TEXT_CONSTANT.RESTORE_CONFIRM))) return;
    updateDraft(selectedCampaign.publishedCampaign);
  };

  const upload = async (file: File): Promise<void> => {
    setError(null);
    setFeedback(null);
    try {
      const asset = await getService(STORY_MODE_USECASE_TOKEN).uploadAdminAsset(file);
      setFeedback(`${t(asset.reused ? ADMIN_STORY_MODE_TEXT_CONSTANT.UPLOAD_REUSED : ADMIN_STORY_MODE_TEXT_CONSTANT.UPLOAD_SUCCESS)} ${asset.fileName}`);
      setAssets(await getService(STORY_MODE_USECASE_TOKEN).getAdminAssets());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t(ADMIN_STORY_MODE_TEXT_CONSTANT.UPLOAD_ERROR));
    }
  };

  return {
    campaigns,
    assets,
    selectedKingdom,
    selectedCampaign,
    chooseKingdom,
    draft,
    updateDraft,
    isDirty,
    loading,
    saving,
    error,
    feedback,
    saveDraft,
    updatePublication,
    restorePublishedVersion,
    upload,
    retry: load,
  };
}
