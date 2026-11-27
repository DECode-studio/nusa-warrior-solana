"use client";

import type { Connection } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("429") || msg.includes("Too Many Requests");
}

function isBlockhashNotFoundError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("Blockhash not found") || msg.includes("BlockhashNotFound");
}

async function fetchFreshConfirmedBlockhash(
  connection: Connection
): Promise<SolanaBlockhash | undefined> {
  try {
    const result = await connection.getLatestBlockhash("confirmed");
    return result.blockhash;
  } catch (error: unknown) {
    if (isRateLimitError(error)) {
      await sleep(600);
      return connection
        .getLatestBlockhash("confirmed")
        .then((result) => result.blockhash)
        .catch(() => undefined);
    }
    return undefined;
  }
}

export async function confirmSolanaSignatures(
  connection: Connection,
  signatures: string[],
  maxAttempts = 45,
  intervalMs = 1500
): Promise<void> {
  const pending = new Set(signatures);
  if (pending.size === 0) return;
  await sleep(1200);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (pending.size === 0) return;
    const pendingList = [...pending];
    let res: Awaited<ReturnType<Connection["getSignatureStatuses"]>>;
    try {
      res = await connection.getSignatureStatuses(pendingList);
    } catch (error: unknown) {
      if (isRateLimitError(error)) {
        await sleep(2000);
        continue;
      }
      throw error;
    }
    const statuses = res?.value ?? [];
    for (let i = 0; i < pendingList.length; i += 1) {
      const sig = pendingList[i];
      const status = statuses[i];
      if (status?.err) {
        throw new Error(
          `Transaksi Solana '${sig}' gagal: ${JSON.stringify(status.err)}`
        );
      }
      if (
        status?.confirmationStatus === "confirmed" ||
        status?.confirmationStatus === "finalized"
      ) {
        pending.delete(sig);
      }
    }
    if (pending.size === 0) return;
    await sleep(intervalMs);
  }
  throw new Error(
    `Konfirmasi transaksi '${[...pending].join(", ")}' timeout.`
  );
}

export async function confirmSolanaSignature(
  connection: Connection,
  signature: string
): Promise<void> {
  await confirmSolanaSignatures(connection, [signature]);
}

type SolanaBlockhash = Transaction["recentBlockhash"];

async function prepareBase64Transaction(
  b64: string,
  freshBlockhash?: SolanaBlockhash
): Promise<{ tx: Transaction; expectedBlockhash: SolanaBlockhash }> {
  const rawBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const tx = Transaction.from(rawBytes);
  const hasExistingSignature = tx.signatures.some(
    (entry) => entry.signature !== null
  );

  if (freshBlockhash && !hasExistingSignature) {
    tx.recentBlockhash = freshBlockhash;
    // @solana/web3.js@3.x makes tx.serialize() async, while Wallet Standard
    // adapters call tx.serialize() synchronously to extract wire bytes.
    const refreshedBytes = await tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    (tx as unknown as { serialize: () => Uint8Array }).serialize = () =>
      refreshedBytes;
    return { tx, expectedBlockhash: freshBlockhash };
  }

  (tx as unknown as { serialize: () => Uint8Array }).serialize = () => rawBytes;
  return { tx, expectedBlockhash: tx.recentBlockhash };
}

async function sendSignedRawWithRetry(input: {
  connection: Connection;
  signedRaw: Uint8Array;
  signedBlockhash?: SolanaBlockhash;
  expectedBlockhash?: SolanaBlockhash;
}): Promise<string> {
  const rateLimitDelays = [2000, 4000, 6000];
  let blockhashRetries = 0;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await input.connection.sendRawTransaction(input.signedRaw, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: BigInt(3),
      });
    } catch (error: unknown) {
      if (isRateLimitError(error)) {
        if (attempt < 3) {
          await sleep(rateLimitDelays[attempt] ?? 6000);
          continue;
        }
        throw new Error(
          "RPC Solana sedang padat (429 Too Many Requests). Tunggu beberapa detik lalu coba lagi."
        );
      }
      if (!isBlockhashNotFoundError(error)) {
        throw error;
      }
      if (
        input.signedBlockhash &&
        input.expectedBlockhash &&
        input.signedBlockhash !== input.expectedBlockhash
      ) {
        throw new Error(
          "Dompet Solana mengganti blockhash transaksi. Pastikan jaringan dompet (Phantom/Solflare) diatur ke Solana Devnet, bukan Mainnet, lalu coba lagi."
        );
      }
      if (blockhashRetries < 2) {
        blockhashRetries += 1;
        await sleep(700);
        continue;
      }
      throw new Error(
        "Blockhash transaksi kedaluwarsa atau belum sinkron di RPC Devnet. Klik 'Tanda Tangani & Kunci Kartu ke Vault' lagi untuk mengambil blockhash baru."
      );
    }
  }
  throw new Error(
    "RPC Solana sedang padat (429 Too Many Requests). Tunggu beberapa detik lalu coba lagi."
  );
}

export async function sendBase64SolanaTx(input: {
  serializedTransaction: string;
  connection: Connection;
  signTransaction?: WalletContextState["signTransaction"];
  sendTransaction: WalletContextState["sendTransaction"];
}): Promise<string> {
  const freshBlockhash = await fetchFreshConfirmedBlockhash(input.connection);
  const { tx, expectedBlockhash } = await prepareBase64Transaction(
    input.serializedTransaction,
    freshBlockhash
  );

  let signature: string;
  if (input.signTransaction) {
    const signedTx = await input.signTransaction(tx);
    const signedRaw = await signedTx.serialize();
    signature = await sendSignedRawWithRetry({
      connection: input.connection,
      signedRaw,
      signedBlockhash: signedTx.recentBlockhash,
      expectedBlockhash,
    });
  } else {
    signature = await input.sendTransaction(tx, input.connection, {
      preflightCommitment: "confirmed",
    });
  }

  await confirmSolanaSignature(input.connection, signature);
  return signature;
}

export async function sendBatchBase64SolanaTxs(input: {
  serializedTransactions: string[];
  connection: Connection;
  signAllTransactions?: WalletContextState["signAllTransactions"];
  signTransaction?: WalletContextState["signTransaction"];
  sendTransaction: WalletContextState["sendTransaction"];
}): Promise<string[]> {
  if (input.serializedTransactions.length === 0) return [];

  if (input.signAllTransactions) {
    // Transactions returned by server /prepare already carry a fresh "confirmed" blockhash.
    const prepared = await Promise.all(
      input.serializedTransactions.map((b64) => prepareBase64Transaction(b64))
    );
    const signedTxs = await input.signAllTransactions(
      prepared.map((item) => item.tx)
    );
    const signatures: string[] = [];
    for (let i = 0; i < signedTxs.length; i += 1) {
      if (i > 0) {
        await sleep(1200);
      }
      const signedTx = signedTxs[i];
      const signedRaw = await signedTx.serialize();
      const sig = await sendSignedRawWithRetry({
        connection: input.connection,
        signedRaw,
        signedBlockhash: signedTx.recentBlockhash,
        expectedBlockhash: prepared[i]?.expectedBlockhash,
      });
      signatures.push(sig);
    }
    await confirmSolanaSignatures(input.connection, signatures);
    return signatures;
  }

  const signatures: string[] = [];
  for (const serializedTransaction of input.serializedTransactions) {
    const sig = await sendBase64SolanaTx({
      serializedTransaction,
      connection: input.connection,
      signTransaction: input.signTransaction,
      sendTransaction: input.sendTransaction,
    });
    signatures.push(sig);
  }
  return signatures;
}
