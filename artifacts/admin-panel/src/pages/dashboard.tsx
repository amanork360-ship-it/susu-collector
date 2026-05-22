import { useEffect, useState } from "react";
import { Users, UserCheck, TrendingUp, DollarSign } from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
  totalCollectors: number;
  totalCustomers: number;
  totalCollections: number;
  totalRevenue: number;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-muted-foreground text-sm mt-0.5">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">System-wide statistics</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={UserCheck} label="Total Collectors" value={stats?.totalCollectors ?? 0} color="bg-primary/15 text-primary" />
          <StatCard icon={Users} label="Total Customers" value={stats?.totalCustomers ?? 0} color="bg-blue-500/15 text-blue-400" />
          <StatCard icon={TrendingUp} label="Total Collections" value={stats?.totalCollections ?? 0} color="bg-purple-500/15 text-purple-400" />
          <StatCard icon={DollarSign} label="Total Revenue" value={stats ? fmt(stats.totalRevenue) : "—"} color="bg-amber-500/15 text-amber-400" />
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold mb-2">Quick Guide</h2>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex gap-2"><span className="text-primary">→</span> Go to <strong className="text-foreground">Collectors</strong> to add new field agents or remove existing ones.</li>
          <li className="flex gap-2"><span className="text-primary">→</span> Go to <strong className="text-foreground">Customers</strong> to register new customers and assign them to a collector.</li>
          <li className="flex gap-2"><span className="text-primary">→</span> Use the <strong className="text-foreground">Reassign</strong> button on any customer to move them to a different collector.</li>
        </ul>
      </div>
    </div>
  );
}
