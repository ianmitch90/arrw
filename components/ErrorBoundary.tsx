'use client';
import { Component, ReactNode } from 'react';
import { Button } from '@nextui-org/react';
import { toast } from '@/components/ui/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
    toast({
      variant: 'error',
      description: 'Something went wrong. Please try again.'
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
            <p className="text-danger mb-4">Something went wrong</p>
            <Button color="danger" variant="flat" onClick={this.handleRetry}>
              Try Again
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
