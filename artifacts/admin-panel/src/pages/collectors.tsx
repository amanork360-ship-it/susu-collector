import { useEffect, useState } from "react";
import { Plus, Trash2, Users, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Collector {
  id: number; name: string; email: string; phone: string | null;
  zone: string; customerCount: number; createdAt: string;
}

function AddCollectorModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", zone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.createCollector(form);
      onAdded(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  const field = (label: string, key: keyof typeof form, type = "text", required = false) => (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required={required}
        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Collector</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {field("Full Name", "name", "text", true)}
          {field("Email", "email", "email", true)}
          {field("Password", "password", "password", true)}
          {field("Phone", "phone")}
          {field("Zone / Area", "zone")}
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-sm hover:bg-accent transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Add Collector
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Collectors() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api.getCollectors().then(setCollectors).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove ${name} as a collector? They must have no assigned customers.`)) return;
    setDeleting(id); setError("");
    try {
      await api.deleteCollector(id);
      setCollectors(c => c.filter(x => x.id !== id));
    } catch (err: any) { setError(err.message); }
    finally { setDeleting(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Collectors</h1>
          <p className="text-muted-foreground text-sm mt-1">{collectors.length} field agent{collectors.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Collector
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm flex justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : collectors.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No collectors yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collectors.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{c.name}</div>
                <div className="text-muted-foreground text-sm truncate">{c.email}</div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  {c.zone && <span className="bg-accent px-2 py-0.5 rounded-full">{c.zone}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.customerCount} customers</span>
                  {c.phone && <span>{c.phone}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                disabled={deleting === c.id || c.customerCount > 0}
                title={c.customerCount > 0 ? "Reassign all customers first" : "Delete collector"}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddCollectorModal onClose={() => setShowAdd(false)} onAdded={load} />}
    </div>
  );
}
