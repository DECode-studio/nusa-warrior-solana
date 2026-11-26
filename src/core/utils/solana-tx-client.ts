"use client";

import type { Connection } from "@solana/web3.js";
import { Transaction } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";

export async function confirmSolanaSignature(
  connection: Connection,
  signature: string
): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const res = await connection.getSignatureStatuses([signature]);
    const status = res?.value?.[0];
    if (status?.err) {
      throw new Error(`Transaksi Solana gagal: ${JSON.stringify(status.err)}`);
    }
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  throw new Error(`Konfirmasi transaksi '${signature}' timeout.`);
}

export async function sendBase64SolanaTx(input: {
  serializedTransaction: string;
  connection: Connection;
  signTransaction?: WalletContextState["signTransaction"];
  sendTransaction: WalletContextState["sendTransaction"];
}): Promise<string> {
  const rawBytes = Uint8Array.from(atob(input.serializedTransaction), (c) =>
    c.charCodeAt(0)
  );
  const tx = Transaction.from(rawBytes);
  // @solana/web3.js@3.x makes tx.serialize() async, while Wallet Standard
  // adapters call tx.serialize() synchronously to extract wire bytes.
  (tx as unknown as { serialize: () => Uint8Array }).serialize = () => rawBytes;

  let signature: string;
  if (input.signTransaction) {
    const signedTx = await input.signTransaction(tx);
    const signedRaw = await signedTx.serialize();
    signature = await input.connection.sendRawTransaction(signedRaw, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
  } else {
    signature = await input.sendTransaction(tx, input.connection);
  }

  await confirmSolanaSignature(input.connection, signature);
  return signature;
}
