/**
 * Grid Intelligence Error Boundary
 * Prevents crashes from propagating and provides user-friendly error handling
 */

'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class GridIntelligenceErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Grid Intelligence Error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Analytics.track('grid_intelligence_error', { 
      //   error: error.message, 
      //   stack: error.stack,
      //   componentStack: errorInfo.componentStack 
      // });
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Grid Analysis Error</h3>
          <p className="text-sm text-[#a1a1aa] mb-4">
            An error occurred while processing grid intelligence data. 
            This component has been temporarily disabled to prevent further issues.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Try Again
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mt-4">
                <summary className="text-xs text-[#71717a] cursor-pointer hover:text-[#a1a1aa]">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-2 bg-[#0a0a0b] border border-[#27272a] rounded text-xs text-[#fafafa] font-mono overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error?.message}
                  </div>
                  {this.state.error?.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC wrapper for easy error boundary usage
 */
export function withGridErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const WrappedComponent = (props: P) => (
    <GridIntelligenceErrorBoundary fallback={fallback}>
      <Component {...props} />
    </GridIntelligenceErrorBoundary>
  );

  WrappedComponent.displayName = `withGridErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for handling errors within components
 */
export function useGridErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Grid Intelligence Error:', error);
    setError(error);

    // Send to error tracking in production
    if (process.env.NODE_ENV === 'production') {
      // Analytics.track('grid_intelligence_error', { 
      //   error: error.message, 
      //   stack: error.stack 
      // });
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null
  };
}

export default GridIntelligenceErrorBoundary;