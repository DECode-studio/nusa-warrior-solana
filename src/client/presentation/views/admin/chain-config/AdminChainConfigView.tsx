"use client";

import React from "react";
import { AdminSettingsSolanaRpcSection } from "@/client/presentation/views/admin/settings/components/AdminSettingsSolanaRpcSection";

export function AdminChainConfigView(): React.ReactElement {
  return (
    <div id="admin-chain-config-view-root" className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          SOLANA INFRASTRUCTURE
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">
          Chain Config
        </h1>
        <p className="mt-1 text-sm text-white/65">
          Kelola daftar Solana RPC endpoint untuk Round-Robin &amp; failover otomatis di server tanpa perlu mengubah kode atau .env.
        </p>
      </div>

      <AdminSettingsSolanaRpcSection />
    </div>
  );
}
