import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  Save,
  Trash2,
  Lock,
  Unlock,
  Key,
  Calendar,
  Clock,
  Send,
  Building,
  Mail
} from 'lucide-react';

export default function Settings({ onSettingsUpdated }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groqKey, setGroqKey] = useState('');
  const [primaryModel, setPrimaryModel] = useState('openai/gpt-oss-20b');
  const [fallbackModel, setFallbackModel] = useState('llama-3.1-8b-instant');
  const [dailyCap, setDailyCap] = useState(30);
  const [spacing, setSpacing] = useState(45);
  const [dryRun, setDryRun] = useState(true);
  const [legalReviewed, setLegalReviewed] = useState(false);
  const [senderName, setSenderName] = useState('Aakash Verma');
  const [senderCompany, setSenderCompany] = useState('RegulationFlow Technologies Pvt. Ltd.');
  const [senderRole, setSenderRole] = useState('Solutions Lead - DPDPFlow');
  const [senderEmail, setSenderEmail] = useState('aakash@dpdpflow.com');
  const [senderAddress, setSenderAddress] = useState('Level 4, HustleHub Tech Park, HSR Layout, Bengaluru 560102');
  const [sendingDomain, setSendingDomain] = useState('mail.dpdpflow.com');
  const [calendarUrl, setCalendarUrl] = useState('https://cal.com/dpdpflow/compliance-audit-demo');
  const [retentionDays, setRetentionDays] = useState(90);
  const { addToast } = useToast();

  const loadSettings = async () => {
    try {
      setLoading(true);
      const s = await api.getSettings();
      setSettings(s);
      setPrimaryModel(s.GROQ_MODEL);
      setFallbackModel(s.GROQ_FALLBACK_MODEL);
      setDailyCap(s.DAILY_CAP);
      setSpacing(s.SEND_SPACING_SECONDS);
      setDryRun(s.DRY_RUN);
      setLegalReviewed(s.LEGAL_REVIEWED_TEMPLATES);
      setSenderName(s.SENDER_NAME);
      setSenderCompany(s.SENDER_COMPANY);
      setSenderRole(s.SENDER_ROLE);
      setSenderEmail(s.SENDER_EMAIL);
      setSenderAddress(s.SENDER_ADDRESS);
      setSendingDomain(s.SENDING_DOMAIN);
      setCalendarUrl(s.CALENDAR_URL);
      setRetentionDays(s.RETENTION_DAYS);
    } catch (err) {
      addToast(`Error loading settings: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    // Guard: Legal toggle check before DRY_RUN can be turned off
    if (!dryRun && !legalReviewed) {
      addToast('Legal Sign-off Gate: You must toggle "Legal reviewed message templates" ON before disabling DRY_RUN.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        GROQ_MODEL: primaryModel,
        GROQ_FALLBACK_MODEL: fallbackModel,
        DAILY_CAP: parseInt(dailyCap, 10),
        SEND_SPACING_SECONDS: parseInt(spacing, 10),
        DRY_RUN: dryRun,
        LEGAL_REVIEWED_TEMPLATES: legalReviewed,
        SENDER_NAME: senderName,
        SENDER_COMPANY: senderCompany,
        SENDER_ROLE: senderRole,
        SENDER_EMAIL: senderEmail,
        SENDER_ADDRESS: senderAddress,
        SENDING_DOMAIN: sendingDomain,
        CALENDAR_URL: calendarUrl,
        RETENTION_DAYS: parseInt(retentionDays, 10),
      };

      if (groqKey.trim()) {
        payload.GROQ_API_KEY = groqKey.trim();
      }

      const updated = await api.updateSettings(payload);
      setSettings(updated);
      setGroqKey('');
      addToast('Settings successfully updated.', 'success');
      if (onSettingsUpdated) onSettingsUpdated(updated);
    } catch (err) {
      addToast(`Failed to update settings: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRetentionCleanup = async () => {
    if (!window.confirm(`Run automated data minimisation cleanup for unengaged prospects older than ${retentionDays} days?`)) {
      return;
    }
    try {
      const res = await api.runRetentionCleanup();
      addToast(`Section 8(7) Cleanup: Purged ${res.purged_count} unengaged prospects. Audit trail logged.`, 'success');
    } catch (err) {
      addToast(`Cleanup failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>System & Legal Compliance Configuration</span>
          <span className="text-xs font-mono font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
            DPDP Controls
          </span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage sending thresholds, LLM parameters, mandatory legal notice disclosures, and retention gates.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Legal Sign-Off Gate Card */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            legalReviewed
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {legalReviewed ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Legal Review Gate: Message Templates Sign-Off
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Mandatory compliance gate: Live sends (DRY_RUN=false) cannot be enabled without explicit legal sign-off from General Counsel or DPO.
              </p>
            </div>

            {/* Toggle */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={legalReviewed}
                onChange={(e) => setLegalReviewed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Safety Mode: DRY_RUN Switch */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Safe Mode: DRY_RUN Active
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                DEFAULT=TRUE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-lg">
              When ON, no emails leave the machine. Messages are recorded to the local outbox table for full audit inspection.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => {
                if (!e.target.checked && !legalReviewed) {
                  addToast('You must turn on "Legal reviewed message templates" first!', 'error');
                  return;
                }
                setDryRun(e.target.checked);
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Groq LLM API Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Groq LLM Configuration</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Groq API Key {settings?.GROQ_API_KEY_CONFIGURED ? '(Configured in .env)' : '(Not Set - Using Offline Fallback)'}
              </label>
              <input
                type="password"
                placeholder={settings?.GROQ_API_KEY_CONFIGURED ? '••••••••••••••••••••••••••••••••' : 'gsk_... (Paste your Groq API key here)'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Get a free API key at console.groq.com. Offline deterministic fallback is active if omitted.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Primary Model
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPrimaryModel('openai/gpt-oss-20b')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
                    >
                      openai/gpt-oss-20b
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setPrimaryModel('llama-3.3-70b-versatile')}
                      className="text-slate-500 hover:underline font-mono"
                    >
                      llama-3.3-70b
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={primaryModel}
                  onChange={(e) => setPrimaryModel(e.target.value)}
                  placeholder="openai/gpt-oss-20b"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Fast Fallback Model (Rate Limit 429)
                </label>
                <input
                  type="text"
                  value={fallbackModel}
                  onChange={(e) => setFallbackModel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sending Caps & Spacing */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            <span>Pacing & Domain Daily Caps</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Daily Cap Per Sending Domain (Max 50)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={dailyCap}
                  onChange={(e) => setDailyCap(e.target.value)}
                  className="flex-1"
                />
                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 w-12 text-right">
                  {dailyCap}/day
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Send Spacing (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={spacing}
                onChange={(e) => setSpacing(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Mandatory DPDP Notice Sender Identity */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Mandatory Statutory Notice Disclosures (Section 5)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Representative Name
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={senderCompany}
                onChange={(e) => setSenderCompany(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Registered Physical Address
              </label>
              <input
                type="text"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Calendar Booking URL (For Interested Replies)
              </label>
              <input
                type="url"
                value={calendarUrl}
                onChange={(e) => setCalendarUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 8(7) Retention & Cleanup */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Data Minimisation Retention Limit (Section 8(7))
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Purges prospects with no engagement after {retentionDays} days to comply with statutory erasure.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRetentionCleanup}
            className="px-4 py-2 text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Run 90-Day Retention Cleanup</span>
          </button>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
