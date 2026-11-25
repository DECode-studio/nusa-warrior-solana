import "server-only";
import { randomUUID } from "node:crypto";
import {
  getEmbeddedStore,
  persistEmbeddedStore,
  type StoredUserRecord,
} from "@/server/shared/db/embedded-store";
import { isPrismaDriverEnabled, prisma } from "@/server/shared/db/prisma";
import type { UserRoleValue } from "@/server/shared/auth/session";
import type {
  AuthRepository,
  CreateSolanaUserInput,
  ServerUserEntity,
} from "../domain/auth.repository";

export class AuthRepositoryImpl implements AuthRepository {
  public async findById(id: string): Promise<ServerUserEntity | null> {
    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (!user) return null;
      return {
        id: user.id,
        walletAddress: user.walletAddress ?? null,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
        passwordHash: user.passwordHash,
        role: user.role as UserRoleValue,
        hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
        lastActiveAt: user.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const found = store.users.find((u) => u.id === id);
    if (!found) return null;
    return {
      id: found.id,
      walletAddress: found.walletAddress ?? null,
      name: found.name,
      avatarUrl: found.avatarUrl ?? null,
      passwordHash: found.passwordHash,
      role: found.role,
      hasClaimedStarterPack: Boolean(found.hasClaimedStarterPack),
      lastActiveAt: found.lastActiveAt,
    };
  }

  public async findByWalletAddress(
    walletAddress: string
  ): Promise<ServerUserEntity | null> {
    const trimmed = walletAddress.trim();
    if (!trimmed) return null;

    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.findUnique({
        where: { walletAddress: trimmed },
      });
      if (!user) return null;
      return {
        id: user.id,
        walletAddress: user.walletAddress ?? null,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
        passwordHash: user.passwordHash,
        role: user.role as UserRoleValue,
        hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
        lastActiveAt: user.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const found = store.users.find((u) => u.walletAddress === trimmed);
    if (!found) return null;
    return {
      id: found.id,
      walletAddress: found.walletAddress ?? null,
      name: found.name,
      avatarUrl: found.avatarUrl ?? null,
      passwordHash: found.passwordHash,
      role: found.role,
      hasClaimedStarterPack: Boolean(found.hasClaimedStarterPack),
      lastActiveAt: found.lastActiveAt,
    };
  }

  public async createSolanaUser(
    input: CreateSolanaUserInput
  ): Promise<ServerUserEntity> {
    const walletAddress = input.walletAddress.trim();
    const name = input.name.trim();
    const role: UserRoleValue = input.role ?? "PLAYER";

    if (isPrismaDriverEnabled()) {
      const user = await prisma.user.create({
        data: {
          walletAddress,
          name,
          avatarUrl: input.avatarUrl ?? null,
          passwordHash: "",
          role,
          hasClaimedStarterPack: false,
          lastActiveAt: new Date(),
        },
      });
      return {
        id: user.id,
        walletAddress: user.walletAddress ?? null,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
        passwordHash: user.passwordHash,
        role: user.role as UserRoleValue,
        hasClaimedStarterPack: Boolean(user.hasClaimedStarterPack),
        lastActiveAt: user.lastActiveAt,
      };
    }

    const store = getEmbeddedStore();
    const nowIso = new Date().toISOString();
    const created: StoredUserRecord = {
      id: `usr-sol-${randomUUID()}`,
      walletAddress,
      name,
      avatarUrl: input.avatarUrl ?? null,
      passwordHash: "",
      role,
      hasClaimedStarterPack: false,
      lastActiveAt: nowIso,
      createdAt: nowIso,
    };
    store.users.push(created);
    persistEmbeddedStore(store);

    return {
      id: created.id,
      walletAddress: created.walletAddress ?? null,
      name: created.name,
      avatarUrl: created.avatarUrl ?? null,
      passwordHash: created.passwordHash,
      role: created.role,
      hasClaimedStarterPack: false,
      lastActiveAt: created.lastActiveAt,
    };
  }

  public async touchLastActiveAt(userId: string): Promise<void> {
    if (isPrismaDriverEnabled()) {
      await prisma.user.updateMany({
        where: { id: userId },
        data: { lastActiveAt: new Date() },
      });
      return;
    }

    const store = getEmbeddedStore();
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      user.lastActiveAt = new Date().toISOString();
      persistEmbeddedStore(store);
    }
  }
}

export const authRepository: AuthRepository = new AuthRepositoryImpl();
