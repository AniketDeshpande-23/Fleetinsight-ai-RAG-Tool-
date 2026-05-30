"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/utils";
import { Settings, Mail, Cpu, CheckCircle, XCircle, Send } from "lucide-react";

interface EmailConfig {
  provider: string;
  smtp: { host: string; port: number; username: string; from_address: string; configured: boolean };
  graph_api: { tenant_id: string; client_id: string; user_email: string; configured: boolean };
  recipients: { maintenance: string; safety: string; delivery: string };
}
interface LLMConfig {
  provider: string;
  ollama: { model: string; base_url: string };
  claude: { model: string; configured: boolean };
  openai: { model: string; configured: boolean };
}

export default function SettingsPage() {
  const [email, setEmail] = useState<EmailConfig | null>(null);
  const [llm, setLLM] = useState<LLMConfig | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    apiFetch<{ ok: boolean } & EmailConfig>("/api/settings/email").then((r) => setEmail(r as any)).catch(() => {});
    apiFetch<{ ok: boolean } & LLMConfig>("/api/settings/llm").then((r) => setLLM(r as any)).catch(() => {});
  }, []);

  const testEmail = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await apiFetch("/api/settings/email/test", { method: "POST" });
      setTestResult({ ok: true, msg: "Connection successful" });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message || "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const Row = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm text-slate-300 ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );

  const Badge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );

  return (
    <div className="flex-1 p-8 overflow-y-auto max-w-3xl">
      <div className="flex items-center gap-2 mb-1">
        <Settings className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuration</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Connector Settings</h1>
      <p className="text-slate-400 text-sm mb-8">Configure email connectors and LLM providers via the <code className="text-violet-400 bg-slate-800 px-1 rounded">.env</code> file and restart the backend.</p>

      {/* Email connector */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-300">Email Connector</h2>
          </div>
          {email && (
            <Badge ok={email.provider === "smtp" ? email.smtp.configured : email.graph_api.configured} label={email.provider.toUpperCase()} />
          )}
        </div>
        <div className="px-6">
          {email ? (
            <>
              <Row label="Active Provider" value={email.provider === "graph_api" ? "Microsoft Graph API (Outlook)" : "SMTP"} />
              {email.provider === "smtp" ? (
                <>
                  <Row label="SMTP Host" value={email.smtp.host} mono />
                  <Row label="SMTP Port" value={String(email.smtp.port)} mono />
                  <Row label="Username" value={email.smtp.username ? email.smtp.username.slice(0, 4) + "****" : "Not set"} mono />
                  <Row label="From Address" value={email.smtp.from_address} mono />
                </>
              ) : (
                <>
                  <Row label="Tenant ID" value={email.graph_api.tenant_id ? email.graph_api.tenant_id.slice(0, 8) + "…" : "Not set"} mono />
                  <Row label="Client ID" value={email.graph_api.client_id ? email.graph_api.client_id.slice(0, 8) + "…" : "Not set"} mono />
                  <Row label="User Email" value={email.graph_api.user_email} mono />
                </>
              )}
              <Row label="Maintenance Recipients" value={email.recipients.maintenance || "Not configured"} />
              <Row label="Safety Recipients" value={email.recipients.safety || "Not configured"} />
              <Row label="Delivery Recipients" value={email.recipients.delivery || "Not configured"} />
            </>
          ) : (
            <p className="py-4 text-slate-500 text-sm">Loading…</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-800 flex items-center gap-3">
          <button onClick={testEmail} disabled={testing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            <Send className="w-4 h-4" />
            {testing ? "Testing…" : "Test Connection"}
          </button>
          {testResult && (
            <span className={`text-sm ${testResult.ok ? "text-emerald-400" : "text-red-400"}`}>
              {testResult.ok ? "✓" : "✗"} {testResult.msg}
            </span>
          )}
        </div>
      </div>

      {/* LLM config */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-300">LLM Provider</h2>
          </div>
          {llm && <Badge ok label={llm.provider.toUpperCase()} />}
        </div>
        <div className="px-6">
          {llm ? (
            <>
              <Row label="Active Provider" value={llm.provider} />
              <Row label="Ollama Model" value={llm.ollama.model} mono />
              <Row label="Ollama URL" value={llm.ollama.base_url} mono />
              <Row label="Claude Model" value={llm.claude.model} mono />
              <Row label="Claude API Key" value={llm.claude.configured ? "Configured ✓" : "Not set"} />
              <Row label="OpenAI Model" value={llm.openai.model} mono />
              <Row label="OpenAI API Key" value={llm.openai.configured ? "Configured ✓" : "Not set"} />
            </>
          ) : (
            <p className="py-4 text-slate-500 text-sm">Loading…</p>
          )}
        </div>
      </div>

      {/* .env reference */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">How to configure</p>
        <ol className="space-y-2 text-sm text-slate-400 list-decimal list-inside">
          <li>Copy <code className="text-violet-400 bg-slate-800 px-1 rounded">.env.example</code> to <code className="text-violet-400 bg-slate-800 px-1 rounded">.env</code> in the project root</li>
          <li>Set <code className="text-violet-400 bg-slate-800 px-1 rounded">EMAIL_PROVIDER=smtp</code> (or <code className="text-violet-400 bg-slate-800 px-1 rounded">graph_api</code> for Outlook)</li>
          <li>Fill in SMTP credentials or Azure app registration details</li>
          <li>Set <code className="text-violet-400 bg-slate-800 px-1 rounded">LLM_PROVIDER=ollama</code> (default) or <code className="text-violet-400 bg-slate-800 px-1 rounded">claude</code> / <code className="text-violet-400 bg-slate-800 px-1 rounded">openai</code></li>
          <li>Restart backend: <code className="text-violet-400 bg-slate-800 px-1 rounded">uvicorn backend.main:app --reload</code></li>
        </ol>
      </div>
    </div>
  );
}
