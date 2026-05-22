const BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("susu_admin_token");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  login: (password: string) =>
    apiFetch("/admin/login", { method: "POST", body: JSON.stringify({ password }) }),

  getStats: () => apiFetch("/admin/stats"),

  getCollectors: () => apiFetch("/admin/collectors"),

  createCollector: (data: { name: string; email: string; password: string; phone?: string; zone?: string }) =>
    apiFetch("/admin/collectors", { method: "POST", body: JSON.stringify(data) }),

  deleteCollector: (id: number) =>
    apiFetch(`/admin/collectors/${id}`, { method: "DELETE" }),

  getCustomers: (params?: { search?: string; collectorId?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.collectorId) q.set("collectorId", String(params.collectorId));
    return apiFetch(`/admin/customers?${q}`);
  },

  createCustomer: (data: { name: string; phone: string; collectorId: number; address?: string; notes?: string }) =>
    apiFetch("/admin/customers", { method: "POST", body: JSON.stringify(data) }),

  assignCustomer: (customerId: number, collectorId: number) =>
    apiFetch(`/admin/customers/${customerId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ collectorId }),
    }),
};
