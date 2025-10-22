import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MessageSquare } from "lucide-react";

interface SMSOptInProps {
  value: {
    phone: string;
    enabled: boolean;
  };
  onChange: (value: { phone: string; enabled: boolean }) => void;
}

export function SMSOptIn({ value, onChange }: SMSOptInProps) {
  const [localValue, setLocalValue] = useState(value);

  const handlePhoneChange = (phone: string) => {
    const newValue = { ...localValue, phone };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleEnabledChange = (enabled: boolean) => {
    const newValue = { ...localValue, enabled };
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">SMS Notifications (Optional)</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="sms-enabled" className="text-sm">
            Receive SMS updates
          </Label>
          <Switch
            id="sms-enabled"
            checked={localValue.enabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        {localValue.enabled && (
          <div className="space-y-2">
            <Label htmlFor="guest-phone">Phone Number</Label>
            <Input
              id="guest-phone"
              type="tel"
              value={localValue.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+1234567890"
              required={localValue.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +1 for US, +234 for Nigeria)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
