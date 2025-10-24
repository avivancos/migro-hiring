import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-lg border-2 border-red-200">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="bg-red-100 p-6 rounded-full">
                    <AlertTriangle className="text-red-600" size={64} />
                  </div>
                </div>
                <CardTitle className="text-3xl text-emphasis-900">
                  ¡Oops! Algo salió mal
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <p className="text-lg text-gray-700">
                  Lo sentimos, ha ocurrido un error inesperado.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Nuestro equipo ha sido notificado y estamos trabajando en solucionarlo.
                </p>
              </div>

              {/* Detalles del error (solo en desarrollo) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    Detalles del error (solo en desarrollo):
                  </h3>
                  <pre className="text-xs text-red-600 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        {'\n\n'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4">
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2" size={18} />
                  Recargar Página
                </Button>
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-primary hover:bg-primary-700 text-white"
                >
                  <Home className="mr-2" size={18} />
                  Volver al Inicio
                </Button>
              </div>

              {/* Información de soporte */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800">
                  Si el problema persiste, contacta con nuestro soporte:
                  <br />
                  <a
                    href="mailto:soporte@migro.es"
                    className="font-semibold text-primary hover:underline"
                  >
                    soporte@migro.es
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

