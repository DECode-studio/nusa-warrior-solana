import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { assertSameOriginMutation } from "@/server/shared/auth/request-security";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { parseJsonWithSchema } from "@/server/shared/validation/zod-helpers";
import { AppError } from "@/server/shared/errors/app-error";
import { getSolanaNetwork } from "@/server/modules/solana/solana-config";
import { buildMintTokenTransaction } from "@/server/modules/solana/nusa-token.service";

const faucetSchema = z.object({
  walletAddress: z.string().trim().min(32).max(64),
  symbol: z.enum(["IDRC", "USDC"]),
  amount: z.number().positive().optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOriginMutation(request);
    if (getSolanaNetwork() === "mainnet-beta") {
      throw AppError.badRequest(
        "Faucet token POC hanya tersedia pada jaringan Devnet/Testnet."
      );
    }

    const parsed = await parseJsonWithSchema(request, faucetSchema, 4096);
    try {
      new PublicKey(parsed.walletAddress);
    } catch {
      throw AppError.badRequest("Alamat wallet Solana tidak valid.");
    }

    await enforceRateLimit(`solana:token-faucet:${parsed.walletAddress}`, {
      capacity: 5,
      refillPerSecond: 1 / 30,
    });

    const maxAmount = parsed.symbol === "IDRC" ? 1_000_000 : 100;
    const defaultAmount = parsed.symbol === "IDRC" ? 100_000 : 10;
    const uiAmount = Math.min(maxAmount, parsed.amount ?? defaultAmount);

    const txResult = await buildMintTokenTransaction({
      recipientWallet: parsed.walletAddress,
      symbol: parsed.symbol,
      uiAmount,
    });

    return okResponse({
      symbol: parsed.symbol,
      amount: uiAmount,
      walletAddress: parsed.walletAddress,
      ...txResult,
    });
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
