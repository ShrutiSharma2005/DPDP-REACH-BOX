import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  Copy,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Keyboard,
  Check,
  BookOpen,
  Filter
} from 'lucide-react';

export default function DraftsReview({ setActiveTab }) {
  const [drafts, setDrafts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('drafted');
  const [editing, setEditing] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { addToast } = useToast();

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const data = await api.getDrafts(qs);
      setDrafts(data);
      setCurrentIndex(0);
      setEditing(false);
    } catch (err) {
      addToast(`Error loading drafts: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, [statusFilter]);

  const currentDraft = drafts[currentIndex] || null;

  // Sync edit buffer
  useEffect(() => {
    if (currentDraft) {
      setEditSubject(currentDraft.subject);
      setEditBody(currentDraft.email_body);
      setEditLinkedin(currentDraft.linkedin_note);
    }
  }, [currentDraft]);

  // Keyboard shortcuts (A = Approve, E = Edit, R = Reject)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReject();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setEditing((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDraft, editing]);

  const handleNext = () => {
    if (currentIndex < drafts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setEditing(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setEditing(false);
    }
  };

  const handleApprove = async () => {
    if (!currentDraft) return;
    if (!currentDraft.fact_check_passed) {
      addToast('Cannot approve draft failing fact checks! Fix reasons first.', 'error');
      return;
    }

    try {
      await api.reviewDraft(currentDraft.id, { status: 'approved' });
      addToast(`Approved draft for ${currentDraft.prospect?.company}`, 'success');
      // Advance to next
      const updated = drafts.filter((d) => d.id !== currentDraft.id);
      setDrafts(updated);
      if (currentIndex >= updated.length) {
        setCurrentIndex(Math.max(0, updated.length - 1));
      }
    } catch (err) {
      addToast(`Approval failed: ${err.message}`, 'error');
    }
  };

  const handleReject = async () => {
    if (!currentDraft) return;
    try {
      await api.reviewDraft(currentDraft.id, { status: 'rejected' });
      addToast(`Rejected draft for ${currentDraft.prospect?.company}`, 'info');
      const updated = drafts.filter((d) => d.id !== currentDraft.id);
      setDrafts(updated);
      if (currentIndex >= updated.length) {
        setCurrentIndex(Math.max(0, updated.length - 1));
      }
    } catch (err) {
      addToast(`Reject failed: ${err.message}`, 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!currentDraft) return;
    try {
      const res = await api.reviewDraft(currentDraft.id, {
        subject: editSubject,
        email_body: editBody,
        linkedin_note: editLinkedin,
        status: 'edited'
      });
      addToast('Draft updated and re-verified. Reviewer edits saved for few-shot learning.', 'success');
      setEditing(false);
      // Update draft in list
      const updated = [...drafts];
      updated[currentIndex] = res.draft;
      setDrafts(updated);
    } catch (err) {
      addToast(`Save error: ${err.message}`, 'error');
    }
  };

  const handleCopyLinkedin = () => {
    if (!currentDraft) return;
    navigator.clipboard.writeText(currentDraft.linkedin_note);
    addToast('LinkedIn note copied to clipboard! Ready to paste.', 'success');
  };

  const handleGenerateAll = async () => {
    try {
      setLoading(true);
      const res = await api.generateDrafts();
      addToast(`Writer Agent generated ${res.drafts_generated} personalized drafts.`, 'success');
      loadDrafts();
    } catch (err) {
      addToast(`Generation error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    const validPassedIds = drafts.filter((d) => d.fact_check_passed).map((d) => d.id);
    if (validPassedIds.length === 0) {
      addToast('No compliant drafts available to bulk approve.', 'error');
      return;
    }

    try {
      const res = await api.bulkApprove(validPassedIds);
      addToast(`Bulk approved ${res.approved_count} compliant drafts!`, 'success');
      loadDrafts();
    } catch (err) {
      addToast(`Bulk approve error: ${err.message}`, 'error');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Human-in-the-Loop Review Queue</span>
            <span className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
              {drafts.length} in queue
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every outbound message must receive human sign-off. Reviewer edits improve few-shot LLM prompts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
          >
            <option value="drafted">Queue: Pending Review</option>
            <option value="approved">Approved</option>
            <option value="edited">Edited</option>
            <option value="rejected">Rejected</option>
            <option value="">All Drafts</option>
          </select>

          <button
            onClick={handleGenerateAll}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5"
            title="Generate personalized drafts for all compliance-cleared prospects"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Drafts</span>
          </button>

          <button
            onClick={handleBulkApprove}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            title="Approve all drafts passing the fact checker"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Bulk Approve Passed</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-850/60 text-slate-600 dark:text-slate-400 text-xs flex flex-wrap items-center justify-between gap-2 font-mono">
        <div className="flex items-center gap-3">
          <Keyboard className="w-4 h-4 text-indigo-600" />
          <span>Shortcuts:</span>
          <span><kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-xs font-bold text-slate-800 dark:text-slate-200">A</kbd> Approve</span>
          <span><kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-xs font-bold text-slate-800 dark:text-slate-200">E</kbd> Edit</span>
          <span><kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-xs font-bold text-slate-800 dark:text-slate-200">R</kbd> Reject</span>
          <span><kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-xs font-bold text-slate-800 dark:text-slate-200">←</kbd> / <kbd className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-xs font-bold text-slate-800 dark:text-slate-200">→</kbd> Navigate</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Draft {drafts.length > 0 ? currentIndex + 1 : 0} of {drafts.length}
        </div>
      </div>

      {/* Main Review Card */}
      {!currentDraft ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No drafts in this queue
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All drafts have been processed or none have been generated yet. Click "Generate Drafts" or adjust the filter above.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Card Prospect Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-850/30">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {currentDraft.prospect?.name}
                </h2>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {currentDraft.persona}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Var: {currentDraft.ab_variant}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                <strong>{currentDraft.prospect?.role}</strong> at <strong>{currentDraft.prospect?.company}</strong> • {currentDraft.prospect?.sector} ({currentDraft.prospect?.employee_count} staff)
              </div>
            </div>

            {/* Fact check status badge */}
            <div>
              {currentDraft.fact_check_passed ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Fact Check: PASSED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Fact Check: FAILED</span>
                </div>
              )}
            </div>
          </div>

          {/* Fact check failure warnings if any */}
          {!currentDraft.fact_check_passed && currentDraft.fact_check_reasons?.length > 0 && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Fact-Checker Gate Constraints Failed (Approval Locked):</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 font-mono text-[11px]">
                {currentDraft.fact_check_reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {/* Subject Line */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Email Subject
              </label>
              {editing ? (
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full text-sm font-semibold p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {currentDraft.subject}
                </div>
              )}
            </div>

            {/* Email Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Email Body (90–120 Words Required)
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentDraft.word_count} words
                </span>
              </div>
              {editing ? (
                <textarea
                  rows={8}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              ) : (
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-850/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {currentDraft.email_body}
                </div>
              )}
            </div>

            {/* LinkedIn Note (<=300 chars) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>LinkedIn Connection Note (Manual Touch)</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-normal text-slate-500">
                    No Scraper / No Bots
                  </span>
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentDraft.linkedin_char_count} / 300 chars
                </span>
              </div>
              {editing ? (
                <textarea
                  rows={3}
                  value={editLinkedin}
                  onChange={(e) => setEditLinkedin(e.target.value)}
                  className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-850/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex items-start justify-between gap-3">
                  <span className="leading-relaxed">{currentDraft.linkedin_note}</span>
                  <button
                    onClick={handleCopyLinkedin}
                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg shrink-0 transition-colors flex items-center gap-1 text-[11px] font-medium"
                    title="Copy note for manual LinkedIn invite"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              )}
            </div>

            {/* Retrieved DPDP Citations */}
            {currentDraft.citations?.length > 0 && (
              <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
                <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Grounding Citations (Ingested DPDP Act & Product Knowledge):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentDraft.citations.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-[11px]">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.section}</div>
                      <div className="text-slate-500 line-clamp-2 mt-0.5">{c.content || c.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Previous draft (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === drafts.length - 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                title="Next draft (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-600/20"
                  >
                    Save & Re-Check
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit (E)</span>
                  </button>

                  <button
                    onClick={handleReject}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject (R)</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={!currentDraft.fact_check_passed}
                    className="px-5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve (A)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
