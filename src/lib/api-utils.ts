import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface EdgeFunctionCallOptions {
  functionName: string;
  body?: any;
  showErrorToast?: boolean;
  retryOnTokenExpiry?: boolean;
}

/**
 * Enhanced edge function caller with proper error handling and token expiry detection
 */
export async function callEdgeFunction<T = any>({
  functionName,
  body,
  showErrorToast = true,
  retryOnTokenExpiry = true
}: EdgeFunctionCallOptions): Promise<ApiResponse<T>> {
  
  try {
    console.log(`Calling edge function: ${functionName}`, body ? { body } : {});
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body || {}
    });

    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      
      // Handle specific error types
      if (error.message?.includes('returned a non-2xx status code')) {
        // Try to get more details from the response
        const errorMessage = 'Edge function failed with non-2xx status';
        
        if (showErrorToast) {
          toast.error(`Failed to ${functionName.replace('-', ' ')}: ${errorMessage}`);
        }
        
        return {
          success: false,
          error: errorMessage,
          code: 'EDGE_FUNCTION_ERROR'
        };
      }
      
      // Network or other errors
      const errorMessage = error.message || `Failed to call ${functionName}`;
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      return {
        success: false,
        error: errorMessage,
        code: 'NETWORK_ERROR'
      };
    }

    // Check if the response indicates an error
    if (data && typeof data === 'object') {
      if (data.success === false || data.error) {
        const errorMessage = data.error || data.message || 'Unknown error';
        const errorCode = data.code;
        
        console.error(`Edge function ${functionName} returned error:`, data);
        
        // Handle token expiry
        if (errorCode === 'TOKEN_EXPIRED' || errorMessage.toLowerCase().includes('token expired')) {
          console.log('Token expired, attempting to refresh session...');
          
          if (retryOnTokenExpiry) {
            try {
              const { error: refreshError } = await supabase.auth.refreshSession();
              
              if (!refreshError) {
                console.log('Session refreshed, retrying function call...');
                // Retry the function call once
                return callEdgeFunction({ 
                  functionName, 
                  body, 
                  showErrorToast, 
                  retryOnTokenExpiry: false // Don't retry again
                });
              }
            } catch (refreshError) {
              console.error('Failed to refresh session:', refreshError);
            }
          }
          
          // Session refresh failed or not attempted, show login prompt
          toast.error('Your session has expired. Please log in again.', {
            duration: 10000,
            action: {
              label: 'Login',
              onClick: () => {
                supabase.auth.signOut();
                window.location.href = '/';
              }
            }
          });
          
          return {
            success: false,
            error: 'Session expired',
            code: 'TOKEN_EXPIRED'
          };
        }
        
        if (showErrorToast) {
          toast.error(errorMessage);
        }
        
        return {
          success: false,
          error: errorMessage,
          code: errorCode || 'FUNCTION_ERROR'
        };
      }
      
      // Success response
      return {
        success: true,
        data: data
      };
    }
    
    // Fallback for unexpected response format
    return {
      success: true,
      data: data as T
    };
    
  } catch (error: any) {
    console.error(`Unexpected error calling ${functionName}:`, error);
    
    const errorMessage = error.message || `Unexpected error calling ${functionName}`;
    
    if (showErrorToast) {
      toast.error(errorMessage);
    }
    
    return {
      success: false,
      error: errorMessage,
      code: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Utility function to call multiple edge functions with error aggregation
 */
export async function callMultipleEdgeFunctions(calls: EdgeFunctionCallOptions[]): Promise<{
  success: boolean;
  results: ApiResponse[];
  errors: string[];
}> {
  const results = await Promise.allSettled(
    calls.map(call => callEdgeFunction(call))
  );
  
  const apiResults = results.map(result => 
    result.status === 'fulfilled' ? result.value : {
      success: false,
      error: result.reason?.message || 'Unknown error',
      code: 'CALL_FAILED'
    }
  );
  
  const errors = apiResults
    .filter(result => !result.success)
    .map(result => result.error || 'Unknown error');
  
  return {
    success: errors.length === 0,
    results: apiResults,
    errors
  };
}