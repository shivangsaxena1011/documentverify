"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  Shield,
  Clock,
  Terminal,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function ApiAccessPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKeyData, setNewKeyData] = useState<any | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/api-keys");
      const json = await res.json();
      if (json.success) setApiKeys(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      const json = await res.json();
      if (json.success) {
        setNewKeyData(json.data);
        setKeyName("");
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API credential? Integrations using this key will immediately fail.")) return;
    try {
      await fetch(`/api/api-keys?id=${id}`, { method: "DELETE" });
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                API Credentials & Integration Gateway
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-semibold">
                REST v1
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate institutional Bearer keys for programmatic document scanning, OCR, and verification.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New API Key</span>
          </button>
        </div>

        {/* Once-Displayed Secret Banner */}
        {newKeyData && (
          <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">
                New API Credential Generated: {newKeyData.name}
              </span>
              <button
                onClick={() => setNewKeyData(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Dismiss
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Copy this private key immediately. Under enterprise zero-knowledge credential policies, it cannot be displayed again.
            </p>
            <div className="p-3 rounded-lg bg-black/60 border border-emerald-700 flex items-center justify-between font-mono text-xs text-emerald-400">
              <span>{newKeyData.secretKey}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newKeyData.secretKey);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-white text-xs flex items-center gap-1"
              >
                {copiedSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSecret ? "Copied" : "Copy Secret"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing API Keys Table */}
        <div className="p-5 rounded-xl bg-surface-100 border border-border space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 pb-2 border-b border-border">
            Active Institutional API Keys
          </h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading credentials...</div>
          ) : apiKeys.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No API keys configured yet. Generate a key to integrate TRISHUL Document Intelligence with external services.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-slate-400 uppercase font-mono text-[10px]">
                    <th className="pb-2.5">Key Name / Identifier</th>
                    <th className="pb-2.5">Prefix Token</th>
                    <th className="pb-2.5">Authorized Scopes</th>
                    <th className="pb-2.5">Last Activity</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-surface-200/50">
                      <td className="py-3 font-semibold text-slate-200">{k.name}</td>
                      <td className="py-3 font-mono text-slate-400">{k.keyPrefix}</td>
                      <td className="py-3 font-mono text-slate-400 text-[11px]">{k.scopes}</td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                            k.isActive
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}
                        >
                          {k.isActive ? "ACTIVE" : "REVOKED"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {k.isActive && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/40"
                            title="Revoke Key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Interactive API Endpoint Documentation */}
        <div className="p-6 rounded-2xl bg-surface-100 border border-border space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-400" />
              <span>Programmatic Document Screening Endpoint</span>
            </h3>
            <span className="font-mono text-[11px] text-blue-400 font-bold">
              POST /api/v1/screening/analyze
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-slate-400">
              Submit identity document images as base64 or multipart form payloads to receive structured fields, forensic indicators, and risk scores:
            </p>

            {/* Curl Example */}
            <div className="p-4 rounded-xl bg-black/60 border border-border font-mono text-xs text-slate-300 overflow-x-auto">
              <span className="text-slate-500"># cURL Ingestion Request</span>
              <pre className="text-blue-300 mt-1">
{`curl -X POST https://your-domain.com/api/v1/screening/analyze \\
  -H "Authorization: Bearer trishul_live_sec_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "data:image/jpeg;base64,...",
    "documentType": "PAN_CARD"
  }'`}
              </pre>
            </div>
          </div>
        </div>

        {/* Key Creation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-surface-100 border border-border rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-white text-sm">Generate Enterprise API Key</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Key Name / Integration System</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g., Hotel PMS Ingestion Service"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-surface-200 text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                  >
                    Generate Credential
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
