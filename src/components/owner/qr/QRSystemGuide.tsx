import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, MessageSquare, Bell, History, CheckCircle, AlertTriangle } from "lucide-react";

export function QRSystemGuide() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR System Guide</h1>
        <p className="text-muted-foreground">
          Complete guide to using the enhanced QR code system with SMS notifications
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="guest">Guest Flow</TabsTrigger>
          <TabsTrigger value="staff">Staff Guide</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                System Overview
              </CardTitle>
              <CardDescription>
                How the enhanced QR system works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Key Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Persistent Sessions:</strong> Guests can resume their requests using short URLs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>SMS Notifications:</strong> Optional SMS updates for guest requests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Real-time Alerts:</strong> Staff receive instant notifications with sound</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Request History:</strong> Guests can track all their requests in one place</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>High-Quality QR Codes:</strong> SVG format with 'H' error correction</span>
                  </li>
                </ul>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Staff must grant notification permissions in their browser for real-time alerts to work.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-semibold">Request Flow</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge>1</Badge>
                    <span>Guest scans QR code → Session created with tracking token</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>2</Badge>
                    <span>Guest submits request → Optionally provides phone for SMS</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>3</Badge>
                    <span>System generates short URL → Guest can resume session anytime</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>4</Badge>
                    <span>Staff notified → Real-time alert with sound + toast</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>5</Badge>
                    <span>Guest receives SMS confirmation (if enabled)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>6</Badge>
                    <span>Guest can view request history via short URL</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <strong>SMS Provider Setup:</strong> Configure Termii, Twilio, or AfricasTalking in SMS Management
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <strong>SMS Templates:</strong> Create templates for different event types (request_received, etc.)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <strong>Credit Pool:</strong> Ensure sufficient SMS credits are available
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <strong>QR Codes:</strong> Generate and print QR codes for all guest rooms/areas
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" />
                  <div>
                    <strong>Staff Training:</strong> Train staff to enable browser notifications
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guest Experience Guide</CardTitle>
              <CardDescription>
                What guests see and do
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Step 1: Scan QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Guests scan the QR code in their room using any smartphone camera app. No app download required.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Step 2: Choose Service</h3>
                <p className="text-sm text-muted-foreground">
                  A mobile-friendly portal opens showing available services: Maintenance, Housekeeping, Room Service, etc.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Step 3: Submit Request</h3>
                <p className="text-sm text-muted-foreground">
                  Guest fills out the service form. Optional: They can provide their phone number for SMS updates.
                </p>
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    SMS notifications are optional. Guests who opt-in will receive confirmation and update messages.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Step 4: Receive Confirmation</h3>
                <p className="text-sm text-muted-foreground">
                  Guest receives a tracking number and short URL. They can bookmark this URL to track all requests.
                </p>
                <div className="p-3 bg-muted rounded-lg text-sm font-mono">
                  Example: https://yourhotel.app/r/abc123
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Step 5: Track Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Using the short URL, guests can view all their requests, see status updates, and submit new requests.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Staff Notification System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Critical:</strong> Staff must enable browser notifications when prompted for the first time.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-semibold">Notification Types</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>QR Request</Badge>
                      <span className="text-xs text-muted-foreground">Sound: Alert-High</span>
                    </div>
                    <p className="text-muted-foreground">Guest submits service request via QR code</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>Payment</Badge>
                      <span className="text-xs text-muted-foreground">Sound: Alert-High</span>
                    </div>
                    <p className="text-muted-foreground">Guest makes payment via QR (requires verification)</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">Guest Message</Badge>
                      <span className="text-xs text-muted-foreground">Sound: Notification</span>
                    </div>
                    <p className="text-muted-foreground">Guest sends message or inquiry</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Managing Requests</h3>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>Click notification or navigate to Front Desk → QR Requests</li>
                  <li>View request details, room number, and priority</li>
                  <li>Assign to appropriate staff member</li>
                  <li>Update status as you progress</li>
                  <li>Mark as complete when finished</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Notification Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Staff can control notification preferences in their profile settings:
                </p>
                <ul className="space-y-1 text-sm list-disc list-inside">
                  <li>Enable/disable sound alerts</li>
                  <li>Enable/disable toast notifications</li>
                  <li>Adjust notification volume</li>
                  <li>Set do-not-disturb hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-destructive">Staff not receiving notifications</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Check:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Browser notification permission granted</li>
                    <li>Notification settings enabled in profile</li>
                    <li>Browser not in "Do Not Disturb" mode</li>
                    <li>Active session (not logged out)</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-destructive">SMS not sending</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Check:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>SMS provider configured and enabled</li>
                    <li>Sufficient SMS credits available</li>
                    <li>Phone number includes country code (e.g., +234)</li>
                    <li>SMS template created for event type</li>
                    <li>Check SMS logs in SMS Management → Activity</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-destructive">QR code not scanning</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Solutions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Ensure QR code is printed clearly at adequate size</li>
                    <li>Use high error correction level ('H')</li>
                    <li>Verify QR code is active in system</li>
                    <li>Try different camera app</li>
                    <li>Ensure good lighting</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-destructive">Guest can't access request history</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Solutions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Verify short URL was properly generated</li>
                    <li>Check if session token is valid (24h default)</li>
                    <li>Guest can rescan QR to get new session</li>
                    <li>Check browser cookies enabled</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <History className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pro Tip:</strong> Check the SMS Activity Log and console logs for detailed error messages.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
