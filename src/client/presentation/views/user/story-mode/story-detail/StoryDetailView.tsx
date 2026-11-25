"use client";

import React from "react";
import { ArrowLeft, BookOpen, Crown, Swords } from "lucide-react";
import { Badge, Button, SelectField } from "@/client/presentation/components/ui";
import { UserFeedback } from "@/client/presentation/components/user";
import { useTranslator } from "@/core/translator";
import { getStoryLocalizedText } from "@/core/utils/story-localization";
import { STORY_DETAIL_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { STORY_DETAIL_TEXT_CONSTANT } from "./constants/TextConstant";
import { StoryDialogueTranscript } from "./components";
import { useStoryDetail } from "./hooks/useStoryDetail";

const FULLSCREEN_CLASS = "fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#08070b] text-white";

export function StoryDetailView(): React.ReactElement {
  const { t, locale } = useTranslator();
  const story = useStoryDetail();

  if (story.loading) {
    return <main id={STORY_DETAIL_SEMANTIC_IDS.ROOT} className={`${FULLSCREEN_CLASS} items-center justify-center px-5 pt-[env(safe-area-inset-top)]`}><UserFeedback kind="loading" title={t(STORY_DETAIL_TEXT_CONSTANT.LOADING)} /></main>;
  }

  if (!story.campaign || !story.mission || !story.kingdom) {
    return (
      <main id={STORY_DETAIL_SEMANTIC_IDS.ROOT} className={`${FULLSCREEN_CLASS} items-center justify-center px-5 pt-[env(safe-area-inset-top)]`}>
        <UserFeedback kind="error" title={story.error ?? t(STORY_DETAIL_TEXT_CONSTANT.LOAD_ERROR)} action={<Button variant="secondary" shape="rounded" onClick={() => void story.retry()}>{t(STORY_DETAIL_TEXT_CONSTANT.RETRY)}</Button>} />
      </main>
    );
  }

  const { campaign, mission } = story;
  const isMajapahit = campaign.kingdom === "MAJAPAHIT";
  const isFinalBoss = mission.kind === "FINAL_BOSS";
  const replayReward = Math.max(1, Math.floor(mission.replayPointBase * Math.pow(0.5, mission.replayCount)));
  const previousIndex = campaign.missions.findIndex((item) => item.id === mission.id) - 1;
  const previousMission = previousIndex >= 0 ? campaign.missions[previousIndex] : null;
  const previousChoice = previousMission?.choices.find((choice) => choice.id === mission.previousChoice);
  const decisionIndex = mission.choiceAfterSceneIndex ?? mission.dialogue.length - 1;
  const selectedChoice = mission.choices.find((choice) => choice.id === story.selectedChoiceId);
  const branchConsequence = story.sceneIndex === decisionIndex + 1 && selectedChoice
    ? getStoryLocalizedText(selectedChoice.consequence, selectedChoice.translations?.consequence, locale)
    : null;
  const isDecisionScene = story.sceneIndex === decisionIndex && mission.choices.length > 0;
  const isLastScene = story.sceneIndex === mission.dialogue.length - 1;

  return (
    <main id={STORY_DETAIL_SEMANTIC_IDS.ROOT} className={FULLSCREEN_CLASS}>
      <header className="relative z-30 flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#08070b]/85 px-3 pb-2 pt-[max(env(safe-area-inset-top),0.5rem)] backdrop-blur-md sm:px-7 sm:pb-3">
        <Button id={STORY_DETAIL_SEMANTIC_IDS.BACK} variant="ghost" size="sm" shape="rounded" onClick={story.goBack} leftIcon={<ArrowLeft className="h-4 w-4" />} className="min-h-11 shrink-0 text-white/80 hover:text-white">{t(STORY_DETAIL_TEXT_CONSTANT.BACK)}</Button>
        <div className="min-w-0 flex-1 border-l border-white/15 pl-3 sm:pl-5">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60 sm:text-xs">{getStoryLocalizedText(campaign.title, campaign.translations?.title, locale)}</p>
          <h1 className="truncate font-display text-sm font-bold text-white sm:text-lg">{getStoryLocalizedText(mission.title, mission.translations?.title, locale)}</h1>
        </div>
        <Badge variant={isFinalBoss ? "amber" : "neutral"} size="sm" icon={isFinalBoss ? <Crown className="h-3 w-3" /> : undefined}>
          {t(STORY_DETAIL_TEXT_CONSTANT.CHAPTER, { chapter: mission.chapter })}{isFinalBoss ? ` · ${t(STORY_DETAIL_TEXT_CONSTANT.FINAL_BOSS)}` : ""}
        </Badge>
      </header>

      {story.error && <div className="absolute left-1/2 top-20 z-40 w-[min(92vw,38rem)] -translate-x-1/2"><UserFeedback kind="error" title={story.error} /></div>}

      <StoryDialogueTranscript mission={mission} accent={campaign.accent} sceneIndex={story.sceneIndex} onSceneChange={story.setSceneIndex} disableNext={story.sceneIndex === decisionIndex && mission.choices.length > 0 && !selectedChoice} branchConsequence={branchConsequence} />

      <section aria-label={t(STORY_DETAIL_TEXT_CONSTANT.OBJECTIVE, { objective: getStoryLocalizedText(mission.objective, mission.translations?.objective, locale) })} className="relative z-20 max-h-[38dvh] shrink-0 overflow-y-auto border-t border-white/10 bg-[#08070b]/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 shadow-[0_-16px_50px_rgba(0,0,0,.35)] backdrop-blur-md sm:max-h-[32dvh] sm:px-8 sm:pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/80 sm:text-sm">{t(STORY_DETAIL_TEXT_CONSTANT.OBJECTIVE, { objective: getStoryLocalizedText(mission.objective, mission.translations?.objective, locale) })}</p>
            <p className="shrink-0 text-xs font-semibold text-amber-light sm:text-sm">{t(mission.replayCount > 0 ? STORY_DETAIL_TEXT_CONSTANT.REPLAY_REWARD : STORY_DETAIL_TEXT_CONSTANT.FIRST_REWARD, { points: mission.replayCount > 0 ? replayReward : mission.replayPointBase })}</p>
          </div>
          {previousChoice && <p className="mt-1 text-xs text-white/55">{t(STORY_DETAIL_TEXT_CONSTANT.PREVIOUS_CHOICE, { choice: getStoryLocalizedText(previousChoice.consequence, previousChoice.translations?.consequence, locale) })}</p>}
          {isFinalBoss && <p className="mt-1 text-xs font-semibold text-amber-light">{t(STORY_DETAIL_TEXT_CONSTANT.FINAL_REWARD)}</p>}

          {isDecisionScene && <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-bold text-white">{t(STORY_DETAIL_TEXT_CONSTANT.CHOICE_PROMPT)}</legend>
            {mission.choices.map((choice) => {
              const selected = story.selectedChoiceId === choice.id;
              return <label key={choice.id} className={`cursor-pointer rounded-lg border px-3 py-2 transition-colors focus-within:ring-2 focus-within:ring-amber ${selected ? "border-amber/70 bg-amber/10" : "border-white/15 bg-white/[0.03] hover:border-white/35"}`}>
                <input id={`${STORY_DETAIL_SEMANTIC_IDS.CHOICE_PREFIX}${choice.id}`} className="sr-only" type="radio" name={`choice-${mission.id}`} value={choice.id} checked={selected} onChange={() => story.setSelectedChoiceId(choice.id)} />
                <span className="block text-sm font-semibold text-white">{getStoryLocalizedText(choice.label, choice.translations?.label, locale)}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-white/65">{getStoryLocalizedText(choice.consequence, choice.translations?.consequence, locale)}</span>
              </label>;
            })}
          </fieldset>}

          <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-end sm:justify-between">
            {campaign.progress.isComplete ? <SelectField id={STORY_DETAIL_SEMANTIC_IDS.DECK_SELECT} label={t(STORY_DETAIL_TEXT_CONSTANT.DECK_LABEL)} value={story.selectedDeckId} onChange={(event) => story.setSelectedDeckId(event.target.value)} disabled={story.decks.length === 0} options={story.decks.map((deck) => ({ value: deck.id, label: deck.name }))} containerClassName="sm:max-w-sm" /> : <p className="self-center text-xs text-white/55">{t(STORY_DETAIL_TEXT_CONSTANT.STORY_DECK)}</p>}
            {isLastScene && <Button id={STORY_DETAIL_SEMANTIC_IDS.START} variant={isMajapahit ? "amber" : "emerald"} shape="rounded" disabled={campaign.progress.isComplete && !story.selectedDeckId} isLoading={story.starting} onClick={() => void story.startMission()} leftIcon={isFinalBoss ? <Swords className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />} className="min-h-11 w-full shrink-0 sm:w-auto">
              {story.starting ? t(STORY_DETAIL_TEXT_CONSTANT.STARTING) : isFinalBoss ? t(STORY_DETAIL_TEXT_CONSTANT.CHALLENGE_BOSS) : mission.completed ? t(STORY_DETAIL_TEXT_CONSTANT.REPLAY) : t(STORY_DETAIL_TEXT_CONSTANT.START)}
            </Button>}
          </div>
          {story.decks.length === 0 && <p className="mt-2 text-xs text-amber-light">{t(STORY_DETAIL_TEXT_CONSTANT.DECK_REQUIRED)}</p>}
        </div>
      </section>
    </main>
  );
}
