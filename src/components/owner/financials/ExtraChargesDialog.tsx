import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ExtraCharge {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'percentage' | 'per_night' | 'per_person';
  category: 'service' | 'damage' | 'convenience' | 'policy';
  isActive: boolean;
  autoCharge: boolean;
  description: string;
}

const mockCharges: ExtraCharge[] = [
  {
    id: '1',
    name: 'Late Checkout Fee',
    amount: 25,
    type: 'fixed',
    category: 'policy',
    isActive: true,
    autoCharge: false,
    description: 'Charged for checkout after 12 PM'
  },
  {
    id: '2',
    name: 'Pet Fee',
    amount: 15,
    type: 'per_night',
    category: 'service',
    isActive: true,
    autoCharge: true,
    description: 'Daily fee for pets in room'
  },
  {
    id: '3',
    name: 'Damage Deposit',
    amount: 100,
    type: 'fixed',
    category: 'damage',
    isActive: true,
    autoCharge: false,
    description: 'Refundable security deposit'
  },
  {
    id: '4',
    name: 'Resort Fee',
    amount: 30,
    type: 'per_night',
    category: 'service',
    isActive: true,
    autoCharge: true,
    description: 'Daily resort amenities fee'
  }
];

const extraChargeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(['fixed', 'percentage', 'per_night', 'per_person']),
  category: z.enum(['service', 'damage', 'convenience', 'policy']),
  description: z.string().min(5, "Description must be at least 5 characters"),
});

type ExtraChargeFormData = z.infer<typeof extraChargeSchema>;

interface ExtraChargesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExtraChargesDialog({ open, onOpenChange }: ExtraChargesDialogProps) {
  const [charges, setCharges] = useState<ExtraCharge[]>(mockCharges);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingCharge, setIsAddingCharge] = useState(false);
  const { toast } = useToast();

  const form = useForm<ExtraChargeFormData>({
    resolver: zodResolver(extraChargeSchema),
    defaultValues: {
      name: "",
      amount: 0,
      type: "fixed",
      category: "service",
      description: "",
    },
  });

  const handleAddCharge = async (data: ExtraChargeFormData) => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newCharge: ExtraCharge = {
        id: Date.now().toString(),
        name: data.name,
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description,
        isActive: true,
        autoCharge: false,
      };
      
      setCharges([...charges, newCharge]);
      
      toast({
        title: "Extra charge added",
        description: `${data.name} has been added to your charges list.`,
      });
      
      form.reset();
      setIsAddingCharge(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add extra charge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChargeStatus = (id: string) => {
    setCharges(charges.map(charge =>
      charge.id === id ? { ...charge, isActive: !charge.isActive } : charge
    ));
  };

  const toggleAutoCharge = (id: string) => {
    setCharges(charges.map(charge =>
      charge.id === id ? { ...charge, autoCharge: !charge.autoCharge } : charge
    ));
  };

  const removeCharge = (id: string) => {
    setCharges(charges.filter(charge => charge.id !== id));
    toast({
      title: "Charge removed",
      description: "The extra charge has been removed.",
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed': return 'Fixed Amount';
      case 'percentage': return 'Percentage';
      case 'per_night': return 'Per Night';
      case 'per_person': return 'Per Person';
      default: return type;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      service: 'bg-primary/10 text-primary border-primary/20',
      damage: 'bg-destructive/10 text-destructive border-destructive/20',
      convenience: 'bg-accent/10 text-accent border-accent/20',
      policy: 'bg-muted text-muted-foreground border-muted/20'
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || colors.policy}>
        {category}
      </Badge>
    );
  };

  const formatAmount = (amount: number, type: string) => {
    if (type === 'percentage') {
      return `${amount}%`;
    }
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extra Charges & Fees Configuration</DialogTitle>
          <DialogDescription>
            Manage additional charges that can be applied to guest stays and services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Charge Form */}
          {isAddingCharge ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddCharge)} className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Add New Extra Charge</h4>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsAddingCharge(false)}
                  >
                    Cancel
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charge Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Pool Access Fee" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charge Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="per_night">Per Night</SelectItem>
                            <SelectItem value="per_person">Per Person</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="service">Service Fee</SelectItem>
                            <SelectItem value="damage">Damage/Security</SelectItem>
                            <SelectItem value="convenience">Convenience</SelectItem>
                            <SelectItem value="policy">Policy Fee</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of when this charge applies" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Adding..." : "Add Extra Charge"}
                </Button>
              </form>
            </Form>
          ) : (
            <Button onClick={() => setIsAddingCharge(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add New Extra Charge
            </Button>
          )}

          {/* Charges Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Charge Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Auto Charge</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{charge.name}</div>
                        <div className="text-sm text-muted-foreground">{charge.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatAmount(charge.amount, charge.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(charge.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(charge.category)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={charge.autoCharge}
                        onCheckedChange={() => toggleAutoCharge(charge.id)}
                        disabled={!charge.isActive}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={charge.isActive}
                        onCheckedChange={() => toggleChargeStatus(charge.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeCharge(charge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}