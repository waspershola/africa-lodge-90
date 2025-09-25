import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function TestCreateGlobalUserButton() {
  const [testing, setTesting] = useState(false);

  const testCreateGlobalUser = async () => {
    setTesting(true);
    try {
      console.log('Testing create-global-user edge function directly...');
      
      const testUserData = {
        fullName: 'Test User',
        email: 'test@example.com',
        role: 'SUPPORT_STAFF',
        department: 'Test Department',
        generateTempPassword: true,
        sendEmail: false
      };

      console.log('Sending test data:', testUserData);

      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/create-global-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(testUserData)
      });

      console.log('Direct fetch response status:', response.status);
      console.log('Direct fetch response headers:', Object.fromEntries(response.headers));

      const responseText = await response.text();
      console.log('Direct fetch response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Direct fetch response JSON:', responseData);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        responseData = { error: 'Invalid JSON response', rawResponse: responseText };
      }

      if (response.ok) {
        toast({
          title: 'Direct Test Successful',
          description: 'create-global-user function responded successfully',
        });
      } else {
        toast({
          title: 'Direct Test Failed',
          description: `Status ${response.status}: ${responseData?.error || responseText}`,
          variant: 'destructive',
        });
      }

    } catch (err) {
      console.error('Direct test error:', err);
      toast({
        title: 'Direct Test Failed',
        description: `Exception: ${err.message}`,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Button 
      onClick={testCreateGlobalUser} 
      disabled={testing}
      variant="outline"
      size="sm"
    >
      {testing ? 'Testing...' : 'Direct Test Create User'}
    </Button>
  );
}