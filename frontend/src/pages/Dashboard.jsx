import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  AlertOctagon,
  Users,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Calendar,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const formatSectorName = (sec) => {
  if (!sec) return '';
  const s = String(sec).trim().toLowerCase();
  if (s === 'saas') return 'SaaS';
  if (s === 'fintech') return 'Fintech';
  if (s === 'health' || s === 'healthtech') return 'Health';
  if (s === 'edtech') return 'Edtech';
  if (s === 'e-commerce' || s === 'ecommerce') return 'E-Commerce';
  return sec;
};

export default function Dashboard({ setActiveTab, onSelectSector }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err) {
      addToast(`Failed to load metrics: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-sm">Calculating pipeline metrics and compliance rates...</span>
        </div>
      </div>
    );
  }

  const kpis = metrics?.kpis || [];
  const funnel = metrics?.funnel || [];
  const sectors = metrics?.sectors || [];

  const SECTOR_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            DPDP Outreach Command Center
            <span className="text-xs font-normal bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
              DPDPFlow
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compliant B2B decision-maker engagement pipeline for Indian DPDP Act 2023 readiness.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-600/20 transition-all"
          >
            <span>Review Drafts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
                {kpi.label}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                  kpi.met
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                Target: {kpi.target}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {kpi.value}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
              {kpi.description}
            </p>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel Visualizer */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Pipeline Funnel Velocity</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                (End-to-End Governance)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Strict conversion checkpoints ensuring compliance from initial prospect CSV to calendar demo request.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('send-queue')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View Send Outbox</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Funnel Stage Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {funnel.map((item, idx) => (
            <div
              key={item.stage}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center text-center relative group"
            >
              <span className="text-[10px] font-mono font-bold text-slate-400">
                STAGE {idx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                {item.stage}
              </span>
              <span
                className="text-xl font-bold mt-1"
                style={{ color: item.color }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>

        {/* Funnel Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 border border-slate-700/80 px-3 py-2 rounded-xl shadow-xl text-xs space-y-0.5 z-50 text-white min-w-[120px]">
                        <div className="font-semibold text-slate-300">{label}</div>
                        <div className="text-sm font-bold text-indigo-400">
                          {payload[0].value} <span className="text-[11px] font-normal text-slate-400">prospects</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Sector Distribution & Quick Governance Runbook */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Distribution Pie */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>ICP Sectors</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                    5 Sectors
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Indian high-growth sectors with immediate DPDP Act exposure.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('prospects')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 shrink-0 font-medium cursor-pointer"
                title="View all prospects in Prospects & ICP Gate"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="h-56 w-full mt-3 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectors}
                    dataKey="count"
                    nameKey="sector"
                    cx="50%"
                    cy="50%"
                    outerRadius={76}
                    innerRadius={50}
                    paddingAngle={3}
                    cursor="pointer"
                    onClick={(entry) => {
                      if (onSelectSector && entry?.sector) {
                        onSelectSector(entry.sector);
                      } else {
                        setActiveTab('prospects');
                      }
                    }}
                  >
                    {sectors.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SECTOR_COLORS[index % SECTOR_COLORS.length]}
                        className="transition-all duration-200 hover:opacity-85 cursor-pointer outline-none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const total = sectors.reduce((acc, s) => acc + s.count, 0);
                        const pct = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
                        const fill = data.payload.fill || SECTOR_COLORS[0];
                        return (
                          <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50 text-white min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: fill }}
                              />
                              <span className="font-bold text-white text-[13px]">
                                {formatSectorName(data.name)}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between text-slate-300 pt-1 border-t border-slate-800">
                              <span>Prospects:</span>
                              <span className="font-bold text-white text-sm">{data.value}</span>
                            </div>
                            <div className="flex items-baseline justify-between text-slate-400 text-[11px]">
                              <span>ICP Share:</span>
                              <span className="font-semibold text-emerald-400">{pct}%</span>
                            </div>
                            <div className="text-[10px] text-indigo-300 pt-1 text-center font-medium border-t border-slate-800/60">
                              Click to filter in Prospects →
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  {sectors.reduce((acc, s) => acc + s.count, 0)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                  Total ICP
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {sectors.map((s, idx) => {
              const total = sectors.reduce((acc, item) => acc + item.count, 0);
              const pct = total > 0 ? ((s.count / total) * 100).toFixed(0) : 0;
              const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
              return (
                <button
                  key={s.sector}
                  onClick={() => {
                    if (onSelectSector) onSelectSector(s.sector);
                    else setActiveTab('prospects');
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group text-left border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/60 cursor-pointer"
                  title={`Click to filter ${formatSectorName(s.sector)} in Prospects`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform shadow-xs"
                      style={{ backgroundColor: color }}
                    ></span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {formatSectorName(s.sector)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {pct}%
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {s.count}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Regulatory Governance Highlights & Action Cards */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Statutory Compliance Architecture</span>
              </h3>
              <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono px-2 py-0.5 rounded">
                DPDP Act 2023
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="text-indigo-600">⚖️</span> Section 3(c)(ii)(A) Basis
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Only work contacts publicly disclosed by the individual are engaged. All personal domains (@gmail, @yahoo) and phone numbers are rejected.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="text-emerald-600">🛡️</span> 0 Factual Errors Gate
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Fact checker automatically validates sections 1-44, blocks banned "₹250 cr per violation" phrasing, and enforces 90-120 word limits.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="text-rose-600">🛑</span> 1-Click Hard Suppression
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Every message contains a public 1-click unsubscribe token link. Inbound opt-outs automatically suppress without manual review.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="text-amber-600">⏱️</span> 90-Day Retention Purge
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Automated Section 8(7) data minimisation purges unengaged prospects after 90 days with permanent audit trail logging.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Need to test the complete pipeline from scratch?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('getting-started')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Follow Guided Checklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
