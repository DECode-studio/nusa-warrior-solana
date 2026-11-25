"use client";

import React from "react";
import { useTranslator } from "@/core/translator";
import {
  AdminFeedbackBanner,
  AdminRequestState,
} from "@/client/presentation/components/admin";
import {
  AdminTeamHeading,
  AdminTeamTable,
  AdminTeamFormModal,
  AdminTeamDeleteModal,
} from "./components";
import { ADMIN_TEAM_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_TEAM_TEXT_CONSTANT } from "./constants/TextConstant";
import { useAdminTeam } from "./hooks/useAdminTeam";

export function AdminTeamView(): React.ReactElement {
  const { t } = useTranslator();
  const {
    members,
    filteredMembers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    feedback,
    retryLoad,

    isFormModalOpen,
    editingMember,
    formData,
    isSaving,
    isUploadingImage,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleFormChange,
    handleImageUpload,
    handleSubmitForm,

    handleToggleStatus,

    isDeleteModalOpen,
    deletingMember,
    isDeleting,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
  } = useAdminTeam();

  return (
    <div id={ADMIN_TEAM_SEMANTIC_IDS.ROOT} className="space-y-6">
      {/* 1. Header Banner with Stats, Search, and Add Button */}
      <AdminTeamHeading
        totalCount={members.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={handleOpenCreateModal}
      />

      {/* 2. Feedback Alert */}
      {feedback && (
        <AdminFeedbackBanner
          id={ADMIN_TEAM_SEMANTIC_IDS.FEEDBACK}
          message={feedback.messageKey.startsWith("adminTeam.") ? t(feedback.messageKey) : feedback.messageKey}
          variant={feedback.variant}
        />
      )}

      {/* 3. Loading / Error States */}
      <AdminRequestState
        loading={loading}
        error={error}
        loadingId={ADMIN_TEAM_SEMANTIC_IDS.LOADING_STATE}
        errorId={ADMIN_TEAM_SEMANTIC_IDS.ERROR_ALERT}
        retryId={ADMIN_TEAM_SEMANTIC_IDS.RETRY_BTN}
        loadingMessage={t(ADMIN_TEAM_TEXT_CONSTANT.LOADING)}
        errorTitle="Gagal Memuat Anggota Tim"
        retryLabel={t(ADMIN_TEAM_TEXT_CONSTANT.RETRY)}
        onRetry={retryLoad}
      />

      {/* 4. Team Members Table */}
      {!loading && !error && (
        <AdminTeamTable
          members={filteredMembers}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* 5. Create / Edit Form Modal */}
      <AdminTeamFormModal
        isOpen={isFormModalOpen}
        editingMember={editingMember}
        formData={formData}
        isSaving={isSaving}
        isUploadingImage={isUploadingImage}
        onClose={handleCloseFormModal}
        onFormChange={handleFormChange}
        onImageUpload={handleImageUpload}
        onSubmit={handleSubmitForm}
      />

      {/* 6. Delete Confirmation Modal */}
      <AdminTeamDeleteModal
        isOpen={isDeleteModalOpen}
        deletingMember={deletingMember}
        isDeleting={isDeleting}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
