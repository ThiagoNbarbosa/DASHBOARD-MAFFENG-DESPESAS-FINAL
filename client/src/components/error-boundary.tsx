import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';
import { useLocation } from 'wouter';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for mobile debugging
    const isMobile = window.innerWidth < 768;
    
    console.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      isMobile,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });

    // For mobile devices, try to preserve navigation state
    if (isMobile && 'sessionStorage' in window) {
      try {
        sessionStorage.setItem('lastError', JSON.stringify({
          message: error.message,
          stack: error.stack,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('Failed to save error to session storage:', e);
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-orange-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Oops! Algo deu errado
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ocorreu um erro inesperado. Você pode tentar novamente ou voltar à página inicial.
        </p>

        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={retry}
            className="flex items-center gap-2"
            variant="default"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
          
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Ir para Início
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;