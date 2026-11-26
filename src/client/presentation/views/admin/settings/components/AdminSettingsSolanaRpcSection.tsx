"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Globe, Plus, Power, Trash2 } from "lucide-react";

interface RpcEndpointItem {
  id: string;
  label: string;
  url: string;
  network: string;
  isActive: boolean;
  priority: number;
}

export function AdminSettingsSolanaRpcSection(): React.ReactElement {
  const [network, setNetwork] = useState("devnet");
  const [endpoints, setEndpoints] = useState<RpcEndpointItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadEndpoints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/solana/rpc", {
        credentials: "include",
      });
      const json = (await res.json()) as {
        data?: { network?: string; endpoints?: RpcEndpointItem[] };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memuat daftar Solana RPC.");
      }
      setNetwork(json.data?.network ?? "devnet");
      setEndpoints(json.data?.endpoints ?? []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat daftar Solana RPC."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEndpoints();
  }, [loadEndpoints]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/solana/rpc", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          url: url.trim(),
          network,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal menambahkan RPC.");
      }
      setLabel("");
      setUrl("");
      await loadEndpoints();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan RPC.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: RpcEndpointItem) => {
    setError(null);
    const res = await fetch("/api/v1/admin/solana/rpc", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
    });
    if (res.ok) {
      await loadEndpoints();
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const res = await fetch("/api/v1/admin/solana/rpc", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await loadEndpoints();
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Globe className="h-4 w-4 text-amber-400" />
            <span>Solana RPC Round-Robin Pool ({network})</span>
          </h3>
          <p className="mt-1 text-xs text-white/60">
            Endpoint aktif akan diputar secara Round-Robin di server (`/api/v1/solana/rpc`) dengan failover otomatis jika terkena 429.
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (mis. Helius Devnet)"
          className="sm:col-span-4 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40"
          required
        />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://devnet.helius-rpc.com/?api-key=..."
          className="sm:col-span-6 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40"
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>{saving ? "Menyimpan..." : "Tambah RPC"}</span>
        </button>
      </form>

      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-xs text-white/50">Memuat daftar RPC...</p>
      ) : endpoints.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
          Belum ada RPC tersimpan di database. Saat ini server menggunakan fallback default cluster ({network}).
        </p>
      ) : (
        <div className="space-y-2">
          {endpoints.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3.5 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {item.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.isActive
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {item.isActive ? "ACTIVE" : "DISABLED"}
                  </span>
                  <span className="text-[11px] text-white/45">
                    {item.network}
                  </span>
                </div>
                <p className="truncate font-mono text-xs text-white/60">
                  {item.url}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleToggle(item)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-xs text-white/80 hover:bg-white/10"
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>{item.isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
