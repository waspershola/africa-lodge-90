import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Building2, 
  CreditCard, 
  Users, 
  DollarSign,
  Edit,
  Trash2,
  Phone,
  Mail
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { useCorporateAccounts, useCreateCorporateAccount, useUpdateCorporateAccount, useDeleteCorporateAccount } from "@/hooks/useCorporateAccounts";

interface CorporateAccount {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  payment_terms: number;
  credit_limit: number;
  current_balance: number;
  discount_rate?: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Remove mock data - now using real database integration
export default function CorporateAccounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);
  
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  
  // Real database hooks
  const { data: corporateAccounts = [], isLoading } = useCorporateAccounts();
  const createAccount = useCreateCorporateAccount();
  const updateAccount = useUpdateCorporateAccount();
  const deleteAccount = useDeleteCorporateAccount();

  const filteredAccounts = corporateAccounts.filter(account => {
    const matchesSearch = account.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateAccount = () => {
    // TODO: Connect to real database - for now showing placeholder
    toast({
      title: "Ready for Implementation",
      description: "Corporate account creation connected to database. Add form implementation needed.",
    });
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    toast({
      title: "Ready for Implementation", 
      description: "Corporate account editing connected to database. Edit form implementation needed.",
    });
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this corporate account?')) {
      try {
        await deleteAccount.mutateAsync(accountId);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading corporate accounts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Corporate Accounts
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Corporate Account
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search Accounts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Company name, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAccounts.map((account) => (
          <Card key={account.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{account.company_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact: {account.contact_person || 'N/A'}
                  </p>
                </div>
                <Badge className={getStatusColor(account.status)}>
                  {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-2">
                {account.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{account.email}</span>
                  </div>
                )}
                {account.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{account.phone}</span>
                  </div>
                )}
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="font-semibold">{formatPrice(account.credit_limit)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className={`font-semibold ${account.current_balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatPrice(account.current_balance)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Terms</p>
                  <p className="font-semibold">{account.payment_terms} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discount Rate</p>
                  <p className="font-semibold">{account.discount_rate || 0}%</p>
                </div>
              </div>

              {account.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{account.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditAccount(account)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAccount(account.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium text-muted-foreground mb-2">No corporate accounts found</div>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'Create your first corporate account to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Corporate Account
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Account Dialog - placeholder */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Corporate Account</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Corporate account creation form will be implemented here.</p>
            <Button 
              onClick={handleCreateAccount}
              className="mt-4"
            >
              Create Account (Coming Soon)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}