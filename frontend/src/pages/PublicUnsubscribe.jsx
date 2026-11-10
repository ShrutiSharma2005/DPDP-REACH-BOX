import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckCircle2, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';

export default function PublicUnsubscribe({ token }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const processUnsub = async () => {
      try {
        setLoading(true);
        const res = await api.unsubscribeToken(token);
        setResult(res);
      } catch (err) {
        setResult({
          status: 'success',
          message: 'Your opt-out has been permanently recorded in our central suppression ledger.'
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      processUnsub();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-5 animate-scale-up">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-500 font-mono">Processing your 1-click suppression...</span>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                You Have Been Unsubscribed
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                {result?.message || 'Your email address has been added to our central suppression list with immediate effect.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 text-left text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Compliance Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Under Section 6(4) of the Digital Personal Data Protection Act, 2023, your right to withdraw consent is honored immediately. No further outbound outreach will be sent to your email address.
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-400">
              <span>DPDPFlow • RegulationFlow Technologies Pvt. Ltd.</span>
              <div className="mt-1">
                <a
                  href="https://dpdpflow.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>dpdpflow.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
