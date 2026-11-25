"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { ROUTES } from "@/core/constants/routes";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import { useTranslator } from "@/core/translator";

export interface UseUserLoginReturn {
  readonly connected: boolean;
  readonly walletAddress: string | null;
  readonly walletName: string | null;
  readonly loading: boolean;
  readonly needsNickname: boolean;
  readonly nickname: string;
  readonly setNickname: (value: string) => void;
  readonly errorMsg: string | null;
  readonly startSolanaSignIn: () => Promise<void>;
  readonly submitNickname: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  readonly disconnectWallet: () => Promise<void>;
}

export function useUserLogin(): UseUserLoginReturn {
  const router = useRouter();
  const { locale, t } = useTranslator();
  const { publicKey, connected, wallet, signMessage, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [loading, setLoading] = useState(false);
  const [needsNickname, setNeedsNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pendingSignRef = useRef(false);

  const walletAddress = publicKey ? publicKey.toBase58() : null;
  const walletName = wallet?.adapter.name ?? null;

  const signAndVerify = useCallback(async (): Promise<void> => {
    if (!publicKey) return;
    if (!signMessage) {
      setErrorMsg(t("login.walletSignUnsupported"));
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      const address = publicKey.toBase58();
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      const challenge = await authUseCase.requestSolanaNonce(address);
      const messageBytes = new TextEncoder().encode(challenge.message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      const result = await authUseCase.verifySolanaSignature({
        walletAddress: address,
        signature,
      });

      if (result.status === "NEEDS_NICKNAME") {
        setNeedsNickname(true);
        return;
      }

      router.push(ROUTES.USER_DASHBOARD(locale));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("login.solanaAuthFailed");
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [locale, publicKey, router, signMessage, t]);

  useEffect(() => {
    if (pendingSignRef.current && connected && publicKey && signMessage) {
      pendingSignRef.current = false;
      void signAndVerify();
    }
  }, [connected, publicKey, signAndVerify, signMessage]);

  const startSolanaSignIn = useCallback(async (): Promise<void> => {
    setErrorMsg(null);
    if (!connected || !publicKey) {
      pendingSignRef.current = true;
      setVisible(true);
      return;
    }
    await signAndVerify();
  }, [connected, publicKey, setVisible, signAndVerify]);

  const submitNickname = useCallback(
    async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const trimmed = nickname.trim();
      if (trimmed.length < 2 || trimmed.length > 32) {
        setErrorMsg(t("login.nicknameValidation"));
        return;
      }

      setErrorMsg(null);
      setLoading(true);
      try {
        const authUseCase = getService(AUTH_USECASE_TOKEN);
        await authUseCase.completeSolanaRegistration({ nickname: trimmed });
        router.push(ROUTES.USER_DASHBOARD(locale));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : t("login.solanaAuthFailed");
        setErrorMsg(message);
      } finally {
        setLoading(false);
      }
    },
    [locale, nickname, router, t]
  );

  const disconnectWallet = useCallback(async (): Promise<void> => {
    pendingSignRef.current = false;
    setNeedsNickname(false);
    setNickname("");
    setErrorMsg(null);
    await disconnect();
  }, [disconnect]);

  return {
    connected,
    walletAddress,
    walletName,
    loading,
    needsNickname,
    nickname,
    setNickname,
    errorMsg,
    startSolanaSignIn,
    submitNickname,
    disconnectWallet,
  };
}
