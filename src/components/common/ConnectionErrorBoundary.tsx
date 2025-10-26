/**
 * F.11.4: Connection Error Boundary
 * 
 * Gracefully handles connection-related errors and provides recovery UI
 */

import React, { Component, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ConnectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State | null {
    // Only catch connection-related errors
    const errorMessage = error.message?.toLowerCase() || '';
    const isConnectionError = 
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('supabase');
    
    if (isConnectionError) {
      return { hasError: true, error };
    }
    
    // Re-throw non-connection errors for default error boundary
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ConnectionErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Alert className="max-w-md border-destructive">
            <WifiOff className="h-5 w-5 text-destructive" />
            <AlertTitle className="text-lg font-semibold">Connection Issue</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || 'A connection error occurred. This might be due to network issues or temporary server problems.'}
              </p>
              <Button
                onClick={this.handleReload}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                If the problem persists, please check your internet connection.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
