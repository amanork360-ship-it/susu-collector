import { useGetMe, useGetDashboardSummary } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Mail, LogOut, Shield, Activity, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const { data: me, isLoading } = useGetMe();
  const { data: summary } = useGetDashboardSummary();
  const { logout } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <Card className="border-border overflow-hidden bg-card">
        <div className="h-32 bg-primary/10 w-full relative">
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`, 
            backgroundSize: '24px 24px' 
          }}></div>
        </div>
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col items-center sm:flex-row sm:items-end sm:space-x-5 -mt-16 mb-6">
            {isLoading ? (
              <Skeleton className="w-32 h-32 rounded-full border-4 border-card" />
            ) : (
              <Avatar className="w-32 h-32 border-4 border-card shadow-md bg-muted">
                <AvatarImage src={me?.avatarUrl || undefined} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground font-bold">
                  {me?.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="mt-4 sm:mt-0 text-center sm:text-left flex-1 pb-2">
              {isLoading ? (
                <div className="space-y-2 flex flex-col items-center sm:items-start">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground">{me?.name}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground mt-1 text-sm font-medium">
                    <Shield className="w-4 h-4 text-primary" />
                    Authorized Field Agent
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 sm:mt-0 hidden sm:block pb-2">
              <Button variant="outline" className="border-border">Edit Profile</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact Info</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {isLoading ? <Skeleton className="h-4 w-full" /> : <span>{me?.email}</span>}
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {isLoading ? <Skeleton className="h-4 w-full" /> : <span>{me?.phone || "No phone added"}</span>}
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {isLoading ? <Skeleton className="h-4 w-full" /> : <span>Zone: <span className="font-semibold text-foreground">{me?.zone}</span></span>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Agent Stats</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-medium">
                    <Users className="w-4 h-4" /> Customers
                  </div>
                  <p className="text-xl font-bold">{me?.totalCustomers || 0}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-medium">
                    <Activity className="w-4 h-4" /> Success Rate
                  </div>
                  <p className="text-xl font-bold text-primary">{summary?.collectionRate || 0}%</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:hidden gap-3">
             <Button variant="outline" className="w-full">Edit Profile</Button>
             <Button variant="destructive" className="w-full" onClick={logout}>
               <LogOut className="w-4 h-4 mr-2" /> Sign Out
             </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-border bg-card hidden sm:block">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Sign out</h3>
              <p className="text-sm text-muted-foreground mt-1">End your current session on this device.</p>
            </div>
            <Button variant="destructive" onClick={logout}>
               <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
