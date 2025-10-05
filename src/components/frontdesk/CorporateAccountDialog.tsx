import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  CreditCard,
  Wallet,
  Plus,
  Minus,
  History,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useCorporateAccounts } from "@/hooks/useCorporateAccounts";
import { format } from "date-fns";

export function CorporateAccountDialog() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("accounts");
  const { data: accounts, isLoading } = useCorporateAccounts();
  
  // Form state
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState("0");
  const [initialWallet, setInitialWallet] = useState("0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Corporate Account Created",
      description: `${companyName} account has been set up successfully`,
    });
    
    // Reset form
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCreditLimit("0");
    setInitialWallet("0");
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="create">Create Account</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Accounts List */}
        <TabsContent value="accounts" className="space-y-4 mt-4">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : accounts && accounts.length > 0 ? (
              <div className="space-y-3">
                {accounts.map((account: any) => (
                  <Card key={account.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-lg">{account.company_name}</h3>
                              <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                                {account.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{account.contact_person}</p>
                          </div>
                        </div>

                        {/* Financial Overview */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <CreditCard className="h-4 w-4" />
                              <span>Credit Limit</span>
                            </div>
                            <p className="text-lg font-semibold">₦{account.credit_limit?.toLocaleString() || '0'}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Wallet className="h-4 w-4" />
                              <span>Wallet Balance</span>
                            </div>
                            <p className="text-lg font-semibold text-green-600">
                              ₦{((account.credit_limit || 0) - (account.current_balance || 0)).toLocaleString()}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <DollarSign className="h-4 w-4" />
                              <span>Outstanding</span>
                            </div>
                            <p className="text-lg font-semibold text-red-600">
                              ₦{account.current_balance?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{account.phone || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{account.email || "N/A"}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Plus className="h-4 w-4 mr-2" />
                            Top Up Wallet
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <History className="h-4 w-4 mr-2" />
                            View History
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No corporate accounts found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab("create")}
                >
                  Create First Account
                </Button>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Create Account */}
        <TabsContent value="create" className="space-y-4 mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="XYZ Corporation Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      placeholder="John Doe"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Company address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credit & Wallet Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Credit Limit (₦)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum amount the company can owe
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initialWallet">Initial Wallet Balance (₦)</Label>
                    <Input
                      id="initialWallet"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={initialWallet}
                      onChange={(e) => setInitialWallet(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pre-paid amount added to wallet
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span>How Credit & Wallet Work</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Wallet is prepaid balance that can be used for bookings</li>
                    <li>Credit limit allows post-paid purchases up to the limit</li>
                    <li>Wallet funds are used first, then credit is applied</li>
                    <li>Outstanding balance must be settled within payment terms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
