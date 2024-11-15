'use client';

import React from 'react';
import { Button, Link, Card, CardBody, Progress } from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isReloading: boolean;
}

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isReloading: false
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to your error tracking service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call onError prop if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReload = () => {
    this.setState({ isReloading: true });
    
    // Simulate a delay to show loading state
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null,
        errorInfo: null,
        isReloading: false 
      });
      window.location.reload();
    }, 1000);
  };

  handleReport = () => {
    // Implement error reporting logic
    const errorReport = {
      error: this.state.error?.toString(),
      errorInfo: this.state.errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    console.log('Error report:', errorReport);
    // Send to your error reporting service
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={cn(
          "min-h-[50vh] flex items-center justify-center p-4",
          this.props.className
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <Card className="bg-background/60 backdrop-blur-xl backdrop-saturate-150">
                <CardBody className="gap-6 text-center p-6">
                  {/* Error Icon */}
                  <div className="mx-auto w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
                    <Icon 
                      icon="solar:danger-triangle-bold" 
                      className="text-3xl text-danger"
                    />
                  </div>

                  {/* Error Message */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground">
                      Something Went Wrong
                    </h2>
                    <p className="text-sm text-default-500">
                      {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      color="primary"
                      onPress={this.handleReload}
                      isLoading={this.state.isReloading}
                      className="w-full"
                      startContent={!this.state.isReloading && (
                        <Icon icon="solar:refresh-circle-bold" />
                      )}
                    >
                      {this.state.isReloading ? 'Reloading...' : 'Try Again'}
                    </Button>
                    <Button
                      variant="flat"
                      onPress={this.handleReport}
                      className="w-full"
                      startContent={<Icon icon="solar:flag-bold" />}
                    >
                      Report Issue
                    </Button>
                  </div>

                  {/* Technical Details (Collapsible) */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-left">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-default-500 hover:text-primary transition-colors">
                          Technical Details
                        </summary>
                        <pre className="mt-2 p-4 bg-default-50 rounded-lg overflow-auto text-default-700">
                          {this.state.error?.stack}
                          {'\n\nComponent Stack:\n'}
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </details>
                    </div>
                  )}

                  {/* Help Links */}
                  <div className="flex justify-center gap-6 text-sm text-default-500">
                    <Link href="/support" className="hover:text-primary">
                      Get Help
                    </Link>
                    <Link href="/" className="hover:text-primary">
                      Go Home
                    </Link>
                  </div>

                  {this.state.isReloading && (
                    <Progress
                      size="sm"
                      isIndeterminate
                      aria-label="Reloading..."
                      className="max-w-md"
                    />
                  )}
                </CardBody>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }

    return this.props.children;
  }
}
