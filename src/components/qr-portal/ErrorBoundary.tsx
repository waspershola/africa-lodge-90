import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class QRPortalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('QR Portal Error:', error, errorInfo);
    
    // In production: send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                
                <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
                <p className="text-muted-foreground mb-6">
                  We're sorry, but there was an error loading the QR portal. 
                  Please try again or contact front desk for assistance.
                </p>
                
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-3 bg-red-50 rounded text-left">
                    <pre className="text-xs text-red-700 whitespace-pre-wrap">
                      {this.state.error?.toString()}
                    </pre>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = 'tel:0'}
                    className="w-full"
                  >
                    Call Front Desk
                  </Button>
                </div>
                
                <div className="mt-4 text-xs text-muted-foreground">
                  Error ID: {Date.now().toString(36)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}