import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  FileEdit,
  Send,
  MessageSquare,
  Split,
  ShieldAlert,
  Settings as SettingsIcon,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'getting-started', label: 'Getting Started', icon: CheckSquare },
  { id: 'prospects', label: 'Prospects & ICP', icon: Users },
  { id: 'drafts', label: 'Drafts & Review', icon: FileEdit },
  { id: 'send-queue', label: 'Send Queue & Outbox', icon: Send },
  { id: 'replies', label: 'Replies & Routing', icon: MessageSquare },
  { id: 'ab-tests', label: 'A/B Tests', icon: Split },
  { id: 'suppression-audit', label: 'Suppression & Audit', icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight flex items-center gap-1.5">
            DPDP<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono font-semibold">
              AGENT
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">RegulationFlow Tech</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span>DPDP Act 2023</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Compliant</span>
        </div>
        <a
          href="https://dpdpflow.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]"
        >
          <span>dpdpflow.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
}
