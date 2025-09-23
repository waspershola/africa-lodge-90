import React, { useState } from 'react';
import { Phone, MessageCircle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FrontDeskServiceProps {
  qrToken: string;
  sessionToken: string;
  hotelPhone: string;
}

export default function FrontDeskService({ qrToken, sessionToken, hotelPhone }: FrontDeskServiceProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const callFrontDesk = () => {
    window.location.href = `tel:${hotelPhone}`;
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/guest/qr/${qrToken}/front-desk-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_session_id: sessionToken,
          message: message,
          priority: 2,
          notes: 'Guest requested front desk assistance'
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setMessage('');
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error sending message to front desk:', error);
      alert('Failed to send message. Please try calling directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Front Desk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              For immediate assistance, call our front desk directly. For non-urgent matters, you can also send a message below.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={callFrontDesk}
            className="w-full"
            size="lg"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Front Desk Now
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Send Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitted ? (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Your message has been sent to the front desk. They will respond shortly.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">How can we help you?</label>
                <Textarea
                  placeholder="Type your message or question here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={sendMessage}
                disabled={submitting || !message.trim()}
                className="w-full"
              >
                {submitting ? 'Sending Message...' : 'Send Message to Front Desk'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Available 24/7 • Response time: Usually within 5-10 minutes</p>
      </div>
    </div>
  );
}