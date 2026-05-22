import { useEffect, useState, useCallback } from "react";
import { Plus, UserPlus, Search, X, Loader2, ArrowRightLeft } from "lucide-react";
import { api } from "@/lib/api";

interface Customer {
  id: number; name: string; phone: string; address: string | null;
  savingsBalance: number; collectionStatus: string;
  collectorId: number; collectorName: string | null; collectorZone: string | null;
  joinedAt: string;
}

interface Collector {
  id: number; name: string; zone: string; customerCount: number;
}

function AddCustomerModal({ collectors, onClose, onAdded }: {
  collectors: Collector[]; onClose: () => void; onAdded: () => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", collectorId: "", address: "", zone: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.createCustomer({ ...form, collectorId: parseInt(form.collectorId) });
      onAdded(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Customer</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {[
            { label: "Full Name", key: "name", required: true },
            { label: "Phone", key: "phone", required: true },
            { label: "Address", key: "address" },
            { label: "Zone", key: "zone" },
            { label: "Notes", key: "notes" },
          ].map(({ label, key, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
              <input
                type="text"
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required={required}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1.5">Assign to Collector<span className="text-destructive ml-0.5">*</span></label>
            <select
              value={form.collectorId}
              onChange={e => setForm(f => ({ ...f, collectorId: e.target.value }))}
              required
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select collector...</option>
              {collectors.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.zone || "No zone"}) — {c.customerCount} customers</option>
              ))}
            </select>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm hover:bg-accent transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReassignModal({ customer, collectors, onClose, onDone }: {
  customer: Customer; collectors: Collector[]; onClose: () => void; onDone: () => void;
}) {
  const [collectorId, setCollectorId] = useState(String(customer.collectorId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (parseInt(collectorId) === customer.collectorId) { onClose(); return; }
    setLoading(true); setError("");
    try {
      await api.assignCustomer(customer.id, parseInt(collectorId));
      onDone(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Reassign Customer</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground">Moving <strong className="text-foreground">{customer.name}</strong> to a new collector.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">New Collector</label>
            <select
              value={collectorId}
              onChange={e => setCollectorId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {collectors.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.zone || "No zone"}) — {c.customerCount} customers</option>
              ))}
            </select>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm hover:bg-accent">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Reassign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCollector, setFilterCollector] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [reassigning, setReassigning] = useState<Customer | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getCustomers({ search, collectorId: filterCollector ? parseInt(filterCollector) : undefined }),
      api.getCollectors(),
    ]).then(([c, col]) => { setCustomers(c); setCollectors(col); })
      .finally(() => setLoading(false));
  }, [search, filterCollector]);

  useEffect(() => { load(); }, [load]);

  const statusColor: Record<string, string> = {
    collected: "text-emerald-400 bg-emerald-400/10",
    pending: "text-amber-400 bg-amber-400/10",
    overdue: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">{customers.length} customer{customers.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterCollector}
          onChange={e => setFilterCollector(e.target.value)}
          className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Collectors</option>
          {collectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{search ? "No customers found." : "No customers yet. Add one to get started."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.collectionStatus] ?? "bg-muted text-muted-foreground"}`}>
                    {c.collectionStatus}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex gap-3 flex-wrap">
                  <span>{c.phone}</span>
                  {c.collectorName && (
                    <span className="text-primary">→ {c.collectorName}{c.collectorZone ? ` (${c.collectorZone})` : ""}</span>
                  )}
                  <span>GH₵ {c.savingsBalance.toFixed(2)} saved</span>
                </div>
              </div>
              <button
                onClick={() => setReassigning(c)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs hover:bg-accent transition shrink-0"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Reassign
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCustomerModal collectors={collectors} onClose={() => setShowAdd(false)} onAdded={load} />
      )}
      {reassigning && (
        <ReassignModal customer={reassigning} collectors={collectors} onClose={() => setReassigning(null)} onDone={load} />
      )}
    </div>
  );
}
