import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  Split,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Send,
  PieChart as PieIcon,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function ABTests() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getAbTests();
      setData(res);
    } catch (err) {
      addToast(`Error loading A/B tests: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const variants = data?.variants || [];
  const sectorBreakdown = data?.sector_breakdown || [];
  const winnerVariantId = data?.winner_variant_id || 'A_A';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>A/B Message Testing & Sector Optimization</span>
            <span className="text-xs font-mono font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
              2 Subjects × 2 Openers
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Empirical matrix testing statutory inquiry vs technical benchmark across Indian ICP sectors.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Winner</span>
        </button>
      </div>

      {/* Winner Spotlight Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-amber-300/40 dark:border-amber-700/40 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Top Converting Strategy
            </span>
            <span className="text-xs bg-amber-200/60 dark:bg-amber-950 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded font-mono font-bold">
              Variant {winnerVariantId}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
            {data?.winner_reason || 'Calculating winner metrics based on human approval and positive demo requests...'}
          </p>
        </div>
      </div>

      {/* 4 Variants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {variants.map((v) => {
          const isWinner = v.variant_id === winnerVariantId;
          return (
            <div
              key={v.variant_id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isWinner
                  ? 'bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-400/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    VARIANT {v.variant_id}
                  </span>
                  {isWinner && (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full uppercase">
                      Leading
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-mono">Subject Angle:</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {v.subject_prefix}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-400 font-mono">Opener Hook:</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {v.opener_style}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Drafted:</span>
                  <span className="font-semibold">{v.drafted_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Approval Rate:</span>
                  <span className="font-semibold text-emerald-600">{v.approval_rate_pct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Demo Conversion:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {v.conversion_rate_pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sector Breakdown Table & Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Sector Response Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3">Total Drafted</th>
                <th className="py-2.5 px-3">Approved Sends</th>
                <th className="py-2.5 px-3 text-right">Approval Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sectorBreakdown.map((sec) => (
                <tr key={sec.sector} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {sec.sector}
                  </td>
                  <td className="py-3 px-3">{sec.drafts}</td>
                  <td className="py-3 px-3">{sec.approved}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {sec.approval_rate_pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
