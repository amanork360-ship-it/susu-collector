import { useState, useRef } from "react";
import { 
  useListReceipts, 
  useListCustomers,
  useCreateReceipt
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Upload, FileImage, Search, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Receipts() {
  const { data: receipts, isLoading, refetch } = useListReceipts();
  const { data: customers } = useListCustomers();
  const createReceipt = useCreateReceipt();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !customerId) return;

    // Simulate file upload process
    const isImage = selectedFile.type.startsWith('image/');
    
    // In a real app we would upload the file to a storage bucket first
    // and get back a URL. Here we simulate it.
    const fakeUrl = URL.createObjectURL(selectedFile);
    
    createReceipt.mutate(
      {
        data: {
          customerId: parseInt(customerId, 10),
          fileUrl: fakeUrl,
          fileType: isImage ? 'image' : 'pdf',
          fileName: selectedFile.name,
          notes,
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Receipt Uploaded",
            description: "The receipt has been successfully uploaded and linked to the customer.",
            className: "bg-primary text-primary-foreground border-none",
          });
          setOpen(false);
          setSelectedFile(null);
          setCustomerId("");
          setNotes("");
          refetch(); // Reload the list
        },
        onError: () => {
          toast({
            title: "Upload Failed",
            description: "There was a problem uploading the receipt.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and upload customer receipts</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-receipt">
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Receipt</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="w-full bg-background" data-testid="select-receipt-customer">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Receipt File</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                    ${selectedFile ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}
                  `}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-area"
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*,.pdf"
                    onChange={handleFileChange} 
                  />
                  
                  {selectedFile ? (
                    <>
                      <FileImage className="w-10 h-10 text-primary mb-2" />
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">Image or PDF (max 5MB)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea 
                  placeholder="E.g. Bank deposit slip..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background resize-none"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || !customerId || createReceipt.isPending}
                data-testid="button-submit-upload"
              >
                {createReceipt.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search receipts..."
          className="pl-9 bg-card border-border h-11"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))
        ) : receipts?.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <FileImage className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No receipts uploaded yet.</p>
          </div>
        ) : (
          receipts?.map((receipt) => (
            <Card key={receipt.id} className="overflow-hidden bg-card border-border group hover-elevate transition-all">
              <div className="aspect-square bg-muted relative">
                {receipt.fileType === 'image' ? (
                  <img 
                    src={receipt.fileUrl} 
                    alt={receipt.fileName} 
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileImage className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="shadow-sm font-medium bg-background/80 backdrop-blur-sm border-none">
                    {receipt.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-semibold truncate text-foreground mb-1" title={receipt.customerName || ''}>
                  {receipt.customerName}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="truncate mr-2">{receipt.fileName}</span>
                  <span className="whitespace-nowrap flex-shrink-0">{formatDate(receipt.uploadedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
