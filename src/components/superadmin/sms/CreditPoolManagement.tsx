// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Plus, CreditCard, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface TenantCredit {
  tenant_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  last_topup_at?: string;
  hotel_name: string;
  plan: string;
  status: string;
}

export function CreditPoolManagement() {
  const [tenantCredits, setTenantCredits] = useState<TenantCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantCredit | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");

  useEffect(() => {
    fetchTenantCredits();
  }, []);

  const fetchTenantCredits = async () => {
    try {
      // Fetch SMS credits with tenant information - using correct field names
      const { data: credits, error } = await supabase
        .from('sms_credits')
        .select(`
          *
        `);

      if (error) throw error;

      // Mock data for now since tenant table structure needs to be verified
      const formattedCredits = credits?.map(credit => ({
        ...credit,
        hotel_name: `Hotel ${credit.tenant_id.slice(-4)}`,
        plan: 'pro',
        status: 'active'
      })) || [];

      setTenantCredits(formattedCredits);
    } catch (error) {
      console.error('Error fetching tenant credits:', error);
      toast.error("Failed to load tenant credits");
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!selectedTenant || !topupAmount) return;

    try {
      const credits = parseInt(topupAmount);
      
      const { error } = await supabase.rpc('provision_sms_credits', {
        p_tenant_id: selectedTenant.tenant_id,
        p_credits: credits,
        p_source_type: 'manual_topup',
        p_purpose: 'Super admin manual topup'
      });

      if (error) throw error;

      toast.success(`${credits} SMS credits added successfully`);
      fetchTenantCredits();
      setIsDialogOpen(false);
      setSelectedTenant(null);
      setTopupAmount("");
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error("Failed to add SMS credits");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge>Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'trial':
        return <Badge variant="secondary">Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-purple-100 text-purple-800">Enterprise</Badge>;
      case 'pro':
        return <Badge className="bg-blue-100 text-blue-800">Pro</Badge>;
      case 'basic':
        return <Badge className="bg-gray-100 text-gray-800">Basic</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading tenant credits...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Credit Pool Management</h2>
          <p className="text-muted-foreground">
            Manage SMS credit allocations across all hotels
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantCredits.reduce((sum, t) => sum + t.balance, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all hotels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Balance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tenantCredits.filter(t => t.balance < 100).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Hotels with &lt; 100 credits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Used</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tenantCredits.reduce((sum, t) => sum + t.total_used, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hotel SMS Credits</CardTitle>
          <CardDescription>
            SMS credit balances and usage for all hotels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Credits Available</TableHead>
                <TableHead>Credits Used</TableHead>
                <TableHead>Last Top-up</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantCredits.map((tenant) => (
                <TableRow key={tenant.tenant_id}>
                  <TableCell className="font-medium">
                    {tenant.hotel_name}
                  </TableCell>
                  <TableCell>
                    {getPlanBadge(tenant.plan)}
                  </TableCell>
                  <TableCell>
                    <span className={tenant.balance < 100 ? 'text-yellow-600 font-semibold' : ''}>
                      {tenant.balance.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>{tenant.total_used.toLocaleString()}</TableCell>
                  <TableCell>
                    {tenant.last_topup_at 
                      ? new Date(tenant.last_topup_at).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tenant.status)}
                  </TableCell>
                  <TableCell>
                    <Dialog open={isDialogOpen && selectedTenant?.tenant_id === tenant.tenant_id} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTenant(tenant)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Top-up
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add SMS Credits</DialogTitle>
                          <DialogDescription>
                            Add SMS credits for {tenant.hotel_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="credits">Number of Credits</Label>
                            <Input
                              id="credits"
                              type="number"
                              value={topupAmount}
                              onChange={(e) => setTopupAmount(e.target.value)}
                              placeholder="Enter number of credits"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current balance: {tenant.balance} credits
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleTopup}>
                            Add Credits
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}