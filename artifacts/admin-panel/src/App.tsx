import { useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Link } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LayoutDashboard, Users, UserCheck, LogOut, Shield, Menu, X } from "lucide-react";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Collectors from "@/pages/collectors";
import Customers from "@/pages/customers";

function NavItem({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick?: () => void }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/" && location.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

function Layout({ children, onLogout }: { children: React.ReactNode; onLogout: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (close?: () => void) => (
    <>
      <NavItem href="/" icon={LayoutDashboard} label="Overview" onClick={close} />
      <NavItem href="/collectors" icon={UserCheck} label="Collectors" onClick={close} />
      <NavItem href="/customers" icon={Users} label="Customers" onClick={close} />
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-sidebar-border p-4 shrink-0">
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm">Susu Admin</div>
            <div className="text-xs text-muted-foreground">Management Panel</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-1">{nav()}</nav>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">Susu Admin</span>
        </div>
        <button onClick={() => setMobileOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-accent">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-sidebar border-r border-sidebar-border p-4 pt-16 flex flex-col" onClick={e => e.stopPropagation()}>
            <nav className="flex flex-col gap-1 flex-1">{nav(() => setMobileOpen(false))}</nav>
            <button onClick={onLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6 md:p-8 pt-20 md:pt-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminApp() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("susu_admin_token"));

  function logout() {
    localStorage.removeItem("susu_admin_token");
    setAuthed(false);
  }

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return (
    <Layout onLogout={logout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/collectors" component={Collectors} />
        <Route path="/customers" component={Customers} />
        <Route>
          <div className="text-center py-20 text-muted-foreground">Page not found.</div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AdminApp />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
