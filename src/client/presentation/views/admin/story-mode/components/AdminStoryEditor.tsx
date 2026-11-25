"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { IntellioCard } from "@/client/presentation/components/ui";
import type {
  StoryCampaignContentEntity,
  StoryChoiceEntity,
  StoryDialogueLineEntity,
  StoryMediaAssetEntity,
  StoryMissionContentEntity,
  StoryTextTranslations,
} from "@/client/domain/story-mode/entity/story_mode_entity";
import { ALL_CARDS_CATALOG } from "@/core/constants/cards-catalog";
import { API_ROUTES } from "@/core/constants/api-routes";
import { useTranslator } from "@/core/translator";
import type { SupportedLocale } from "@/core/constants/routes";
import { ADMIN_STORY_MODE_SEMANTIC_IDS } from "../constants/SemanticIdConstant";
import { ADMIN_STORY_MODE_TEXT_CONSTANT } from "../constants/TextConstant";
import { STORY_PUBLIC_SCENE_BACKGROUNDS, STORY_PUBLIC_SOUNDTRACKS } from "../constants/StoryMediaConstant";
import { LocalizedTextField } from "./LocalizedTextField";
import { StoryAssetPicker } from "./StoryAssetPicker";

interface AdminStoryEditorProps {
  readonly campaign: StoryCampaignContentEntity;
  readonly assets: readonly StoryMediaAssetEntity[];
  readonly onDraftChange: (campaign: StoryCampaignContentEntity) => void;
  readonly onUpload: (file: File) => Promise<void>;
}

const FIELD_CLASS = "w-full rounded-xl border border-primary/25 bg-surface-elevated px-3 py-2.5 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
const MUTED_BUTTON = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface-base px-2.5 text-xs font-bold text-cream transition hover:border-primary/50 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40";

function makeScene(): StoryDialogueLineEntity {
  return { speaker: "Narator", text: "Tulis narasi adegan...", location: "", characterCardSlug: null, backgroundUrl: null, backgroundAssetId: null, soundEffectAssetId: null };
}

function createChoice(index: number): StoryChoiceEntity {
  return { id: `choice-${Date.now()}-${index + 1}`, label: "Pilihan baru", consequence: "Jelaskan dampak pilihan ini." };
}

function makeMission(kingdom: StoryCampaignContentEntity["kingdom"], chapter: number): StoryMissionContentEntity | null {
  const character = ALL_CARDS_CATALOG.find((card) => card.cardType === "CHARACTER" && card.kingdom === kingdom && card.publicationStatus === "ACTIVE");
  if (!character) return null;
  return {
    id: `chapter-${chapter}-mission-${Date.now()}`,
    title: "Misi baru",
    chapter,
    kind: "STORY",
    intro: "Tulis pengantar misi.",
    historicalNote: "",
    soundtrackUrl: STORY_PUBLIC_SOUNDTRACKS[0]?.url,
    dialogue: [makeScene()],
    choiceAfterSceneIndex: null,
    storyDeck: { characterSlugs: [character.slug], instrumentSlugs: [] },
    objective: "Tulis tujuan misi.",
    opponentTitle: "Lawan",
    choices: [],
    replayPointBase: 20,
    endingTitle: "",
    ending: "Tulis narasi penutup misi.",
  };
}

function cardName(slug: string): string {
  return ALL_CARDS_CATALOG.find((card) => card.slug === slug)?.name ?? slug;
}

function missingTranslationCount(campaign: StoryCampaignContentEntity, locale: SupportedLocale): number {
  if (locale === "id") return 0;
  const missing: boolean[] = [
    Boolean(campaign.title.trim()) && !campaign.translations?.title?.[locale],
    Boolean(campaign.subtitle.trim()) && !campaign.translations?.subtitle?.[locale],
  ];
  for (const mission of campaign.missions) {
    missing.push(
      Boolean(mission.title.trim()) && !mission.translations?.title?.[locale],
      Boolean(mission.intro.trim()) && !mission.translations?.intro?.[locale],
      Boolean(mission.objective.trim()) && !mission.translations?.objective?.[locale],
      Boolean(mission.opponentTitle.trim()) && !mission.translations?.opponentTitle?.[locale],
      Boolean(mission.ending.trim()) && !mission.translations?.ending?.[locale],
    );
    if (mission.endingTitle?.trim()) missing.push(!mission.translations?.endingTitle?.[locale]);
    for (const scene of mission.dialogue) {
      missing.push(
        Boolean(scene.speaker.trim()) && !scene.translations?.speaker?.[locale],
        Boolean(scene.text.trim()) && !scene.translations?.text?.[locale],
      );
      if (scene.location?.trim()) missing.push(!scene.translations?.location?.[locale]);
    }
    for (const choice of mission.choices) {
      missing.push(
        Boolean(choice.label.trim()) && !choice.translations?.label?.[locale],
        Boolean(choice.consequence.trim()) && !choice.translations?.consequence?.[locale],
      );
    }
  }
  return missing.filter(Boolean).length;
}

interface DeckCardsEditorProps {
  readonly title: string;
  readonly cardType: "CHARACTER" | "INSTRUMENT";
  readonly kingdom?: StoryCampaignContentEntity["kingdom"];
  readonly slugs: readonly string[];
  readonly onChange: (slugs: string[]) => void;
  readonly t: (key: string, values?: Record<string, string | number>) => string;
}

function DeckCardsEditor({ title, cardType, kingdom, slugs, onChange, t }: DeckCardsEditorProps): React.ReactElement {
  const [selectedSlug, setSelectedSlug] = useState("");
  const options = ALL_CARDS_CATALOG.filter((card) => card.cardType === cardType && card.publicationStatus === "ACTIVE" && (!kingdom || card.kingdom === kingdom));
  const addCard = (): void => {
    if (!selectedSlug || slugs.length >= 10) return;
    onChange([...slugs, selectedSlug]);
    setSelectedSlug("");
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-cream">{title} <span className="font-normal text-subtle">{slugs.length}/10</span></p>
      <div className="flex gap-2">
        <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.currentTarget.value)} className={`${FIELD_CLASS} min-w-0 flex-1`}>
          <option value="">—</option>
          {options.map((card) => <option key={card.slug} value={card.slug}>{card.name} · {card.kingdom}</option>)}
        </select>
        <button type="button" disabled={!selectedSlug || slugs.length >= 10} onClick={addCard} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.ADD_CARD)} className={MUTED_BUTTON}><Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.ADD_CARD)}</span></button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {slugs.map((slug, index) => <li key={`${slug}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-3 pr-1 text-xs text-cream">
          <span className="max-w-48 truncate">{cardName(slug)}</span>
          <button type="button" aria-label={`${t(ADMIN_STORY_MODE_TEXT_CONSTANT.REMOVE)} ${cardName(slug)}`} onClick={() => onChange(slugs.filter((_, currentIndex) => currentIndex !== index))} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-danger-light hover:bg-danger/15"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
        </li>)}
      </ul>
    </div>
  );
}

export function AdminStoryEditor({ campaign, assets, onDraftChange, onUpload }: AdminStoryEditorProps): React.ReactElement {
  const { t } = useTranslator();
  const [locale, setLocale] = useState<SupportedLocale>("id");
  const [missionIndex, setMissionIndex] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const mission = campaign.missions[missionIndex] ?? null;
  const scene = mission?.dialogue[sceneIndex] ?? null;
  const playerCharacters = useMemo(() => ALL_CARDS_CATALOG.filter((card) => card.cardType === "CHARACTER" && card.kingdom === campaign.kingdom && card.publicationStatus === "ACTIVE"), [campaign.kingdom]);
  const activeMissionIndex = Math.min(missionIndex, Math.max(0, campaign.missions.length - 1));

  const updateCampaign = (updater: (current: StoryCampaignContentEntity) => StoryCampaignContentEntity): void => onDraftChange(updater(campaign));
  const updateMission = (next: StoryMissionContentEntity): void => updateCampaign((current) => ({ ...current, missions: current.missions.map((item, index) => index === activeMissionIndex ? next : item) }));
  const updateScene = (next: StoryDialogueLineEntity): void => {
    if (!mission) return;
    updateMission({ ...mission, dialogue: mission.dialogue.map((item, index) => index === sceneIndex ? next : item) });
  };

  const localizedCampaign = (field: "title" | "subtitle", value: string, translations: StoryTextTranslations): void => {
    updateCampaign((current) => ({ ...current, [field]: value, translations: { ...current.translations, [field]: translations } }));
  };
  const localizedMission = (field: "title" | "intro" | "objective" | "opponentTitle" | "endingTitle" | "ending", value: string, translations: StoryTextTranslations): void => {
    if (!mission) return;
    updateMission({ ...mission, [field]: value, translations: { ...mission.translations, [field]: translations } });
  };
  const localizedScene = (field: "speaker" | "text" | "location", value: string, translations: StoryTextTranslations): void => {
    if (!scene) return;
    updateScene({ ...scene, [field]: value, translations: { ...scene.translations, [field]: translations } });
  };

  const addMission = (): void => {
    const next = makeMission(campaign.kingdom, Math.max(0, ...campaign.missions.map((item) => item.chapter)) + 1);
    if (!next) return;
    updateCampaign((current) => ({ ...current, missions: [...current.missions, next] }));
    setMissionIndex(campaign.missions.length);
    setSceneIndex(0);
  };
  const removeMission = (): void => {
    if (!mission || campaign.missions.length <= 1 || !window.confirm(t(ADMIN_STORY_MODE_TEXT_CONSTANT.DELETE_MISSION) + "?")) return;
    updateCampaign((current) => ({ ...current, missions: current.missions.filter((_, index) => index !== activeMissionIndex) }));
    setMissionIndex(Math.max(0, activeMissionIndex - 1));
    setSceneIndex(0);
  };
  const moveMission = (direction: -1 | 1): void => {
    const destination = activeMissionIndex + direction;
    if (destination < 0 || destination >= campaign.missions.length) return;
    updateCampaign((current) => {
      const missions = [...current.missions];
      const [moving] = missions.splice(activeMissionIndex, 1);
      if (!moving) return current;
      missions.splice(destination, 0, moving);
      return { ...current, missions };
    });
    setMissionIndex(destination);
  };
  const addScene = (): void => {
    if (!mission || mission.dialogue.length >= 80) return;
    updateMission({ ...mission, dialogue: [...mission.dialogue, makeScene()] });
    setSceneIndex(mission.dialogue.length);
  };
  const duplicateScene = (): void => {
    if (!mission || !scene || mission.dialogue.length >= 80) return;
    const nextDialogue = [...mission.dialogue];
    nextDialogue.splice(sceneIndex + 1, 0, { ...scene, translations: scene.translations ? { ...scene.translations } : undefined });
    const decisionIndex = mission.choiceAfterSceneIndex;
    updateMission({ ...mission, dialogue: nextDialogue, choiceAfterSceneIndex: decisionIndex !== null && decisionIndex > sceneIndex ? decisionIndex + 1 : decisionIndex });
    setSceneIndex(sceneIndex + 1);
  };
  const deleteScene = (): void => {
    if (!mission || mission.dialogue.length <= 1 || !window.confirm(t(ADMIN_STORY_MODE_TEXT_CONSTANT.DELETE_SCENE) + "?")) return;
    const nextDialogue = mission.dialogue.filter((_, index) => index !== sceneIndex);
    const decisionIndex = mission.choiceAfterSceneIndex;
    const nextDecisionIndex = decisionIndex === null ? null : decisionIndex === sceneIndex ? Math.min(sceneIndex, nextDialogue.length - 1) : decisionIndex > sceneIndex ? decisionIndex - 1 : decisionIndex;
    updateMission({ ...mission, dialogue: nextDialogue, choiceAfterSceneIndex: nextDecisionIndex });
    setSceneIndex(Math.min(sceneIndex, nextDialogue.length - 1));
  };
  const moveScene = (direction: -1 | 1): void => {
    if (!mission) return;
    const destination = sceneIndex + direction;
    if (destination < 0 || destination >= mission.dialogue.length) return;
    const dialogue = [...mission.dialogue];
    const [moving] = dialogue.splice(sceneIndex, 1);
    if (!moving) return;
    dialogue.splice(destination, 0, moving);
    let choiceIndex = mission.choiceAfterSceneIndex;
    if (choiceIndex === sceneIndex) choiceIndex = destination;
    else if (choiceIndex !== null && sceneIndex < choiceIndex && destination >= choiceIndex) choiceIndex -= 1;
    else if (choiceIndex !== null && sceneIndex > choiceIndex && destination <= choiceIndex) choiceIndex += 1;
    updateMission({ ...mission, dialogue, choiceAfterSceneIndex: choiceIndex });
    setSceneIndex(destination);
  };
  const updateChoice = (index: number, next: StoryChoiceEntity): void => {
    if (!mission) return;
    updateMission({ ...mission, choices: mission.choices.map((item, choiceIndex) => choiceIndex === index ? next : item) });
  };
  const addChoice = (): void => {
    if (!mission || mission.choices.length >= 8) return;
    const nextChoices = [...mission.choices, createChoice(mission.choices.length)];
    updateMission({ ...mission, choices: nextChoices, choiceAfterSceneIndex: Math.min(sceneIndex, mission.dialogue.length - 1) });
  };
  const deleteChoice = (index: number): void => {
    if (!mission) return;
    updateMission({ ...mission, choices: mission.choices.filter((_, choiceIndex) => choiceIndex !== index), choiceAfterSceneIndex: mission.choices.length <= 1 ? null : mission.choiceAfterSceneIndex });
  };

  return (
    <div id={ADMIN_STORY_MODE_SEMANTIC_IDS.CONTENT_EDITOR} className="space-y-5">
      <IntellioCard as="section" variant="elevated" padding="md" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-display text-lg font-bold text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.CAMPAIGN)}</h2><p className="mt-1 text-xs text-subtle">{campaign.kingdom}</p></div>
          <div className="flex items-center gap-1 rounded-xl border border-border-subtle bg-surface-base p-1">
            {(["id", "en", "zh"] as const).map((language) => {
              const missingCount = missingTranslationCount(campaign, language);
              return <button key={language} type="button" aria-pressed={locale === language} onClick={() => setLocale(language)} className={`min-h-9 rounded-lg px-3 text-xs font-bold uppercase ${locale === language ? "bg-primary text-white" : "text-subtle hover:bg-white/5 hover:text-white"}`}>
                {language}{language !== "id" ? <span className={`ml-1.5 text-[10px] ${missingCount > 0 ? "text-amber-light" : "text-emerald-light"}`}>{missingCount}</span> : null}
              </button>;
            })}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.45fr)]">
          <LocalizedTextField id="story-campaign-title" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.CAMPAIGN_TITLE)} value={campaign.title} translations={campaign.translations?.title} locale={locale} onChange={(value, translations) => localizedCampaign("title", value, translations)} />
          <LocalizedTextField id="story-campaign-subtitle" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.SUBTITLE)} value={campaign.subtitle} translations={campaign.translations?.subtitle} locale={locale} multiline rows={2} onChange={(value, translations) => localizedCampaign("subtitle", value, translations)} />
        </div>
        <label className="flex max-w-xs items-center gap-3 text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.ACCENT)}<input type="color" value={campaign.accent} onChange={(event) => updateCampaign((current) => ({ ...current, accent: event.currentTarget.value }))} className="h-10 w-16 cursor-pointer rounded border border-white/15 bg-transparent p-1" /></label>
      </IntellioCard>

      <div className="grid items-start gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <IntellioCard as="section" variant="flat" padding="sm" className="space-y-3 xl:sticky xl:top-4">
          <div className="flex items-center justify-between gap-2"><h2 className="font-display text-base font-bold text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.MISSION_LIST)}</h2><button type="button" onClick={addMission} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-bold text-white hover:bg-primary/85"><Plus className="h-4 w-4" aria-hidden="true" />{t(ADMIN_STORY_MODE_TEXT_CONSTANT.NEW_MISSION)}</button></div>
          <ol className="max-h-[65dvh] space-y-2 overflow-y-auto pr-1">
            {campaign.missions.map((item, index) => <li key={item.id}>
              <button type="button" aria-current={index === activeMissionIndex ? "step" : undefined} onClick={() => { setMissionIndex(index); setSceneIndex(0); }} className={`w-full rounded-xl border p-3 text-left transition ${index === activeMissionIndex ? "border-primary/60 bg-primary/10" : "border-border-subtle bg-surface-base hover:border-primary/30"}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-light">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.CHAPTER)} {item.chapter} · {index + 1}</span>
                <span className="mt-1 block truncate text-sm font-bold text-white">{item.title || t(ADMIN_STORY_MODE_TEXT_CONSTANT.MISSION_TITLE)}</span>
                <span className="mt-1 block text-xs text-subtle">{item.dialogue.length} {t(ADMIN_STORY_MODE_TEXT_CONSTANT.SCENES).toLocaleLowerCase()}</span>
              </button>
            </li>)}
          </ol>
        </IntellioCard>

        {mission ? <div className="space-y-5">
          <IntellioCard as="section" variant="elevated" padding="md" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-lg font-bold text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.MISSION_DETAILS)}</h2><div className="flex gap-2">
              <button type="button" disabled={activeMissionIndex === 0} onClick={() => moveMission(-1)} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MOVE_UP)} className={MUTED_BUTTON}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" disabled={activeMissionIndex >= campaign.missions.length - 1} onClick={() => moveMission(1)} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MOVE_DOWN)} className={MUTED_BUTTON}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" disabled={campaign.missions.length <= 1} onClick={removeMission} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-danger/30 px-2.5 text-xs font-bold text-danger-light hover:bg-danger/10 disabled:opacity-40"><Trash2 className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.DELETE_MISSION)}</span></button>
            </div></div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.MISSION_ID)}<input value={mission.id} onChange={(event) => updateMission({ ...mission, id: event.currentTarget.value })} className={FIELD_CLASS} /></label>
              <LocalizedTextField id="story-mission-title" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MISSION_TITLE)} value={mission.title} translations={mission.translations?.title} locale={locale} onChange={(value, translations) => localizedMission("title", value, translations)} />
              <label className="space-y-1.5 text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.CHAPTER)}<input type="number" min={1} value={mission.chapter} onChange={(event) => updateMission({ ...mission, chapter: Math.max(1, Number(event.currentTarget.value) || 1) })} className={FIELD_CLASS} /></label>
              <label className="space-y-1.5 text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.MISSION_KIND)}<select value={mission.kind} onChange={(event) => updateMission({ ...mission, kind: event.currentTarget.value as StoryMissionContentEntity["kind"] })} className={FIELD_CLASS}><option value="STORY">STORY</option><option value="BATTLE">BATTLE</option><option value="FINAL_BOSS">FINAL_BOSS</option></select></label>
              <LocalizedTextField id="story-mission-intro" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.INTRO)} value={mission.intro} translations={mission.translations?.intro} locale={locale} multiline rows={4} onChange={(value, translations) => localizedMission("intro", value, translations)} />
              <LocalizedTextField id="story-mission-objective" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.OBJECTIVE)} value={mission.objective} translations={mission.translations?.objective} locale={locale} multiline rows={4} onChange={(value, translations) => localizedMission("objective", value, translations)} />
              <LocalizedTextField id="story-mission-opponent" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.OPPONENT)} value={mission.opponentTitle} translations={mission.translations?.opponentTitle} locale={locale} onChange={(value, translations) => localizedMission("opponentTitle", value, translations)} />
              <label className="space-y-1.5 text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.REWARD_POINTS)}<input type="number" min={1} value={mission.replayPointBase} onChange={(event) => updateMission({ ...mission, replayPointBase: Math.max(1, Number(event.currentTarget.value) || 1) })} className={FIELD_CLASS} /></label>
              <LocalizedTextField id="story-mission-historical" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.HISTORICAL_NOTE)} value={mission.historicalNote ?? ""} translations={undefined} locale="id" multiline rows={3} onChange={(value) => updateMission({ ...mission, historicalNote: value })} />
              <div className="space-y-2">
                <label htmlFor="story-mission-soundtrack" className="text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.SOUNDTRACK)}</label>
                <select id="story-mission-soundtrack" value={mission.soundtrackAssetId ? "" : mission.soundtrackUrl ?? ""} onChange={(event) => updateMission({ ...mission, soundtrackUrl: event.currentTarget.value || undefined, soundtrackAssetId: null })} className={FIELD_CLASS}>
                  <option value="">—</option>{STORY_PUBLIC_SOUNDTRACKS.map((track) => <option key={track.url} value={track.url}>{track.title}</option>)}
                </select>
                <StoryAssetPicker assetType="audio" assets={assets} selectedAssetId={mission.soundtrackAssetId} onSelect={(asset) => updateMission({ ...mission, soundtrackAssetId: asset?.id ?? null, soundtrackUrl: undefined })} onUpload={onUpload} />
                {(mission.soundtrackAssetId || mission.soundtrackUrl) && <audio controls preload="none" src={mission.soundtrackAssetId ? API_ROUTES.STORY_MODE.media(mission.soundtrackAssetId) : mission.soundtrackUrl} className="w-full" />}
              </div>
              <LocalizedTextField id="story-mission-ending-title" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.ENDING_TITLE)} value={mission.endingTitle ?? ""} translations={mission.translations?.endingTitle} locale={locale} onChange={(value, translations) => localizedMission("endingTitle", value, translations)} />
              <LocalizedTextField id="story-mission-ending" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.ENDING)} value={mission.ending} translations={mission.translations?.ending} locale={locale} multiline rows={4} onChange={(value, translations) => localizedMission("ending", value, translations)} />
            </div>
          </IntellioCard>

          <IntellioCard as="section" variant="elevated" padding="md" className="space-y-4">
            <h2 className="font-display text-lg font-bold text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.PLAYER_DECK)}</h2>
            <DeckCardsEditor title={t(ADMIN_STORY_MODE_TEXT_CONSTANT.CHARACTERS)} cardType="CHARACTER" kingdom={campaign.kingdom} slugs={mission.storyDeck.characterSlugs} onChange={(characterSlugs) => updateMission({ ...mission, storyDeck: { ...mission.storyDeck, characterSlugs } })} t={t} />
            <DeckCardsEditor title={t(ADMIN_STORY_MODE_TEXT_CONSTANT.INSTRUMENTS)} cardType="INSTRUMENT" slugs={mission.storyDeck.instrumentSlugs} onChange={(instrumentSlugs) => updateMission({ ...mission, storyDeck: { ...mission.storyDeck, instrumentSlugs } })} t={t} />
            <div className="border-t border-border-subtle pt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.OPPONENT_DECK)}</h3>{!mission.opponentDeck && <button type="button" onClick={() => { const fallback = ALL_CARDS_CATALOG.find((card) => card.cardType === "CHARACTER" && card.publicationStatus === "ACTIVE" && card.kingdom !== campaign.kingdom); if (fallback) updateMission({ ...mission, opponentDeck: { characterSlugs: [fallback.slug], instrumentSlugs: [] } }); }} className={MUTED_BUTTON}><Plus className="h-4 w-4" />{t(ADMIN_STORY_MODE_TEXT_CONSTANT.ADD_CARD)}</button>}</div>
              {mission.opponentDeck && <div className="space-y-4"><DeckCardsEditor title={t(ADMIN_STORY_MODE_TEXT_CONSTANT.CHARACTERS)} cardType="CHARACTER" slugs={mission.opponentDeck.characterSlugs} onChange={(characterSlugs) => updateMission({ ...mission, opponentDeck: { ...mission.opponentDeck!, characterSlugs } })} t={t} /><DeckCardsEditor title={t(ADMIN_STORY_MODE_TEXT_CONSTANT.INSTRUMENTS)} cardType="INSTRUMENT" slugs={mission.opponentDeck.instrumentSlugs} onChange={(instrumentSlugs) => updateMission({ ...mission, opponentDeck: { ...mission.opponentDeck!, instrumentSlugs } })} t={t} /><button type="button" onClick={() => updateMission({ ...mission, opponentDeck: undefined })} className="text-xs font-semibold text-danger-light hover:text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.REMOVE)} {t(ADMIN_STORY_MODE_TEXT_CONSTANT.OPPONENT_DECK).toLocaleLowerCase()}</button></div>}
            </div>
          </IntellioCard>

          <IntellioCard as="section" variant="elevated" padding="md" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-bold text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.SCENES)}</h2><button type="button" onClick={addScene} disabled={mission.dialogue.length >= 80} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-primary/85 disabled:opacity-40"><Plus className="h-4 w-4" />{t(ADMIN_STORY_MODE_TEXT_CONSTANT.NEW_SCENE)}</button></div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {mission.dialogue.map((item, index) => <button key={`scene-${index}`} type="button" aria-pressed={index === sceneIndex} onClick={() => setSceneIndex(index)} className={`min-h-10 shrink-0 rounded-lg border px-3 text-xs font-bold ${index === sceneIndex ? "border-amber/60 bg-amber/10 text-amber-light" : "border-border-subtle bg-surface-base text-subtle hover:text-white"}`}>{t(ADMIN_STORY_MODE_TEXT_CONSTANT.SCENE_NUMBER, { number: index + 1 })}</button>)}
            </div>
            {scene && <div className="space-y-4 rounded-xl border border-border-subtle bg-surface-base/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.SCENE_NUMBER, { number: sceneIndex + 1 })}</h3><div className="flex gap-2"><button type="button" disabled={sceneIndex === 0} onClick={() => moveScene(-1)} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MOVE_UP)} className={MUTED_BUTTON}><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={sceneIndex >= mission.dialogue.length - 1} onClick={() => moveScene(1)} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.MOVE_DOWN)} className={MUTED_BUTTON}><ArrowDown className="h-4 w-4" /></button><button type="button" disabled={mission.dialogue.length >= 80} onClick={duplicateScene} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.DUPLICATE_SCENE)} className={MUTED_BUTTON}><Copy className="h-4 w-4" /></button><button type="button" disabled={mission.dialogue.length <= 1} onClick={deleteScene} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.DELETE_SCENE)} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-danger/30 px-2.5 text-danger-light hover:bg-danger/10 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button></div></div>
              <div className="grid gap-4 md:grid-cols-2">
                <LocalizedTextField id="story-scene-speaker" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.SPEAKER)} value={scene.speaker} translations={scene.translations?.speaker} locale={locale} onChange={(value, translations) => localizedScene("speaker", value, translations)} />
                <LocalizedTextField id="story-scene-location" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.LOCATION)} value={scene.location ?? ""} translations={scene.translations?.location} locale={locale} onChange={(value, translations) => localizedScene("location", value, translations)} />
                <div className="md:col-span-2"><LocalizedTextField id="story-scene-dialogue" label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.DIALOGUE)} value={scene.text} translations={scene.translations?.text} locale={locale} multiline rows={5} onChange={(value, translations) => localizedScene("text", value, translations)} /></div>
                <label className="space-y-1.5 text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.CHARACTER)}<select value={scene.characterCardSlug ?? ""} onChange={(event) => updateScene({ ...scene, characterCardSlug: event.currentTarget.value || null })} className={FIELD_CLASS}><option value="">—</option>{playerCharacters.map((card) => <option key={card.slug} value={card.slug}>{card.name}</option>)}</select></label>
                <label className="space-y-1.5 text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.BACKGROUND)}<select value={scene.backgroundUrl ?? ""} onChange={(event) => updateScene({ ...scene, backgroundUrl: event.currentTarget.value || null, backgroundAssetId: null })} className={FIELD_CLASS}><option value="">—</option>{STORY_PUBLIC_SCENE_BACKGROUNDS.map((background) => <option key={background.url} value={background.url}>{background.fileName}</option>)}</select></label>
                {scene.backgroundUrl && <div className="md:col-span-2"><div className="relative h-44 overflow-hidden rounded-xl border border-white/10 bg-black/20"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${scene.backgroundUrl}")` }} /></div></div>}
                <div className="space-y-2"><p className="text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.BACKGROUND)} · {t(ADMIN_STORY_MODE_TEXT_CONSTANT.MEDIA_LIBRARY)}</p><StoryAssetPicker assetType="image" assets={assets} selectedAssetId={scene.backgroundAssetId} onSelect={(asset) => updateScene({ ...scene, backgroundAssetId: asset?.id ?? null, backgroundUrl: null })} onUpload={onUpload} /></div>
                <div className="space-y-2"><p className="text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.SOUND_EFFECT)}</p><StoryAssetPicker assetType="audio" assets={assets} selectedAssetId={scene.soundEffectAssetId} onSelect={(asset) => updateScene({ ...scene, soundEffectAssetId: asset?.id ?? null })} onUpload={onUpload} /></div>
              </div>
            </div>}
          </IntellioCard>

          <IntellioCard as="section" variant="elevated" padding="md" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-bold text-white">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.CHOICES)}</h2><button type="button" disabled={mission.choices.length >= 8 || mission.dialogue.length === 0} onClick={addChoice} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-primary/85 disabled:opacity-40"><Plus className="h-4 w-4" />{t(ADMIN_STORY_MODE_TEXT_CONSTANT.NEW_CHOICE)}</button></div>
            {mission.choices.length > 0 && <label className="block max-w-sm space-y-1.5 text-xs font-bold text-cream">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.DECISION_SCENE)}<select value={mission.choiceAfterSceneIndex ?? ""} onChange={(event) => updateMission({ ...mission, choiceAfterSceneIndex: event.currentTarget.value === "" ? null : Number(event.currentTarget.value) })} className={FIELD_CLASS}>{mission.dialogue.map((_, index) => <option key={index} value={index}>{t(ADMIN_STORY_MODE_TEXT_CONSTANT.SCENE_NUMBER, { number: index + 1 })}</option>)}</select></label>}
            <div className="grid gap-4 lg:grid-cols-2">{mission.choices.map((choice, index) => <div key={choice.id} className="space-y-3 rounded-xl border border-border-subtle bg-surface-base/50 p-4">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase text-primary-light">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.NEW_CHOICE)} {index + 1}</span><button type="button" onClick={() => deleteChoice(index)} aria-label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.REMOVE)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-danger-light hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button></div>
              <label className="space-y-1.5 text-xs font-bold text-cream">ID<input value={choice.id} onChange={(event) => updateChoice(index, { ...choice, id: event.currentTarget.value })} className={FIELD_CLASS} /></label>
              <LocalizedTextField id={`story-choice-label-${index}`} label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.CHOICE_LABEL)} value={choice.label} translations={choice.translations?.label} locale={locale} onChange={(value, translations) => updateChoice(index, { ...choice, label: value, translations: { ...choice.translations, label: translations } })} />
              <LocalizedTextField id={`story-choice-consequence-${index}`} label={t(ADMIN_STORY_MODE_TEXT_CONSTANT.CONSEQUENCE)} value={choice.consequence} translations={choice.translations?.consequence} locale={locale} multiline rows={3} onChange={(value, translations) => updateChoice(index, { ...choice, consequence: value, translations: { ...choice.translations, consequence: translations } })} />
            </div>)}</div>
          </IntellioCard>
        </div> : <IntellioCard as="section" variant="flat" padding="md"><p className="text-sm text-subtle">{t(ADMIN_STORY_MODE_TEXT_CONSTANT.NEW_MISSION)}</p></IntellioCard>}
      </div>
    </div>
  );
}
