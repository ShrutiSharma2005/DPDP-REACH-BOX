import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  Send,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  X
} from 'lucide-react';

export default function SendQueue() {
  const [queue, setQueue] = useState(null);
  const [outbox, setOutbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const q = await api.getQueueStatus();
      setQueue(q);
      const o = await api.getOutbox();
      setOutbox(o);
    } catch (err) {
      addToast(`Error loading outbox queue: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatch = async () => {
    try {
      setDispatching(true);
      const res = await api.dispatchSends();
      if (res.status === 'blocked') {
        addToast(res.message, 'error');
      } else if (res.status === 'cap_reached') {
        addToast(res.message, 'info');
      } else {
        addToast(`Dispatched ${res.dispatched_count} messages to outbox!`, 'success');
      }
      loadData();
    } catch (err) {
      addToast(`Dispatch failed: ${err.message}`, 'error');
    } finally {
      setDispatching(false);
    }
  };

  const capUsed = queue?.daily_cap_used ?? 0;
  const capLimit = queue?.daily_cap ?? 30;
  const capPct = Math.min(100, Math.round((capUsed / capLimit) * 100));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Send Queue & Local Outbox</span>
            <span className="text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              {queue?.is_dry_run ? 'DRY_RUN (Safe by Default)' : 'LIVE SMTP'}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controls daily domain caps, pacing, suppression enforcement, and local message recording.
          </p>
        </div>

        <button
          onClick={handleDispatch}
          disabled={dispatching || (queue?.approved_queue_count ?? 0) === 0}
          className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-2 self-start"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{dispatching ? 'Pacing Dispatch...' : `Dispatch Approved (${queue?.approved_queue_count ?? 0} queued)`}</span>
        </button>
      </div>

      {/* Cap & Throttle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cap gauge */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Today's Sending Cap</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {capUsed} / {capLimit} sends
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capPct > 90 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${capPct}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-400">
            Hard cap set to protect sender reputation & avoid IP blacklisting.
          </div>
        </div>

        {/* Pacing */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Send Spacing & Pacing</span>
            <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
              {queue?.send_spacing_seconds ?? 45}s
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Minimum delay between individual messages
            </p>
          </div>
          <Clock className="w-8 h-8 text-indigo-500 opacity-60" />
        </div>

        {/* Sending Domain */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Dedicated Subdomain</span>
            <div className="text-base font-mono font-bold mt-1 text-slate-900 dark:text-slate-100">
              {queue?.sending_domain || 'mail.dpdpflow.com'}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Warm-up Tier {queue?.warmup_tier || 1}
            </p>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-500 opacity-60" />
        </div>
      </div>

      {/* Outbox Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Outbox Dispatches Log</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Recorded outbox messages with full rendered body and generated 1-click unsubscribe links.
            </p>
          </div>

          <button
            onClick={loadData}
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Mode & Status</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {outbox.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Outbox is empty. Approve drafts and click "Dispatch Approved" to record messages.
                  </td>
                </tr>
              ) : (
                outbox.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {msg.recipient_email}
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-slate-700 dark:text-slate-300">
                      {msg.subject}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        {msg.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(msg.scheduled_for).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                        title="View rendered email"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rendered Email Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Rendered Outbound Message (#{selectedMessage.id})
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <span className="font-mono text-slate-400">To:</span>{' '}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedMessage.recipient_email}
                </span>
              </div>
              <div>
                <span className="font-mono text-slate-400">Subject:</span>{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedMessage.subject}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                {selectedMessage.email_body}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
