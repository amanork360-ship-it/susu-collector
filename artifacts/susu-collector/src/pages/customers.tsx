import { useState } from "react";
import { Link } from "wouter";
import { useListCustomers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronRight, UserCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data: customers, isLoading } = useListCustomers({
    search: search.length >= 2 ? search : undefined,
    status: status !== "all" ? (status as any) : undefined,
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-9 bg-card border-border h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-customers"
          />
        </div>

        <Tabs value={status} onValueChange={setStatus} className="w-full">
          <TabsList className="w-full h-auto p-1 bg-muted">
            <TabsTrigger value="all" className="flex-1 py-2 text-xs">All</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 py-2 text-xs">Pending</TabsTrigger>
            <TabsTrigger value="collected" className="flex-1 py-2 text-xs">Collected</TabsTrigger>
            <TabsTrigger value="overdue" className="flex-1 py-2 text-xs">Overdue</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto -mx-4 px-4 md:mx-0 md:px-0 space-y-3 pb-8">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : customers?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No customers found</p>
          </div>
        ) : (
          customers?.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <a className="block hover-elevate transition-all">
                <Card className="border-border bg-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="w-12 h-12 border border-border">
                      <AvatarImage src={customer.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {customer.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{customer.name}</h3>
                        <Badge 
                          variant="secondary" 
                          className={`
                            ${customer.collectionStatus === 'collected' ? 'bg-primary/20 text-primary border-primary/20' : ''}
                            ${customer.collectionStatus === 'pending' ? 'bg-orange-500/20 text-orange-500 border-orange-500/20' : ''}
                            ${customer.collectionStatus === 'overdue' ? 'bg-destructive/20 text-destructive border-destructive/20' : ''}
                          `}
                        >
                          {customer.collectionStatus}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mt-2">
                        <div className="text-muted-foreground">
                          Savings: <span className="font-medium text-foreground">{formatCurrency(customer.savingsBalance)}</span>
                        </div>
                        {customer.loanStatus !== 'none' && (
                          <div className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                            Loan: {customer.loanStatus}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
