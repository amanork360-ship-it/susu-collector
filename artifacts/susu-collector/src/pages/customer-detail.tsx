import { useParams, Link } from "wouter";
import { 
  useGetCustomer, 
  useGetCustomerCollections, 
  useGetCustomerLoans,
  useGetCustomerReceipts
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Wallet, CreditCard, Receipt, MapPin, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id, 10);

  const { data: customer, isLoading: loadingCustomer } = useGetCustomer(customerId);
  const { data: collections, isLoading: loadingCollections } = useGetCustomerCollections(customerId);
  const { data: loans, isLoading: loadingLoans } = useGetCustomerLoans(customerId);
  const { data: receipts, isLoading: loadingReceipts } = useGetCustomerReceipts(customerId);

  if (loadingCustomer) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-24" />
        <Card>
          <CardContent className="p-6 flex items-center gap-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return <div className="p-6 text-center text-muted-foreground">Customer not found</div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <Link href="/customers">
        <a className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </a>
      </Link>

      <Card className="border-border overflow-hidden relative">
        <div className="absolute top-0 w-full h-16 bg-primary/10"></div>
        <CardContent className="p-6 pt-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="w-20 h-20 border-4 border-card bg-card shadow-sm">
              <AvatarImage src={customer.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {customer.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                <Badge 
                  variant="secondary" 
                  className={`
                    ${customer.collectionStatus === 'collected' ? 'bg-primary/20 text-primary border-primary/20' : ''}
                    ${customer.collectionStatus === 'pending' ? 'bg-orange-500/20 text-orange-500 border-orange-500/20' : ''}
                    ${customer.collectionStatus === 'overdue' ? 'bg-destructive/20 text-destructive border-destructive/20' : ''}
                  `}
                >
                  Status: {customer.collectionStatus}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
                {customer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {customer.address}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(customer.joinedAt)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Savings Balance</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(customer.savingsBalance)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Collected</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(customer.totalCollected)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Loan Status</p>
              <Badge variant="outline" className={customer.loanStatus !== 'none' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''}>
                {customer.loanStatus}
              </Badge>
            </div>
            {customer.outstandingLoan ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Outstanding Loan</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(customer.outstandingLoan)}</p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Link href={`/new-collection?customerId=${customer.id}`}>
          <Button className="w-full sm:w-auto" data-testid="button-quick-collect">
            <Wallet className="w-4 h-4 mr-2" />
            Record Collection
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="savings" className="w-full">
        <TabsList className="w-full h-auto p-1 bg-card border border-border">
          <TabsTrigger value="savings" className="flex-1 py-2 text-sm">
            <Wallet className="w-4 h-4 mr-2 hidden sm:inline" /> Savings
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex-1 py-2 text-sm">
            <CreditCard className="w-4 h-4 mr-2 hidden sm:inline" /> Loans
          </TabsTrigger>
          <TabsTrigger value="receipts" className="flex-1 py-2 text-sm">
            <Receipt className="w-4 h-4 mr-2 hidden sm:inline" /> Receipts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="savings" className="mt-4 space-y-4">
          <h3 className="font-semibold text-lg">Collection History</h3>
          {loadingCollections ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : collections?.length === 0 ? (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Wallet className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No collections recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {collections?.map(col => (
                <Card key={col.id} className="bg-card shadow-sm border-border">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{formatCurrency(col.amount)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <span>{formatDate(col.collectionDate)}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="capitalize">{col.paymentMethod.replace('_', ' ')}</span>
                      </p>
                    </div>
                    <Badge variant={col.status === 'completed' ? 'default' : col.status === 'failed' ? 'destructive' : 'secondary'}>
                      {col.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="loans" className="mt-4 space-y-4">
          <h3 className="font-semibold text-lg">Loan History</h3>
          {loadingLoans ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : loans?.length === 0 ? (
             <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="p-8 text-center text-muted-foreground">
                <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No loans on record</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {loans?.map(loan => (
                <Card key={loan.id} className="bg-card shadow-sm border-border">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">Principal Amount</p>
                        <p className="font-bold text-lg">{formatCurrency(loan.principalAmount)}</p>
                      </div>
                      <Badge className={
                        loan.status === 'active' ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' :
                        loan.status === 'overdue' ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' :
                        'bg-primary/20 text-primary hover:bg-primary/30'
                      }>
                        {loan.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
                        <p className="font-medium text-foreground">{formatCurrency(loan.outstandingBalance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Repaid</p>
                        <p className="font-medium text-foreground">{formatCurrency(loan.totalRepaid)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Start: {formatDate(loan.startDate)}
                      </div>
                      {loan.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due: {formatDate(loan.dueDate)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="receipts" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Receipts</h3>
            <Link href={`/receipts?customerId=${customer.id}`}>
              <Button variant="outline" size="sm">Upload New</Button>
            </Link>
          </div>
          {loadingReceipts ? (
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : receipts?.length === 0 ? (
             <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Receipt className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No receipts uploaded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {receipts?.map(receipt => (
                <Card key={receipt.id} className="overflow-hidden bg-card border-border">
                  <div className="aspect-square bg-muted relative">
                    {receipt.fileType === 'image' ? (
                      <img src={receipt.fileUrl} alt="Receipt" className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Receipt className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                      <p className="text-white text-xs font-medium truncate w-full">
                        {receipt.fileName || `Receipt #${receipt.id}`}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 text-xs flex justify-between items-center bg-card">
                    <span className="text-muted-foreground">{formatDate(receipt.uploadedAt)}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                      {receipt.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
