import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnboardingData } from '../OnboardingWizard';

interface HotelInformationStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const countries = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Morocco',
  'United States', 'United Kingdom', 'Canada', 'Australia'
];

const timezones = [
  { value: 'Africa/Lagos', label: 'West Africa Time (Lagos)' },
  { value: 'Africa/Accra', label: 'Ghana Mean Time (Accra)' },
  { value: 'Africa/Nairobi', label: 'East Africa Time (Nairobi)' },
  { value: 'Africa/Johannesburg', label: 'South Africa Time' },
  { value: 'Africa/Cairo', label: 'Egypt Standard Time' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time' },
];

const currencies = [
  { value: 'NGN', label: '₦ Nigerian Naira (NGN)' },
  { value: 'GHS', label: '₵ Ghanaian Cedi (GHS)' },
  { value: 'KES', label: 'KSh Kenyan Shilling (KES)' },
  { value: 'ZAR', label: 'R South African Rand (ZAR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
];

export function HotelInformationStep({ data, updateData }: HotelInformationStepProps) {
  const updateHotelInfo = (field: string, value: string) => {
    updateData({
      hotelInfo: {
        ...data.hotelInfo,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Basic Hotel Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="hotelName">Hotel Name *</Label>
            <Input
              id="hotelName"
              value={data.hotelInfo.name}
              onChange={(e) => updateHotelInfo('name', e.target.value)}
              placeholder="Enter your hotel name"
              className="mt-1"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={data.hotelInfo.address}
              onChange={(e) => updateHotelInfo('address', e.target.value)}
              placeholder="Enter street address"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={data.hotelInfo.city}
              onChange={(e) => updateHotelInfo('city', e.target.value)}
              placeholder="Enter city"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={data.hotelInfo.country}
              onValueChange={(value) => updateHotelInfo('country', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={data.hotelInfo.phone}
              onChange={(e) => updateHotelInfo('phone', e.target.value)}
              placeholder="+234 xxx xxx xxxx"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={data.hotelInfo.supportEmail}
              onChange={(e) => updateHotelInfo('supportEmail', e.target.value)}
              placeholder="support@yourhotel.com"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={data.hotelInfo.timezone}
              onValueChange={(value) => updateHotelInfo('timezone', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={data.hotelInfo.currency}
              onValueChange={(value) => updateHotelInfo('currency', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}