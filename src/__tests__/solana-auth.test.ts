import { describe, expect, it, vi } from "vitest";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

vi.mock("server-only", () => ({}));

process.env.JWT_SECRET = "super-secure-production-jwt-secret-min-32-chars-test";

import {
  completeSolanaRegistrationUseCase,
  createSolanaChallengeUseCase,
  verifySolanaLoginUseCase,
} from "@/server/modules/auth/application/auth.usecase";
import { authRepository } from "@/server/modules/auth/infrastructure/auth.repository.impl";

describe("Solana Wallet Authentication", () => {
  it("creates a Devnet challenge message and verifies a new wallet as NEEDS_NICKNAME", async () => {
    const keypair = await Keypair.generate();
    const walletAddress = keypair.publicKey.toBase58();

    const challenge = createSolanaChallengeUseCase(walletAddress);
    expect(challenge.walletAddress).toBe(walletAddress);
    expect(challenge.message).toContain("Solana Devnet");
    expect(challenge.message).toContain(walletAddress);

    const signatureBytes = nacl.sign.detached(
      new TextEncoder().encode(challenge.message),
      keypair.secretKey
    );
    const signature = bs58.encode(signatureBytes);

    const verifyResult = await verifySolanaLoginUseCase({
      walletAddress,
      message: challenge.message,
      signature,
    });

    expect(verifyResult.status).toBe("NEEDS_NICKNAME");
    if (verifyResult.status === "NEEDS_NICKNAME") {
      expect(verifyResult.walletAddress).toBe(walletAddress);
    }
  });

  it("completes registration with required nickname and authenticates subsequent logins", async () => {
    const keypair = await Keypair.generate();
    const walletAddress = keypair.publicKey.toBase58();

    await expect(
      completeSolanaRegistrationUseCase({ walletAddress, nickname: "A" })
    ).rejects.toThrow("Nickname harus terdiri dari 2 hingga 32 karakter.");

    const registered = await completeSolanaRegistrationUseCase({
      walletAddress,
      nickname: "PendekarSolana",
    });

    expect(registered.user.walletAddress).toBe(walletAddress);
    expect(registered.user.name).toBe("PendekarSolana");
    expect(registered.user.role).toBe("PLAYER");
    expect(registered.accessToken).toBeDefined();
    expect(registered.refreshToken).toBeDefined();

    const found = await authRepository.findByWalletAddress(walletAddress);
    expect(found).not.toBeNull();
    expect(found?.name).toBe("PendekarSolana");

    // Duplicate registration should fail
    await expect(
      completeSolanaRegistrationUseCase({
        walletAddress,
        nickname: "Duplikat",
      })
    ).rejects.toThrow("Alamat dompet Solana ini sudah terdaftar.");

    // Subsequent login should return AUTHENTICATED directly
    const challenge = createSolanaChallengeUseCase(walletAddress);
    const signature = bs58.encode(
      nacl.sign.detached(
        new TextEncoder().encode(challenge.message),
        keypair.secretKey
      )
    );

    const loginResult = await verifySolanaLoginUseCase({
      walletAddress,
      message: challenge.message,
      signature,
    });

    expect(loginResult.status).toBe("AUTHENTICATED");
    if (loginResult.status === "AUTHENTICATED") {
      expect(loginResult.user.name).toBe("PendekarSolana");
      expect(loginResult.user.walletAddress).toBe(walletAddress);
    }
  });

  it("rejects invalid wallet signatures", async () => {
    const keypair = await Keypair.generate();
    const otherKeypair = await Keypair.generate();
    const walletAddress = keypair.publicKey.toBase58();
    const challenge = createSolanaChallengeUseCase(walletAddress);

    const wrongSignature = bs58.encode(
      nacl.sign.detached(
        new TextEncoder().encode(challenge.message),
        otherKeypair.secretKey
      )
    );

    await expect(
      verifySolanaLoginUseCase({
        walletAddress,
        message: challenge.message,
        signature: wrongSignature,
      })
    ).rejects.toThrow("Verifikasi signature dompet Solana gagal.");
  });
});
