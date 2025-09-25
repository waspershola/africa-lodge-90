import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function TestCreateUserButton() {
  const [testing, setTesting] = useState(false);

  const testFunction = async () => {
    setTesting(true);
    try {
      console.log('Testing edge function...');
      
      const { data, error } = await supabase.functions.invoke('test-create-user', {
        body: { test: 'data', timestamp: new Date().toISOString() }
      });

      console.log('Test function result:', { data, error });

      if (error) {
        toast({
          title: 'Test Failed',
          description: `Network error: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      if (data?.success) {
        toast({
          title: 'Test Successful',
          description: 'Edge function is working correctly',
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