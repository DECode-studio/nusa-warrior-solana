"use client";

import React from "react";
import { AdminFeedbackBanner } from "@/client/presentation/components/admin";
import {
  AdminContactChannelsCard,
  AdminContactHeading,
  AdminContactInquiriesList,
  AdminContactReplyModal,
} from "./components";
import { ADMIN_CONTACT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { useAdminContact } from "./hooks/useAdminContact";

export function AdminContactView(): React.ReactElement {
  const {
    channels,
    isEditingChannels,
    setIsEditingChannels,
    channelsForm,
    setChannelsForm,
    handleSaveChannels,
    handleCancelEditChannels,
    filteredInquiries,
    newInquiriesCount,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedInquiry,
    replyInput,
    setReplyInput,
    handleOpenReplyModal,
    handleCloseReplyModal,
    handleSubmitReply,
    handleUpdateStatus,
    feedback,
  } = useAdminContact();

  return (
    <div id={ADMIN_CONTACT_SEMANTIC_IDS.ROOT} className="space-y-6">
      {/* 1. Header Banner with Stats */}
      <AdminContactHeading newCount={newInquiriesCount} />

      {/* 2. Feedback Alert */}
      {feedback && (
        <AdminFeedbackBanner
          id={ADMIN_CONTACT_SEMANTIC_IDS.FEEDBACK}
          message={feedback.message}
          variant={feedback.variant}
        />
      )}

      {/* 3. Official Channels Management Card */}
      <AdminContactChannelsCard
        channels={channels}
        isEditing={isEditingChannels}
        onToggleEdit={() => setIsEditingChannels(true)}
        formData={channelsForm}
        onFormChange={setChannelsForm}
        onSave={handleSaveChannels}
        onCancel={handleCancelEditChannels}
      />

      {/* 4. Inquiries & User Feedback List */}
      <AdminContactInquiriesList
        inquiries={filteredInquiries}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReply={handleOpenReplyModal}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* 5. Reply / Handle Inquiry Modal */}
      <AdminContactReplyModal
        inquiry={selectedInquiry}
        isOpen={Boolean(selectedInquiry)}
        onClose={handleCloseReplyModal}
        replyText={replyInput}
        onReplyChange={setReplyInput}
        onSubmitReply={handleSubmitReply}
      />
    </div>
  );
}

