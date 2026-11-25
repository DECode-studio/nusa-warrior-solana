"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import { CardDetailModal } from "@/client/presentation/components/CardDetailModal";
import { Button, IntellioCard, Pagination } from "@/client/presentation/components/ui";
import { UserFeedback, UserPageHeading } from "@/client/presentation/components/user";
import {
  DeckBuilderCardGrid,
  DeckBuilderEditorPanel,
  DeckBuilderFilterBar,
  DeckBuilderSavedDecksList,
} from "./components";
import { DECK_BUILDER_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { DECK_BUILDER_TEXT_CONSTANT } from "./constants/TextConstant";
import { useDeckBuilder } from "./hooks/useDeckBuilder";

export function UserDeckBuilderView(): React.ReactElement {
  const { t } = useTranslator();
  const {
    cards,
    totalCards,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalCollectionCount,
    savedDecks,
    deckName,
    setDeckName,
    deckDescription,
    setDeckDescription,
    selectedCharSlugs,
    selectedInstSlugs,
    filterType,
    setFilterType,
    filterKingdom,
    setFilterKingdom,
    searchInput,
    setSearchInput,
    loading,
    error,
    retryLoad,
    saving,
    editingDeckId,
    feedbackMessage,
    inspectedCard,
    setInspectedCard,
    toggleCardSelection,
    loadDeckIntoEditor,
    cancelEdit,
    clearSelection,
    autoFillBalancedDeck,
    saveCustomDeck,
    deleteCustomDeck,
  } = useDeckBuilder();

  const isCharCountValid =
    selectedCharSlugs.length > 0 && selectedCharSlugs.length <= 10;

  return (
    <div id={DECK_BUILDER_SEMANTIC_IDS.ROOT} className="space-y-6">
      <div id={DECK_BUILDER_SEMANTIC_IDS.HEADING}>
        <UserPageHeading
          title={t(DECK_BUILDER_TEXT_CONSTANT.TITLE_KEY)}
          description={t(DECK_BUILDER_TEXT_CONSTANT.SUBTITLE_KEY)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Deck Composition Editor & Saved Decks */}
        <aside className="space-y-5 lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <DeckBuilderEditorPanel
            selectedCharCount={selectedCharSlugs.length}
            selectedInstCount={selectedInstSlugs.length}
            deckName={deckName}
            onDeckNameChange={setDeckName}
            deckDescription={deckDescription}
            onDeckDescriptionChange={setDeckDescription}
            isCharCountValid={isCharCountValid}
            isEditing={Boolean(editingDeckId)}
            saving={saving}
            feedbackMessage={feedbackMessage}
            onAutoFill={() => void autoFillBalancedDeck()}
            onClearSelection={clearSelection}
            onSaveDeck={() => void saveCustomDeck()}
            onCancelEdit={cancelEdit}
          />

          <DeckBuilderSavedDecksList
            savedDecks={savedDecks}
            onLoadDeck={loadDeckIntoEditor}
            onDeleteDeck={(id) => void deleteCustomDeck(id)}
          />
        </aside>

        {/* Right Column: Cultural Cards Library Browser with Server-Side Pagination */}
        <main className="space-y-5 lg:col-span-8">
          <IntellioCard variant="glass" padding="md" overflow="visible" className="space-y-5">
            <DeckBuilderFilterBar
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              filterKingdom={filterKingdom}
              onFilterKingdomChange={setFilterKingdom}
              searchValue={searchInput}
              onSearchChange={setSearchInput}
            />

            {loading && (
              <UserFeedback kind="loading" title={t("common.loading")} />
            )}

            {!loading && error && (
              <UserFeedback
                kind="error"
                title={t(DECK_BUILDER_TEXT_CONSTANT.LOAD_ERROR_TITLE)}
                description={t(error)}
                action={
                  <Button onClick={retryLoad} size="sm">
                    {t(DECK_BUILDER_TEXT_CONSTANT.RETRY)}
                  </Button>
                }
              />
            )}

            {!loading && !error && (
              <>
                <p className="text-xs text-white/55">
                  {t(DECK_BUILDER_TEXT_CONSTANT.COLLECTION_COUNT, {
                    count: totalCollectionCount,
                  })}
                </p>
                {cards.length > 0 ? (
                  <div className="space-y-5">
                    <DeckBuilderCardGrid
                      cards={cards}
                      selectedCharSlugs={selectedCharSlugs}
                      selectedInstSlugs={selectedInstSlugs}
                      onToggleSelection={toggleCardSelection}
                      onInspectCard={setInspectedCard}
                    />

                    <Pagination
                      id={DECK_BUILDER_SEMANTIC_IDS.PAGINATION}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalCards}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                      pageSizeOptions={[12, 24, 48]}
                    />
                  </div>
                ) : (
                  <p className="rounded-xl border border-white/10 p-5 text-sm text-white/65">
                    {t(DECK_BUILDER_TEXT_CONSTANT.EMPTY_FILTER)}
                  </p>
                )}
              </>
            )}
          </IntellioCard>
        </main>
      </div>

      <CardDetailModal
        card={inspectedCard}
        onClose={() => setInspectedCard(null)}
      />
    </div>
  );
}
