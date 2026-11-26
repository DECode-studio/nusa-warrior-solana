import { z } from "zod";
import { requireAdminSession } from "@/server/shared/auth/authorization";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { AppError } from "@/server/shared/errors/app-error";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import {
  getSolanaNetwork,
  invalidateSolanaRpcPoolCache,
} from "@/server/modules/solana/solana-config";

const createRpcSchema = z.object({
  label: z.string().trim().min(2).max(60),
  url: z.string().trim().url().refine((u) => /^https?:\/\//i.test(u), {
    message: "URL RPC harus diawali http:// atau https://",
  }),
  network: z.enum(["devnet", "mainnet-beta", "testnet", "localnet"]).optional(),
  priority: z.number().int().min(0).max(999).optional(),
});

const updateRpcSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(2).max(60).optional(),
  url: z
    .string()
    .trim()
    .url()
    .refine((u) => /^https?:\/\//i.test(u))
    .optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).max(999).optional(),
});

const deleteRpcSchema = z.object({
  id: z.string().min(1),
});

async function requireSuperAdmin() {
  const session = await requireAdminSession();
  if (session.role !== "ADMIN") {
    throw AppError.forbidden("Hanya ADMIN yang dapat mengatur Solana RPC.");
  }
  return session;
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireSuperAdmin();
    if (!isPrismaDriverEnabled()) {
      return okResponse({ network: getSolanaNetwork(), endpoints: [] });
    }
    const endpoints = await prisma.solanaRpcEndpoint.findMany({
      orderBy: [{ network: "asc" }, { priority: "asc" }, { createdAt: "asc" }],
    });
    return okResponse({ network: getSolanaNetwork(), endpoints });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    await requireSuperAdmin();
    if (!isPrismaDriverEnabled()) {
      throw AppError.badRequest("Fitur ini membutuhkan database Prisma.");
    }
    const body = createRpcSchema.parse(await request.json());
    const created = await prisma.solanaRpcEndpoint.create({
      data: {
        label: body.label,
        url: body.url,
        network: body.network ?? getSolanaNetwork(),
        priority: body.priority ?? 0,
        isActive: true,
      },
    });
    invalidateSolanaRpcPoolCache();
    return okResponse(created, 201);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    await requireSuperAdmin();
    if (!isPrismaDriverEnabled()) {
      throw AppError.badRequest("Fitur ini membutuhkan database Prisma.");
    }
    const body = updateRpcSchema.parse(await request.json());
    const updated = await prisma.solanaRpcEndpoint.update({
      where: { id: body.id },
      data: {
        ...(body.label !== undefined ? { label: body.label } : {}),
        ...(body.url !== undefined ? { url: body.url } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
      },
    });
    invalidateSolanaRpcPoolCache();
    return okResponse(updated);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    await requireSuperAdmin();
    if (!isPrismaDriverEnabled()) {
      throw AppError.badRequest("Fitur ini membutuhkan database Prisma.");
    }
    const body = deleteRpcSchema.parse(await request.json());
    await prisma.solanaRpcEndpoint.delete({ where: { id: body.id } });
    invalidateSolanaRpcPoolCache();
    return okResponse({ deleted: true, id: body.id });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
