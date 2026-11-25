"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TeamMemberEntity } from "@/client/domain/team/entity/team_member_entity";
import { getService } from "@/core/di/container";
import { TEAM_USECASE_TOKEN } from "@/core/di/tokens";
import { ADMIN_TEAM_TEXT_CONSTANT } from "../constants/TextConstant";
import type {
  TeamMemberFormData,
  AdminTeamFeedback,
  SelectedTeamMember,
} from "../types";

const INITIAL_FORM: TeamMemberFormData = {
  name: "",
  email: "",
  role: "",
  description: "",
  image: "",
  imagePositionX: 50,
  imagePositionY: 50,
  displayOrder: 0,
  isActive: true,
};

export interface UseAdminTeamReturn {
  members: TeamMemberEntity[];
  filteredMembers: TeamMemberEntity[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  feedback: AdminTeamFeedback | null;
  retryLoad: () => void;

  // Form modal
  isFormModalOpen: boolean;
  editingMember: SelectedTeamMember;
  formData: TeamMemberFormData;
  setFormData: React.Dispatch<React.SetStateAction<TeamMemberFormData>>;
  isSaving: boolean;
  isUploadingImage: boolean;
  handleOpenCreateModal: () => void;
  handleOpenEditModal: (member: TeamMemberEntity) => void;
  handleCloseFormModal: () => void;
  handleFormChange: (field: keyof TeamMemberFormData, value: string | number | boolean) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSubmitForm: (e: React.FormEvent) => Promise<void>;

  // Toggle active
  handleToggleStatus: (member: TeamMemberEntity) => Promise<void>;

  // Delete modal
  isDeleteModalOpen: boolean;
  deletingMember: SelectedTeamMember;
  isDeleting: boolean;
  handleOpenDeleteModal: (member: TeamMemberEntity) => void;
  handleCloseDeleteModal: () => void;
  handleConfirmDelete: () => Promise<void>;
}

export function useAdminTeam(): UseAdminTeamReturn {
  const [members, setMembers] = useState<TeamMemberEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [feedback, setFeedback] = useState<AdminTeamFeedback | null>(null);

  // Form modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<SelectedTeamMember>(null);
  const [formData, setFormData] = useState<TeamMemberFormData>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deletingMember, setDeletingMember] = useState<SelectedTeamMember>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadTeamMembers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const teamUseCase = getService(TEAM_USECASE_TOKEN);
      const data = await teamUseCase.getAdminTeamMembers();
      setMembers(data);
    } catch {
      setError("Gagal memuat daftar anggota tim.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeamMembers();
  }, [loadTeamMembers]);

  // Auto dismiss feedback after 4 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  const handleOpenCreateModal = useCallback((): void => {
    setEditingMember(null);
    setFormData({
      ...INITIAL_FORM,
      displayOrder: members.length,
    });
    setIsFormModalOpen(true);
  }, [members.length]);

  const handleOpenEditModal = useCallback((member: TeamMemberEntity): void => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      description: member.description,
      image: member.image,
      imagePositionX: member.imagePositionX ?? 50,
      imagePositionY: member.imagePositionY ?? 50,
      displayOrder: member.displayOrder,
      isActive: member.isActive,
    });
    setIsFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback((): void => {
    setIsFormModalOpen(false);
    setEditingMember(null);
    setFormData(INITIAL_FORM);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof TeamMemberFormData, value: string | number | boolean): void => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Clear the input so selecting the same file again triggers onChange.
      e.target.value = "";
      if (file.size > 1 * 1024 * 1024) {
        setFeedback({
          messageKey: "Ukuran file maksimal adalah 1 MB.",
          variant: "error",
        });
        return;
      }

      setIsUploadingImage(true);
      try {
        const teamUseCase = getService(TEAM_USECASE_TOKEN);
        const imageUrl = await teamUseCase.uploadTeamImage(file);
        setFormData((prev) => ({
          ...prev,
          image: imageUrl,
        }));
      } catch {
        setFeedback({
          messageKey: "Gagal mengunggah foto. Silakan coba lagi.",
          variant: "error",
        });
      } finally {
        setIsUploadingImage(false);
      }
    },
    []
  );

  const handleSubmitForm = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      setIsSaving(true);
      try {
        const teamUseCase = getService(TEAM_USECASE_TOKEN);
        if (editingMember) {
          const updated = await teamUseCase.updateTeamMember(editingMember.id, formData);
          setMembers((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
          setFeedback({
            messageKey: ADMIN_TEAM_TEXT_CONSTANT.FEEDBACK_UPDATED,
            variant: "success",
          });
        } else {
          const created = await teamUseCase.createTeamMember(formData);
          setMembers((prev) => [created, ...prev]);
          setFeedback({
            messageKey: ADMIN_TEAM_TEXT_CONSTANT.FEEDBACK_CREATED,
            variant: "success",
          });
        }
        handleCloseFormModal();
      } catch {
        setFeedback({
          messageKey: "Gagal menyimpan data anggota tim.",
          variant: "error",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [editingMember, formData, handleCloseFormModal]
  );

  const handleToggleStatus = useCallback(
    async (member: TeamMemberEntity): Promise<void> => {
      try {
        const teamUseCase = getService(TEAM_USECASE_TOKEN);
        const updated = await teamUseCase.updateTeamMember(member.id, {
          isActive: !member.isActive,
        });
        setMembers((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
      } catch {
        setFeedback({
          messageKey: "Gagal memperbarui status anggota tim.",
          variant: "error",
        });
      }
    },
    []
  );

  const handleOpenDeleteModal = useCallback((member: TeamMemberEntity): void => {
    setDeletingMember(member);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback((): void => {
    setIsDeleteModalOpen(false);
    setDeletingMember(null);
  }, []);

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (!deletingMember) return;
    setIsDeleting(true);
    try {
      const teamUseCase = getService(TEAM_USECASE_TOKEN);
      await teamUseCase.deleteTeamMember(deletingMember.id);
      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
      setFeedback({
        messageKey: ADMIN_TEAM_TEXT_CONSTANT.FEEDBACK_DELETED,
        variant: "success",
      });
      handleCloseDeleteModal();
    } catch {
      setFeedback({
        messageKey: "Gagal menghapus anggota tim.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deletingMember, handleCloseDeleteModal]);

  return {
    members,
    filteredMembers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    feedback,
    retryLoad: loadTeamMembers,

    isFormModalOpen,
    editingMember,
    formData,
    setFormData,
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
  };
}
