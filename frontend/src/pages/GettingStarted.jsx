import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Key,
  BookOpen,
  Upload,
  UserCheck,
  ShieldCheck,
  FileText,
  CheckSquare,
  Send,
  MessageSquare
} from 'lucide-react';

export default function GettingStarted({ setActiveTab, onSeedDemo }) {
  const [settings, setSettings] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
      const m = await api.getMetrics();
      setMetrics(m);
    } catch (err) {
      console.error(err);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Configure Groq API Key (Optional for Demo)",
      desc: "Add your free Groq API key in .env or Settings. Offline deterministic template fallback is active so the full app demos immediately.",
      done: Boolean(settings?.GROQ_API_KEY_CONFIGURED),
      actionLabel: "Configure in Settings",
      action: () => setActiveTab("settings"),
      icon: Key
    },
    {
      id: 2,
      title: "Ingest DPDP Act 2023 & DPDPFlow Facts",
      desc: "Parse statutory sections, timelines, and product capabilities into the local BM25 retrieval index.",
      done: true, // Always ingested in seed/data
      actionLabel: "View Knowledge Map",
      action: () => addToast("DPDP Act summary and DPDPFlow facts are active in backend/data/knowledge/.", "info"),
      icon: BookOpen
    },
    {
      id: 3,
      title: "Import Prospects (CSV / Demo Dataset)",
      desc: "Import high-growth Indian tech prospects. System enforces ICP filter (India, 50-5k staff, tech sectors, mandatory lawful basis).",
      done: (metrics?.funnel?.[0]?.count ?? 0) > 0,
      actionLabel: "Import Prospects",
      action: () => setActiveTab("prospects"),
      icon: Upload
    },
    {
      id: 4,
      title: "Enrich & Verify Work Deliverability",
      desc: "Validates corporate email syntax and DNS MX records. Rejects consumer domains (gmail.com, yahoo.com) and phone fields.",
      done: (metrics?.funnel?.[1]?.count ?? 0) > 0,
      actionLabel: "Verify Emails",
      action: () => setActiveTab("prospects"),
      icon: UserCheck
    },
    {
      id: 5,
      title: "Run Statutory Compliance Clearance",
      desc: "Checks central suppression list, verifies lawful basis (s.3(c)(ii)(A), s.7(a), s.6), and clears prospects for drafting.",
      done: (metrics?.funnel?.[2]?.count ?? 0) > 0,
      actionLabel: "Compliance Gate",
      action: () => setActiveTab("prospects"),
      icon: ShieldCheck
    },
    {
      id: 6,
      title: "Generate Personalized Drafts (Writer Agent)",
      desc: "Generates 90–120 word emails and <=300 character LinkedIn notes citing retrieved sections. Strict Fact-Checker runs.",
      done: (metrics?.funnel?.[3]?.count ?? 0) > 0,
      actionLabel: "Generate Drafts",
      action: () => setActiveTab("drafts"),
      icon: FileText
    },
    {
      id: 7,
      title: "Human Review & Batch Approvals",
      desc: "Approve, edit, or reject drafts with keyboard shortcuts (A/E/R). Edits are saved as few-shot examples for subsequent generations.",
      done: (metrics?.funnel?.[4]?.count ?? 0) > 0,
      actionLabel: "Open Review Queue",
      action: () => setActiveTab("drafts"),
      icon: CheckSquare
    },
    {
      id: 8,
      title: "Safe Dry-Run Dispatch to Local Outbox",
      desc: "Sends approved emails respecting daily caps and pacing. DRY_RUN=true writes messages to local outbox folder with 1-click unsubscribe.",
      done: (metrics?.funnel?.[5]?.count ?? 0) > 0,
      actionLabel: "View Outbox",
      action: () => setActiveTab("send-queue"),
      icon: Send
    },
    {
      id: 9,
      title: "Track Replies & Auto-Suppress Opt-Outs",
      desc: "Simulate or paste incoming replies. Opt-outs automatically suppress without manual review. Interested leads routed to demo calendar.",
      done: (metrics?.funnel?.[6]?.count ?? 0) > 0,
      actionLabel: "Test Reply Classifier",
      action: () => setActiveTab("replies"),
      icon: MessageSquare
    }
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Getting Started Checklist</span>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono px-2 py-0.5 rounded">
              {completedCount}/{steps.length} Steps Ready
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Follow this end-to-end guided workflow to experience the compliant outreach lifecycle.
          </p>
        </div>

        <button
          onClick={onSeedDemo}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-2 self-start"
        >
          <span>🌱 Quick Seed Complete Demo</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Pipeline Onboarding Progress
          </span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {progressPct}% Completed
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                step.done
                  ? "bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-sm"
                  : "bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      STEP {step.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>

              <button
                onClick={step.action}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 self-start sm:self-auto ${
                  step.done
                    ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20"
                }`}
              >
                <span>{step.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
