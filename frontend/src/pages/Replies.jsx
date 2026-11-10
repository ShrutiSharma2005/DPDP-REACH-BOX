import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Calendar,
  Send,
  UserCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function Replies() {
  const [replies, setReplies] = useState([]);
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('Re: DPDP Act 2023 Readiness');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLink, setDemoLink] = useState('https://cal.com/dpdpflow/compliance-audit-demo');
  const { addToast } = useToast();

  const loadReplies = async () => {
    try {
      const data = await api.getReplies();
      setReplies(data);
      const dl = await api.getDemoLink();
      if (dl?.calendar_url) setDemoLink(dl.calendar_url);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReplies();
  }, []);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!fromEmail || !body) {
      addToast('Please enter both sender email and message body.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const reply = await api.submitReply({
        from_email: fromEmail,
        subject,
        body,
      });

      if (reply.classification === 'opt_out') {
        addToast(`🚨 Opt-out classified! ${fromEmail} was instantly added to central suppression list.`, 'success');
      } else if (reply.classification === 'interested') {
        addToast(`🎉 Positive intent detected! Lead qualified for calendar demo link.`, 'success');
      } else {
        addToast(`Classified reply as: ${reply.classification}`, 'info');
      }

      setBody('');
      setFromEmail('');
      loadReplies();
    } catch (err) {
      addToast(`Error processing reply: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getClassificationBadge = (cls) => {
    const config = {
      interested: { label: 'Interested / Demo Request', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300' },
      opt_out: { label: 'Opt-Out (Suppressed)', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300' },
      wrong_person: { label: 'Wrong Person / Referral', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300' },
      not_now: { label: 'Not Now / Timing Deferral', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300' },
    };
    const c = config[cls] || { label: cls, bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    return (
      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Inbound Reply Tracker & Intent Router</span>
          <span className="text-xs font-mono font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
            Hybrid Classifier
          </span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Deterministic keyword rules run first for statutory opt-outs, followed by Groq LLM classification.
        </p>
      </div>

      {/* Simulator Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Simulate / Paste Inbound Response</span>
        </h2>
        <p className="text-xs text-slate-500">
          Paste an incoming email to test real-time intent extraction, statutory opt-out suppression, and calendar routing.
        </p>

        <form onSubmit={handleSubmitReply} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Sender Email (Prospect)
              </label>
              <input
                type="email"
                required
                placeholder="e.g. kavita.nair@securepay.example"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Reply Body Content
            </label>
            <textarea
              rows={4}
              required
              placeholder="Paste customer response text here, e.g. 'Yes, let's schedule a 15-minute demo on Thursday' or 'Please unsubscribe and delete my data under DPDP Act'."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Quick Test Templates:</span>
              <button
                type="button"
                onClick={() => {
                  setFromEmail('rohan.desai@cloudmetric.example');
                  setBody('Please book a demo for our CISO team for next Tuesday afternoon.');
                }}
                className="underline hover:text-indigo-600"
              >
                "Book Demo"
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setFromEmail('sunita.rao@credvault.example');
                  setBody('Stop emailing me. Unsubscribe immediately and delete my records under DPDP erasure.');
                }}
                className="underline hover:text-rose-600"
              >
                "Opt-Out / Erasure"
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Classifying...' : 'Submit & Classify'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Replies Inbox List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Incoming Replies Log ({replies.length})</span>
          </h2>
        </div>

        <div className="space-y-3">
          {replies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No replies recorded yet. Paste a reply above or seed demo data.
            </div>
          ) : (
            replies.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {rep.from_email}
                    </span>
                    <span className="text-slate-400 text-xs">• {rep.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getClassificationBadge(rep.classification)}
                    <span className="text-[10px] font-mono text-slate-400">
                      Conf: {(rep.confidence * 100).toFixed(0)}% ({rep.classifier_source})
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  {rep.body}
                </div>

                {/* Routing Action based on classification */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Reason: {rep.classification_reason}
                  </span>

                  {rep.classification === 'interested' && (
                    <a
                      href={demoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Demo Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {rep.classification === 'opt_out' && (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Suppressed with immediate effect</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
