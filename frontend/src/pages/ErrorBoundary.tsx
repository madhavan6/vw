import React, { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode | ReactNode[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { 
    hasError: false, 
    error: null 
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
          <h2 className="text-lg font-medium text-red-800">Something went wrong</h2>
          {this.state.error && (
            <p className="mt-2 text-sm text-red-700">
              {this.state.error.message || "An unknown error occurred"}
            </p>
          )}
        </div>
      );
    }

    // Wrap children in a fragment to handle multiple children
    return <>{this.props.children}</>;
  }
}