import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Loader2, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DatabaseCleanup() {
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const { toast } = useToast();
  const { user, tenant } = useAuth();
  const tenantId = tenant?.tenant_id;

  const handleFixCharges = async () => {
    if (!tenantId) {
      toast({
        title: "Error",
        description: "No tenant ID found",
        variant: "destructive"
      });
      return;
    }

    setIsFixing(true);
    try {
      console.log('[Database Cleanup] Fixing double-taxed charges for tenant:', tenantId);
      
      const { data, error } = await supabase
        .rpc('fix_double_taxed_charges', { p_tenant_id: tenantId });

      if (error) throw error;

      const result = data[0];
      console.log('[Database Cleanup] Fix result:', result);

      setScanResult(result);

      toast({
        title: "✓ Database Cleanup Complete",
        description: `Fixed ${result.fixed_count} charge${result.fixed_count !== 1 ? 's' : ''}`,
      });
    } catch (error: any) {
      console.error('[Database Cleanup] Error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Database Cleanup Utility</CardTitle>
          </div>
          <CardDescription>
            Fix double-taxed folio charges caused by previous tax calculation issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>What this fixes:</strong> Some folio charges were stored with incorrect tax calculations, 
              causing guests to be overcharged. This utility recalculates and corrects those charges.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Issue Details:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Room assignments may have applied taxes twice</li>
              <li>Base amounts stored incorrectly in some charges</li>
              <li>Folio balances showing higher than actual amount owed</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleFixCharges} 
              disabled={isFixing}
              className="w-full"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing Charges...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Fix Double-Taxed Charges
                </>
              )}
            </Button>
          </div>

          {scanResult && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4 text-success" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <strong>Cleanup Complete:</strong>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      {scanResult.fixed_count} charge{scanResult.fixed_count !== 1 ? 's' : ''} fixed
                    </Badge>
                  </div>
                  
                  {scanResult.charges_details && JSON.parse(scanResult.charges_details).length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Fixed Charges:</p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {JSON.parse(scanResult.charges_details).map((charge: any, idx: number) => (
                          <div key={idx} className="text-xs bg-background/50 p-2 rounded border">
                            <div className="flex justify-between">
                              <span className="font-mono text-muted-foreground">
                                {charge.folio_id.substring(0, 8)}...
                              </span>
                              <span className={charge.difference > 0 ? 'text-success' : ''}>
                                Corrected: ₦{Math.abs(charge.difference).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between mt-1 text-muted-foreground">
                              <span>Old: ₦{charge.old_amount.toFixed(2)}</span>
                              <span>→</span>
                              <span>New: ₦{charge.new_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    All affected folio balances have been recalculated automatically.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This utility is safe to run multiple times. 
              It only updates charges that have missing or incorrect tax breakdowns.
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>For Administrators:</strong> This cleanup tool uses the current tax settings 
          from Configuration Center (VAT {7.5}%, Service Charge {10}%) to recalculate all charges. 
          Make sure your tax settings are correct before running the cleanup.
        </AlertDescription>
      </Alert>
    </div>
  );
}
