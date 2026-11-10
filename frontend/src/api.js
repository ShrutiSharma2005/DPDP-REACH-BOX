const API_BASE = "http://localhost:8000/api";

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "API Error";
    try {
      const err = await response.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Metrics & System
  getMetrics: () => fetchApi("/metrics"),
  getHealth: () => fetch("http://localhost:8000/health").then(r => r.json()),
  
  // Prospects
  getProspects: (params = "") => fetchApi(`/prospects${params}`),
  importProspects: (formData) => fetchApi("/prospects/import", { method: "POST", body: formData }),
  enrichProspects: (ids = null) => fetchApi("/prospects/enrich", { method: "POST", body: JSON.stringify(ids) }),
  complianceCheck: (ids = null) => fetchApi("/prospects/compliance-check", { method: "POST", body: JSON.stringify(ids) }),
  deleteProspect: (id) => fetchApi(`/prospects/${id}`, { method: "DELETE" }),

  // Drafts
  getDrafts: (params = "") => fetchApi(`/drafts${params}`),
  generateDrafts: (ids = null) => fetchApi("/drafts/generate", { method: "POST", body: JSON.stringify(ids) }),
  getDraft: (id) => fetchApi(`/drafts/${id}`),

  // Review
  reviewDraft: (id, payload) => fetchApi(`/review/${id}`, { method: "POST", body: JSON.stringify(payload) }),
  bulkApprove: (ids) => fetchApi("/review/bulk-approve", { method: "POST", body: JSON.stringify({ draft_ids: ids }) }),
  getApprovalRate: () => fetchApi("/review/approval-rate"),

  // Send & Outbox
  getQueueStatus: () => fetchApi("/send/queue"),
  dispatchSends: (draftIds = null) => fetchApi("/send/dispatch", { method: "POST", body: JSON.stringify(draftIds) }),
  getOutbox: (status = "") => fetchApi(`/send/outbox${status ? `?status=${status}` : ""}`),

  // Replies
  getReplies: () => fetchApi("/replies"),
  submitReply: (payload) => fetchApi("/replies", { method: "POST", body: JSON.stringify(payload) }),
  getDemoLink: () => fetchApi("/replies/demo-link"),

  // A/B Tests
  getAbTests: () => fetchApi("/ab-tests"),

  // Settings & Compliance
  getSettings: () => fetchApi("/settings"),
  updateSettings: (payload) => fetchApi("/settings", { method: "POST", body: JSON.stringify(payload) }),
  seedDemo: () => fetchApi("/settings/seed-demo", { method: "POST" }),
  runRetentionCleanup: () => fetchApi("/settings/retention-cleanup", { method: "POST" }),
  getSuppressionList: () => fetchApi("/settings/suppression"),
  addSuppression: (payload) => fetchApi("/settings/suppression", { method: "POST", body: JSON.stringify(payload) }),
  getAuditLogs: (limit = 100) => fetchApi(`/settings/audit-logs?limit=${limit}`),

  // Public Unsubscribe
  unsubscribeToken: (token) => fetchApi(`/unsubscribe/${token}`),
};
