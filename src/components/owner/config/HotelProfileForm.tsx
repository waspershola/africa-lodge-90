import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText,
  Building2,
  Star,
  Users
} from "lucide-react";
import { useTenantInfo } from "@/hooks/useTenantInfo";

interface HotelProfileFormProps {
  onDataChange: () => void;
}

const HotelProfileForm = ({ onDataChange }: HotelProfileFormProps) => {
  const { data: tenantInfo } = useTenantInfo();
  const [profileData, setProfileData] = useState({
    // Basic Information
    hotelName: "",
    description: "A luxury hotel with world-class amenities and service.",
    category: "5-star",
    establishedYear: "2018",
    
    // Contact Information
    address: "",
    city: "",
    state: "", 
    country: "Nigeria",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    
    // Business Registration
    businessRegNumber: "",
    tinNumber: "",
    vatNumber: "",
    
    // Operational Details
    totalRooms: "120",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    currency: "NGN",
    timezone: "Africa/Lagos"
  });

  // Load tenant data when available
  useEffect(() => {
    if (tenantInfo) {
      setProfileData(prev => ({
        ...prev,
        hotelName: tenantInfo.hotel_name,
        address: tenantInfo.address || "",
        city: tenantInfo.city || "",
        country: tenantInfo.country || "Nigeria",
        phone: tenantInfo.phone || "",
        email: tenantInfo.email || "",
        currency: tenantInfo.currency || "NGN",
        timezone: tenantInfo.timezone || "Africa/Lagos"
      }));
    }
  }, [tenantInfo]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    onDataChange();
  };

  const nigerianStates = [
    "Lagos State", "Abuja FCT", "Kano State", "Rivers State", "Ogun State",
    "Kaduna State", "Oyo State", "Delta State", "Edo State", "Anambra State"
  ];

  const hotelCategories = [
    "1-star", "2-star", "3-star", "4-star", "5-star", "Boutique", "Resort", "Business"
  ];

  return (
    <div className="space-y-8">
      {/* Basic Hotel Information */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Basic Hotel Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hotelName">Hotel Name *</Label>
              <Input
                id="hotelName"
                value={profileData.hotelName}
                onChange={(e) => handleInputChange("hotelName", e.target.value)}
                placeholder="Enter hotel name"
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Hotel Category *</Label>
              <Select value={profileData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {hotelCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-accent" />
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Hotel Description</Label>
            <Textarea
              id="description"
              value={profileData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your hotel's unique features and amenities"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="establishedYear">Established Year</Label>
              <Input
                id="establishedYear"
                value={profileData.establishedYear}
                onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                placeholder="2020"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalRooms">Total Rooms *</Label>
              <Input
                id="totalRooms"
                type="number"
                value={profileData.totalRooms}
                onChange={(e) => handleInputChange("totalRooms", e.target.value)}
                placeholder="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={profileData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Textarea
              id="address"
              value={profileData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter full address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={profileData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Lagos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select value={profileData.state} onValueChange={(value) => handleInputChange("state", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianStates.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={profileData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Nigeria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={profileData.postalCode}
                onChange={(e) => handleInputChange("postalCode", e.target.value)}
                placeholder="100001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+234 1 234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="info@hotel.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website URL
              </Label>
              <Input
                id="website"
                value={profileData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="www.hotel.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Registration */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Business Registration & Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="businessRegNumber">Business Registration Number *</Label>
              <Input
                id="businessRegNumber"
                value={profileData.businessRegNumber}
                onChange={(e) => handleInputChange("businessRegNumber", e.target.value)}
                placeholder="RC-1234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tinNumber">TIN Number *</Label>
              <Input
                id="tinNumber"
                value={profileData.tinNumber}
                onChange={(e) => handleInputChange("tinNumber", e.target.value)}
                placeholder="12345678-0001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                value={profileData.vatNumber}
                onChange={(e) => handleInputChange("vatNumber", e.target.value)}
                placeholder="VAT-12345678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Settings */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Operational Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Check-in Time *</Label>
              <Input
                id="checkInTime"
                type="time"
                value={profileData.checkInTime}
                onChange={(e) => handleInputChange("checkInTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Check-out Time *</Label>
              <Input
                id="checkOutTime"
                type="time"
                value={profileData.checkOutTime}
                onChange={(e) => handleInputChange("checkOutTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select value={profileData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                  <SelectItem value="Africa/Cairo">Africa/Cairo (EET)</SelectItem>
                  <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HotelProfileForm;