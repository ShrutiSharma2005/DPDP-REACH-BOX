import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  ShieldAlert,
  Download,
  Plus,
  Search,
  History,
  RefreshCw,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function SuppressionAudit() {
  const [activeSubTab, setActiveSubTab] = useState('suppression'); // 'suppression' or 'audit'
  const [suppressionList, setSuppressionList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState('manual_admin');
  const [newNote, setNewNote] = useState('');
  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const s = await api.getSuppressionList();
      setSuppressionList(s);
      const a = await api.getAuditLogs(150);
      setAuditLogs(a);
    } catch (err) {
      addToast(`Error loading data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSuppression = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      await api.addSuppression({
        email: newEmail,
        reason: newReason,
        source_note: newNote || 'Manual admin entry',
      });
      addToast(`Added ${newEmail} to suppression list.`, 'success');
      setShowAddModal(false);
      setNewEmail('');
      setNewNote('');
      loadData();
    } catch (err) {
      addToast(`Failed to add: ${err.message}`, 'error');
    }
  };

  const filteredSuppression = suppressionList.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.reason.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = auditLogs.filter((l) =>
    l.event_type.toLowerCase().includes(search.toLowerCase()) ||
    (l.actor && l.actor.toLowerCase().includes(search.toLowerCase())) ||
    (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Suppression Ledger & Compliance Audit</span>
            <span className="text-xs font-mono font-medium bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
              Hard Pre-Send Stop
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Permanent record of opt-outs and immutable trail of every pipeline action under DPDP Act requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'suppression' ? (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Suppress</span>
              </button>
              <a
                href="http://localhost:8000/api/settings/suppression/export-csv"
                download
                className="px-3.5 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </a>
            </>
          ) : (
            <a
              href="http://localhost:8000/api/settings/audit-logs/export-csv"
              download
              className="px-3.5 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Audit Trail CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('suppression')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'suppression'
              ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Central Suppression List ({suppressionList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'audit'
              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Immutable Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={`Search in ${activeSubTab === 'suppression' ? 'suppressed emails' : 'audit event trails'}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Tables View */}
      {activeSubTab === 'suppression' ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Suppressed Email</th>
                  <th className="py-3 px-4">Suppression Ground / Trigger</th>
                  <th className="py-3 px-4">Source Provenance Note</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSuppression.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No records found in suppression list.
                    </td>
                  </tr>
                ) : (
                  filteredSuppression.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-rose-700 dark:text-rose-400">
                        {item.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {item.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-sm truncate">
                        {item.source_note || '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(item.suppressed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Details / Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {log.event_type}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 font-sans">
                        {log.actor}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 truncate max-w-[120px]">
                        {log.entity_id || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 max-w-md truncate font-sans">
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Suppression Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Manual Suppression Registration</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSuppression} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@company.example"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Reason
                </label>
                <select
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                >
                  <option value="manual_admin">Manual Admin Addition</option>
                  <option value="opt_out_verbal">Direct Verbal / Phone Opt-Out</option>
                  <option value="gdpr_dpdp_erasure">DPDP Statutory Erasure Claim</option>
                  <option value="bounce_hard">Hard Bounce Permanent Failure</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Provenance Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Requested removal during webinar"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border rounded-xl hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
                >
                  Confirm Suppression
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
