import React from 'react';
import { ShieldCheck, AlertTriangle, Moon, Sun, Lock, ShieldAlert } from 'lucide-react';

export default function Navbar({ settings, darkMode, setDarkMode, onSeedDemo }) {
  const isDryRun = settings?.DRY_RUN ?? true;
  const isLegalReviewed = settings?.LEGAL_REVIEWED_TEMPLATES ?? false;

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
      {/* Statutory DPDP Enactment Timeline Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-indigo-100 text-[11px] py-1.5 px-4 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <span className="font-semibold text-amber-300">⚖️ DPDP Timeline:</span>
          <span>Rules Notified: <strong>13 Nov 2025</strong></span>
          <span className="opacity-40">|</span>
          <span>Consent Manager: <strong>13 Nov 2026</strong></span>
          <span className="opacity-40">|</span>
          <span>Full Obligations: <strong>13 May 2027</strong></span>
          <span className="text-amber-300/80 italic ml-2">
            (Dates to be confirmed against the Rules, 2025 before go-live)
          </span>
        </div>
        <div className="text-[10px] text-slate-400 shrink-0 hidden md:block">
          Section 33 Penalties up to ₹250 Cr
        </div>
      </div>

      {/* Legal Sign-off Warning Banner (Red banner if off) */}
      {!isLegalReviewed && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-300 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              <strong>Legal Sign-Off Gate Active:</strong> "Legal reviewed message templates" is currently OFF in Settings. Real sending is locked until General Counsel or DPO approval is toggled.
            </span>
          </div>
          <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Review Required
          </span>
        </div>
      )}

      {/* Main Bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* DRY RUN Mode Badge */}
          {isDryRun ? (
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Safe Mode: <strong>DRY_RUN=true</strong> (Outbox Only)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Live Sending Active (SMTP)</span>
            </div>
          )}

          {/* Groq Model Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs text-slate-600 dark:text-slate-300 font-mono">
            <span>LLM:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {settings?.GROQ_MODEL || "llama-3.3-70b-versatile"}
            </span>
            {settings?.GROQ_API_KEY_CONFIGURED ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Groq API Connected"></span>
            ) : (
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-500">Offline Template Fallback</span>
            )}
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSeedDemo}
            className="text-xs bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5"
            title="Reload realistic demo dataset with prospects, verified contacts, drafts, and replies"
          >
            <span>🌱 Seed Demo</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
