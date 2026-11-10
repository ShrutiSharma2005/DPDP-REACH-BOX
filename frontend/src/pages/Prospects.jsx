import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import {
  Upload,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export default function Prospects({ setActiveTab, initialSector = '', onClearInitialSector }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState(initialSector || '');
  const [basisFilter, setBasisFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (initialSector) {
      setSectorFilter(initialSector);
    }
  }, [initialSector]);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (sectorFilter) params.append('sector', sectorFilter);
      if (basisFilter) params.append('lawful_basis', basisFilter);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await api.getProspects(qs);
      setProspects(data);
    } catch (err) {
      addToast(`Error loading prospects: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspects();
  }, [search, statusFilter, sectorFilter, basisFilter]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const report = await api.importProspects(formData);
      setValidationReport(report);
      addToast(`Imported ${report.imported_count} prospects. ${report.rejected_count} rows rejected.`, 'success');
      loadProspects();
    } catch (err) {
      addToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEnrich = async () => {
    try {
      setLoading(true);
      const res = await api.enrichProspects();
      addToast(`Enriched ${res.processed_count} emails: ${res.verified_count} verified, ${res.rejected_count} rejected.`, 'success');
      loadProspects();
    } catch (err) {
      addToast(`Enrichment error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompliance = async () => {
    try {
      setLoading(true);
      const res = await api.complianceCheck();
      addToast(`Compliance Gate: ${res.cleared_count} cleared for drafting, ${res.blocked_count} blocked.`, 'success');
      loadProspects();
    } catch (err) {
      addToast(`Compliance error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProspect(id);
      addToast('Prospect removed.', 'info');
      setProspects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      imported: { label: 'Imported', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
      verified: { label: 'Email Verified', bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300' },
      cleared: { label: 'Compliance Cleared', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' },
      drafted: { label: 'Drafted', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300' },
      approved: { label: 'Approved', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300' },
      sent: { label: 'Sent', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' },
      replied: { label: 'Replied', bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200' },
      opted_out: { label: 'Opted Out / Suppressed', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' },
      needs_legal_ruling: { label: 'Needs Legal Ruling', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' },
      rejected_enrichment: { label: 'Invalid Email / MX', bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' }
    };
    const c = config[status] || { label: status, bg: 'bg-slate-100 text-slate-700' };
    return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.bg}`}>{c.label}</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Prospect Intelligence & Governance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Work contacts strictly governed under DPDP Act Section 3(c)(ii)(A) and Section 7(a).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Upload */}
          <label className="cursor-pointer text-xs font-semibold px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Importing...' : 'Upload Prospects CSV'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {/* Enrich */}
          <button
            onClick={handleEnrich}
            className="text-xs font-medium px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            title="Verify email deliverability and MX records"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Enrich & Verify</span>
          </button>

          {/* Compliance */}
          <button
            onClick={handleCompliance}
            className="text-xs font-medium px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            title="Check central suppression and validate statutory basis"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Run Compliance Gate</span>
          </button>
        </div>
      </div>

      {/* Import Validation Report Modal/Card */}
      {validationReport && (
        <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Import Validation Report</span>
            </div>
            <button
              onClick={() => setValidationReport(null)}
              className="text-xs text-amber-800 dark:text-amber-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Total Evaluated: {validationReport.total_rows}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Imported: {validationReport.imported_count}</span>
            <span className="text-rose-700 dark:text-rose-400 font-bold">Rejected: {validationReport.rejected_count}</span>
          </div>
          {validationReport.rejected_details?.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 text-xs border-t border-amber-200/60 dark:border-amber-900/40 pt-2 font-mono">
              {validationReport.rejected_details.map((rej, idx) => (
                <div key={idx} className="flex items-start gap-2 text-rose-800 dark:text-rose-300">
                  <span className="text-slate-400">Row {rej.row}:</span>
                  <span className="font-semibold">{rej.email || rej.name}</span>
                  <span className="text-slate-600 dark:text-slate-400">({rej.reason})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, role, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="imported">Imported</option>
          <option value="verified">Verified</option>
          <option value="cleared">Cleared</option>
          <option value="drafted">Drafted</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
          <option value="replied">Replied</option>
          <option value="opted_out">Opted Out</option>
        </select>

        {/* Sector */}
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none capitalize"
        >
          <option value="">All Sectors</option>
          <option value="fintech">Fintech</option>
          <option value="health">Healthtech</option>
          <option value="edtech">Edtech</option>
          <option value="e-commerce">E-Commerce</option>
          <option value="SaaS">SaaS</option>
        </select>

        {/* Lawful Basis */}
        <select
          value={basisFilter}
          onChange={(e) => setBasisFilter(e.target.value)}
          className="text-xs py-1.5 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
        >
          <option value="">All Lawful Bases</option>
          <option value="made_public_by_person">s.3(c)(ii)(A) Made Public</option>
          <option value="gave_voluntarily">s.7(a) Gave Voluntarily</option>
          <option value="consented">s.6 Consented</option>
        </select>

        {(search || statusFilter || sectorFilter || basisFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setSectorFilter('');
              setBasisFilter('');
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Prospects Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Contact & Role</th>
                <th className="py-3 px-4">Company & ICP</th>
                <th className="py-3 px-4">Work Email</th>
                <th className="py-3 px-4">Lawful Basis & Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {prospects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No prospects match your criteria. Upload a CSV or seed demo data.
                  </td>
                </tr>
              ) : (
                prospects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                      <div className="text-slate-500 text-[11px]">{p.role}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{p.company}</div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {p.sector} • {p.employee_count} staff
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>{p.work_email}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.email_verified ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> MX Verified
                          </span>
                        ) : (
                          <span className="text-amber-500">Unverified</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px]">
                      <div className="font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded inline-block">
                        {p.lawful_basis}
                      </div>
                      <div className="text-slate-400 mt-0.5 truncate max-w-[200px]" title={p.source}>
                        Src: {p.source}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded transition-colors"
                        title="Delete prospect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
