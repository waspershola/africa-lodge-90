import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  FileText, 
  Printer, 
  Download, 
  Mail, 
  Search,
  Plus,
  Trash2,
  Calculator,
  QrCode,
  User,
  CreditCard
} from "lucide-react";

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
}

interface Receipt {
  id: string;
  guestName: string;
  roomNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  department: string;
  template: string;
}

interface ReceiptGeneratorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  guestBill?: any;
  onReceiptGenerated?: (receipt: Receipt) => void;
}

export function ReceiptGenerator({ open, onOpenChange, guestBill, onReceiptGenerated }: ReceiptGeneratorProps) {
  const [selectedGuest, setSelectedGuest] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [department, setDepartment] = useState<string>("front-desk");
  const [template, setTemplate] = useState<string>("A4");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data
  const mockGuests = [
    { id: '1', name: 'John Doe', room: '201', balance: 45000 },
    { id: '2', name: 'Jane Smith', room: '305', balance: 0 },
    { id: '3', name: 'Michael Johnson', room: '102', balance: 12500 },
  ];

  const departments = [
    { value: 'front-desk', label: 'Front Desk' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'housekeeping', label: 'Housekeeping' },
  ];

  const templates = [
    { value: 'A4', label: 'A4 Standard' },
    { value: 'A5', label: 'A5 Compact' },
    { value: '80mm', label: '80mm Thermal' },
    { value: '58mm', label: '58mm Thermal' },
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'transfer', label: 'Bank Transfer' },
    { value: 'pos', label: 'POS Terminal' },
    { value: 'room-charge', label: 'Charge to Room' },
  ];

  const commonServices = [
    { description: 'Room Service', price: 5000 },
    { description: 'Laundry Service', price: 2500 },
    { description: 'Airport Transfer', price: 8000 },
    { description: 'Extra Towels', price: 1000 },
    { description: 'Minibar Items', price: 3000 },
    { description: 'Late Checkout Fee', price: 5000 },
  ];

  const addItem = (description?: string, unitPrice?: number) => {
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      description: description || '',
      quantity: 1,
      unitPrice: unitPrice || 0,
      total: unitPrice || 0,
      taxRate: 7.5, // Default VAT rate
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.total * item.taxRate / 100), 0);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const generateReceipt = async (action: 'print' | 'pdf' | 'email') => {
    if (!selectedGuest || items.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select a guest and add at least one item",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    const guest = mockGuests.find(g => g.id === selectedGuest);
    const { subtotal, taxAmount, total } = calculateTotals();
    
    const receipt: Receipt = {
      id: `RCP-${Date.now()}`,
      guestName: guest?.name || '',
      roomNumber: guest?.room || '',
      items,
      subtotal,
      taxAmount,
      total,
      paymentMethod,
      notes,
      department,
      template,
    };

    // Simulate generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    switch (action) {
      case 'print':
        toast({
          title: "Receipt printed",
          description: `Receipt ${receipt.id} sent to printer`,
        });
        break;
      case 'pdf':
        toast({
          title: "PDF generated",
          description: `Receipt saved as ${receipt.id}.pdf`,
        });
        break;
      case 'email':
        toast({
          title: "Email sent",
          description: `Receipt emailed to guest`,
        });
        break;
    }

    onReceiptGenerated?.(receipt);
    setIsGenerating(false);
    
    // Reset form
    setItems([]);
    setNotes('');
    setPaymentMethod('');
  };

  const filteredGuests = mockGuests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.room.includes(searchQuery)
  );

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Receipt Generator</h3>
          <p className="text-sm text-muted-foreground">
            Create receipts and invoices for guest services
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((tmpl) => (
                <SelectItem key={tmpl.value} value={tmpl.value}>
                  {tmpl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Guest Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest-search">Search Guest</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="guest-search"
                    placeholder="Search by name or room number"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Guest</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filteredGuests.map((guest) => (
                    <div
                      key={guest.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedGuest === guest.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedGuest(guest.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{guest.name}</div>
                          <div className="text-sm text-muted-foreground">Room {guest.room}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Balance:</div>
                          <div className={`font-medium ${guest.balance > 0 ? 'text-warning' : 'text-success'}`}>
                            ₦{guest.balance.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Receipt Items
                </div>
                <Button size="sm" onClick={() => addItem()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Add Common Services */}
              <div className="space-y-2">
                <Label>Quick Add Common Services</Label>
                <div className="grid grid-cols-2 gap-2">
                  {commonServices.map((service, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => addItem(service.description, service.price)}
                      className="justify-start text-xs"
                    >
                      {service.description} (₦{service.price.toLocaleString()})
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <Input
                          value={`₦${item.total.toLocaleString()}`}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No items added yet</p>
                    <p className="text-sm">Add items to generate a receipt</p>
                  </div>
                )}
              </div>

              {/* Totals */}
              {items.length > 0 && (
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₦{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>VAT (7.5%):</span>
                      <span>₦{taxAmount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or comments"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Receipt Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Receipt Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white text-black min-h-96">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-4" />
                  <h2 className="text-2xl font-bold">Lagos Grand Hotel</h2>
                  <p className="text-sm">123 Victoria Island, Lagos, Nigeria</p>
                  <p className="text-sm">Tel: +234 123 456 7890</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Receipt #: RCP-{Date.now()}</span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                  
                  {selectedGuest && (
                    <div>
                      <strong>Guest:</strong> {mockGuests.find(g => g.id === selectedGuest)?.name}<br />
                      <strong>Room:</strong> {mockGuests.find(g => g.id === selectedGuest)?.room}<br />
                      <strong>Department:</strong> {departments.find(d => d.value === department)?.label}
                    </div>
                  )}

                  {items.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div>
                              <div>{item.description || 'Item'}</div>
                              <div className="text-xs text-gray-500">
                                {item.quantity} × ₦{item.unitPrice.toLocaleString()}
                              </div>
                            </div>
                            <div>₦{item.total.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between mb-2">
                          <span>Subtotal</span>
                          <span>₦{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm">
                          <span>VAT (7.5%)</span>
                          <span>₦{taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Total</span>
                          <span>₦{total.toLocaleString()}</span>
                        </div>
                      </div>

                      {paymentMethod && (
                        <div className="mt-4 text-sm">
                          <strong>Payment Method:</strong> {paymentMethods.find(p => p.value === paymentMethod)?.label}
                        </div>
                      )}

                      {notes && (
                        <div className="mt-4 text-sm">
                          <strong>Notes:</strong> {notes}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center mt-6">
                    <div className="w-20 h-20 bg-gray-200 mx-auto mb-2" />
                    <p className="text-xs">Scan for digital receipt</p>
                  </div>

                  <div className="text-center text-sm mt-6">
                    Thank you for your business
                  </div>

                  <div className="text-right text-xs mt-4">
                    Served by: Front Desk Agent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => generateReceipt('print')}
              disabled={isGenerating || !selectedGuest || items.length === 0}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => generateReceipt('pdf')}
              disabled={isGenerating || !selectedGuest || items.length === 0}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => generateReceipt('email')}
              disabled={isGenerating || !selectedGuest || items.length === 0}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>

          {isGenerating && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground mt-2">Generating receipt...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}