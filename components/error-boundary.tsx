'use client';

import { AlertTriangle } from 'lucide-react';
import { Component, ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            We're sorry for the inconvenience. Please try refreshing the page.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              aria-label="Refresh the page to try again"
            >
              Refresh Page
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              aria-label="Go back to the previous page"
            >
              Go Back
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-8 p-4 bg-muted rounded-lg text-sm overflow-auto max-w-2xl">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
