import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function TestCreateUserButton() {
  const [testing, setTesting] = useState(false);

  const testFunction = async () => {
    setTesting(true);
    try {
      console.log('Testing simple edge function...');
      
      // Test simple function first
      const { data: simpleData, error: simpleError } = await supabase.functions.invoke('simple-test', {
        body: { test: 'simple' }
      });

      console.log('Simple test result:', { data: simpleData, error: simpleError });

      if (simpleError) {
        toast({
          title: 'Simple Test Failed',
          description: `Network error: ${simpleError.message}`,
          variant: 'destructive',
        });
        return;
      }

      // If simple test works, try the complex one
      console.log('Testing complex edge function...');
      const { data, error } = await supabase.functions.invoke('test-create-user', {
        body: { test: 'data', timestamp: new Date().toISOString() }
      });

      console.log('Complex test result:', { data, error });

      if (error) {
        toast({
          title: 'Complex Test Failed',
          description: `Network error: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        toast({
          title: 'All Tests Successful',
          description: 'Both edge functions are working correctly',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: data?.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Test error:', err);
      toast({
        title: 'Test Failed',
        description: 'Exception occurred during test',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Button 
      onClick={testFunction} 
      disabled={testing}
      variant="outline"
      size="sm"
    >
      {testing ? 'Testing...' : 'Test Edge Functions'}
    </Button>
  );
}