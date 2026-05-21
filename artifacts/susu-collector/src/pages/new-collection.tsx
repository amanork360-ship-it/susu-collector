import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListCustomers, 
  useCreateCollection 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { useEffect, useMemo } from "react";

const collectionSchema = z.object({
  customerId: z.coerce.number().positive("Please select a customer"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  collectionDate: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(["cash", "mobile_money", "bank_transfer"]),
  notes: z.string().optional(),
});

export default function NewCollection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract query params for pre-filling customerId if coming from detail page
  const searchParams = new URLSearchParams(window.location.search);
  const initialCustomerId = searchParams.get("customerId");

  const { data: customers, isLoading: loadingCustomers } = useListCustomers();
  const createCollection = useCreateCollection();

  const form = useForm<z.infer<typeof collectionSchema>>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      customerId: initialCustomerId ? parseInt(initialCustomerId, 10) : undefined,
      amount: undefined,
      collectionDate: new Date().toISOString().split('T')[0],
      paymentMethod: "cash",
      notes: "",
    },
  });

  const selectedCustomerId = form.watch("customerId");
  const selectedCustomer = useMemo(() => 
    customers?.find(c => c.id === selectedCustomerId), 
  [customers, selectedCustomerId]);

  const onSubmit = (data: z.infer<typeof collectionSchema>) => {
    createCollection.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Collection recorded successfully.",
            className: "bg-primary text-primary-foreground border-none",
          });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to record collection. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Record Collection</h1>
        <p className="text-muted-foreground text-sm mt-1">Enter details for the daily savings collection.</p>
      </div>

      <Card className="border-border">
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Collection Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      disabled={loadingCustomers}
                      onValueChange={(val) => field.onChange(parseInt(val, 10))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 bg-card" data-testid="select-customer">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} ({customer.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCustomer && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Current Savings: <span className="font-semibold text-foreground">GH₵ {selectedCustomer.savingsBalance.toFixed(2)}</span>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (GHS)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="h-12 text-lg font-medium bg-card"
                          data-testid="input-amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collectionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-12 bg-card"
                          data-testid="input-date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 bg-card" data-testid="select-payment-method">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details..."
                        className="resize-none bg-card min-h-[100px]"
                        data-testid="input-notes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-border mt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium"
                  disabled={createCollection.isPending}
                  data-testid="button-submit-collection"
                >
                  {createCollection.isPending ? "Recording..." : "Record Collection"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
