import React from 'react';
import { Button } from '@nextui-org/react';
import { LocationError } from '@/utils/location-error-handling';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: LocationError | null;
}

export class LocationErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error:
        error instanceof LocationError
          ? error
          : new LocationError(error.message, 'UNKNOWN_ERROR')
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LocationErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Location Error
          </h3>
          <p className="text-red-600 mb-4">{this.state.error?.message}</p>
          <Button
            color="primary"
            onPress={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
