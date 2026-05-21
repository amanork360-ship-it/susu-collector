import { 
  useGetDashboardSummary, 
  useGetCollectionsTrend, 
  useGetRecentActivity 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  Users, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Receipt
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: trend, isLoading: loadingTrend } = useGetCollectionsTrend();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-primary-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-primary-foreground/80 text-xs font-medium">Collected Today</p>
                {loadingSummary ? (
                  <Skeleton className="h-7 w-24 bg-primary-foreground/20" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight" data-testid="text-collected-today">
                    {formatCurrency(summary?.totalCollectedToday)}
                  </p>
                )}
              </div>
              <div className="p-2 bg-primary-foreground/10 rounded-lg">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            {!loadingSummary && (
              <div className="mt-4 flex items-center text-xs font-medium text-primary-foreground/90">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{summary?.collectionRate}% target hit</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Customers</p>
                {loadingSummary ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight" data-testid="text-assigned-customers">
                    {summary?.assignedCustomers}
                  </p>
                )}
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Pending</p>
                {loadingSummary ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight" data-testid="text-pending-collections">
                    {summary?.pendingCollections}
                  </p>
                )}
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Month Total</p>
                {loadingSummary ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight" data-testid="text-month-total">
                    {formatCurrency(summary?.totalCollectedMonth)}
                  </p>
                )}
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Collection Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrend ? (
              <div className="h-[250px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div className="h-[250px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()}/${d.getMonth()+1}`;
                      }}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `GH₵${val}`}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Collected"]}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingActivity ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activity?.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No recent activity
                  </div>
                ) : (
                  activity?.map((item) => (
                    <div key={item.id} className="p-4 flex gap-3 items-start">
                      <div className={`p-2 rounded-full mt-0.5 ${
                        item.type === 'collection' ? 'bg-primary/10 text-primary' :
                        item.type === 'loan_repayment' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-orange-500/10 text-orange-500'
                      }`}>
                        {item.type === 'collection' && <ArrowUpRight className="w-4 h-4" />}
                        {item.type === 'loan_repayment' && <ArrowDownRight className="w-4 h-4" />}
                        {item.type === 'receipt_upload' && <Receipt className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatDate(item.timestamp)}
                        </p>
                      </div>
                      {item.amount && (
                        <div className="text-sm font-semibold text-foreground whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
