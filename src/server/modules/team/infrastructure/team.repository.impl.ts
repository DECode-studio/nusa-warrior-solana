import "server-only";
import { prisma } from "@/server/shared/db/prisma";
import type {
  TeamMemberDto,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  TeamRepository,
} from "../domain/team.repository";
import type { TeamMember } from "@prisma/client";

function mapToDto(record: TeamMember): TeamMemberDto {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    description: record.description,
    image: record.image,
    imagePositionX: record.imagePositionX,
    imagePositionY: record.imagePositionY,
    displayOrder: record.displayOrder,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaTeamRepository implements TeamRepository {
  async listPublicTeamMembers(): Promise<TeamMemberDto[]> {
    const records = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
    return records.map(mapToDto);
  }

  async listAllTeamMembers(): Promise<TeamMemberDto[]> {
    const records = await prisma.teamMember.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
    return records.map(mapToDto);
  }

  async findById(id: string): Promise<TeamMemberDto | null> {
    const record = await prisma.teamMember.findUnique({
      where: { id },
    });
    return record ? mapToDto(record) : null;
  }

  async create(input: CreateTeamMemberInput): Promise<TeamMemberDto> {
    const record = await prisma.teamMember.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        description: input.description,
        image: input.image,
        imagePositionX: input.imagePositionX ?? 50,
        imagePositionY: input.imagePositionY ?? 50,
        displayOrder: input.displayOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });
    return mapToDto(record);
  }

  async update(id: string, input: UpdateTeamMemberInput): Promise<TeamMemberDto> {
    const record = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
        ...(input.imagePositionX !== undefined ? { imagePositionX: input.imagePositionX } : {}),
        ...(input.imagePositionY !== undefined ? { imagePositionY: input.imagePositionY } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    return mapToDto(record);
  }

  async delete(id: string): Promise<boolean> {
    await prisma.teamMember.delete({
      where: { id },
    });
    return true;
  }
}

export const teamRepository: TeamRepository = new PrismaTeamRepository();
