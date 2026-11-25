import "server-only";
import { AppError } from "@/server/shared/errors/app-error";
import type {
  TeamMemberDto,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "../domain/team.repository";
import { teamRepository } from "../infrastructure/team.repository.impl";

export async function listPublicTeamMembersUseCase(): Promise<TeamMemberDto[]> {
  return teamRepository.listPublicTeamMembers();
}

export async function listAdminTeamMembersUseCase(): Promise<TeamMemberDto[]> {
  return teamRepository.listAllTeamMembers();
}

export async function getTeamMemberByIdUseCase(id: string): Promise<TeamMemberDto> {
  const member = await teamRepository.findById(id);
  if (!member) {
    throw AppError.notFound("Anggota tim tidak ditemukan.");
  }
  return member;
}

export async function createTeamMemberUseCase(
  input: CreateTeamMemberInput
): Promise<TeamMemberDto> {
  if (!input.name || input.name.trim().length === 0) {
    throw AppError.validation("Nama anggota tim wajib diisi.");
  }
  if (!input.email || input.email.trim().length === 0) {
    throw AppError.validation("Email anggota tim wajib diisi.");
  }
  if (!input.role || input.role.trim().length === 0) {
    throw AppError.validation("Role/jabatan anggota tim wajib diisi.");
  }
  if (!input.description || input.description.trim().length === 0) {
    throw AppError.validation("Deskripsi anggota tim wajib diisi.");
  }
  if (!input.image || input.image.trim().length === 0) {
    throw AppError.validation("Foto/gambar anggota tim wajib diisi.");
  }

  return teamRepository.create({
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role.trim(),
    description: input.description.trim(),
    image: input.image.trim(),
    imagePositionX: input.imagePositionX ?? 50,
    imagePositionY: input.imagePositionY ?? 50,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  });
}

export async function updateTeamMemberUseCase(
  id: string,
  input: UpdateTeamMemberInput
): Promise<TeamMemberDto> {
  const existing = await teamRepository.findById(id);
  if (!existing) {
    throw AppError.notFound("Anggota tim tidak ditemukan.");
  }

  return teamRepository.update(id, {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.email !== undefined ? { email: input.email.trim() } : {}),
    ...(input.role !== undefined ? { role: input.role.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input.image !== undefined ? { image: input.image.trim() } : {}),
    ...(input.imagePositionX !== undefined ? { imagePositionX: input.imagePositionX } : {}),
    ...(input.imagePositionY !== undefined ? { imagePositionY: input.imagePositionY } : {}),
    ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });
}

export async function deleteTeamMemberUseCase(id: string): Promise<boolean> {
  const existing = await teamRepository.findById(id);
  if (!existing) {
    throw AppError.notFound("Anggota tim tidak ditemukan.");
  }
  return teamRepository.delete(id);
}
