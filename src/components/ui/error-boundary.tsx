import React from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We're sorry, but an unexpected error has occurred.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Error details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} className="flex-1">
              Try again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
              Reload page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ErrorBoundary component for app level
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app so the error doesn't happen again
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ErrorBoundary component for page level
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset page state
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Component boundary with specific error handling
export function ComponentErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Component error</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {error.message}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={resetErrorBoundary}
            className="mt-2 h-7"
          >
            Retry
          </Button>
        </div>
      )}
      onReset={() => {}}
    >
      {children}
    </ErrorBoundary>
  );
}