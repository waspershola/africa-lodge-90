import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Zap, Settings, Package, MessageSquare, Check, Star } from 'lucide-react';
import { useAddons } from '@/hooks/useAddons';
import type { Addon, AddonType } from '@/types/billing';

const addonTypeIcons = {
  sms_bundle: MessageSquare,
  integration: Zap,
  customization: Settings,
  feature: Package
};

const addonTypeLabels = {
  sms_bundle: 'SMS Bundle',
  integration: 'Integration',
  customization: 'Customization',
  feature: 'Feature'
};

interface PurchaseModalProps {
  addon: Addon;
  onPurchase: (addonId: string, quantity: number, autoRenew: boolean) => void;
  onClose: () => void;
  loading: boolean;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ addon, onPurchase, onClose, loading }) => {
  const [quantity, setQuantity] = useState(1);
  const [autoRenew, setAutoRenew] = useState(false);

  const handlePurchase = () => {
    onPurchase(addon.id, quantity, autoRenew);
  };

  const totalCost = addon.price * quantity;
  const totalCredits = addon.sms_credits_bonus * quantity;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Purchase {addon.name}</CardTitle>
          <CardDescription>{addon.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          {addon.is_recurring && (
            <div className="flex items-center space-x-2">
              <Switch
                id="auto_renew"
                checked={autoRenew}
                onCheckedChange={setAutoRenew}
              />
              <Label htmlFor="auto_renew">Auto-renew</Label>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Unit Price:</span>
              <span>₦{addon.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            {addon.sms_credits_bonus > 0 && (
              <div className="flex justify-between">
                <span>SMS Credits:</span>
                <span>{totalCredits.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>₦{totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase} 
              disabled={loading}
              className="flex-1 bg-gradient-primary"
            >
              {loading ? 'Processing...' : 'Purchase'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AddonMarketplace: React.FC = () => {
  const { addons, tenantAddons, loading, purchaseAddon } = useAddons();
  const [selectedType, setSelectedType] = useState<AddonType | 'all'>('all');
  const [purchaseModal, setPurchaseModal] = useState<Addon | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const filteredAddons = addons.filter(addon => 
    selectedType === 'all' || addon.addon_type === selectedType
  );

  const getOwnedAddon = (addonId: string) => {
    return tenantAddons.find(ta => ta.addon_id === addonId && ta.is_active);
  };

  const handlePurchase = async (addonId: string, quantity: number, autoRenew: boolean) => {
    setPurchasing(true);
    try {
      const success = await purchaseAddon(addonId, quantity, autoRenew);
      if (success) {
        setPurchaseModal(null);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const isPopular = (addon: Addon) => {
    return addon.metadata?.popular === true;
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Add-on Marketplace</h3>
          <p className="text-sm text-muted-foreground">Extend your hotel management capabilities</p>
        </div>
        <Select value={selectedType} onValueChange={(value: AddonType | 'all') => setSelectedType(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Add-ons</SelectItem>
            {Object.entries(addonTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add-ons Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAddons.map((addon) => {
          const IconComponent = addonTypeIcons[addon.addon_type];
          const ownedAddon = getOwnedAddon(addon.id);
          const popular = isPopular(addon);

          return (
            <Card key={addon.id} className={`relative ${popular ? 'border-primary' : ''}`}>
              {popular && (
                <div className="absolute -top-2 left-4 bg-primary text-primary-foreground px-2 py-1 text-xs rounded-full flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{addon.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {addonTypeLabels[addon.addon_type]}
                      </Badge>
                    </div>
                  </div>
                  {ownedAddon && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" />
                      Owned
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {addon.description}
                </CardDescription>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Price:</span>
                    <span className="font-semibold">₦{addon.price.toLocaleString()}</span>
                  </div>
                  
                  {addon.sms_credits_bonus > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">SMS Credits:</span>
                      <span className="text-sm text-primary">+{addon.sms_credits_bonus}</span>
                    </div>
                  )}

                  {addon.is_recurring && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Billing:</span>
                      <Badge variant="secondary">
                        {addon.billing_interval}
                      </Badge>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-gradient-primary"
                  onClick={() => setPurchaseModal(addon)}
                  disabled={!!ownedAddon}
                >
                  {ownedAddon ? 'Already Owned' : 'Purchase'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAddons.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Add-ons Available</h3>
          <p className="text-muted-foreground">
            {selectedType === 'all' 
              ? 'No add-ons are currently available.' 
              : `No ${addonTypeLabels[selectedType as AddonType]?.toLowerCase()} add-ons available.`
            }
          </p>
        </div>
      )}

      {/* Purchase Modal */}
      {purchaseModal && (
        <PurchaseModal
          addon={purchaseModal}
          onPurchase={handlePurchase}
          onClose={() => setPurchaseModal(null)}
          loading={purchasing}
        />
      )}
    </div>
  );
};