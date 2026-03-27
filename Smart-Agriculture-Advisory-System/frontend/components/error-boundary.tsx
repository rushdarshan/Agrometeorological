'use client'

import { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught:', error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-full max-w-md mx-auto p-6">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>

              <h2 className="text-2xl font-bold text-center mb-2">
                Something went wrong
              </h2>

              <p className="text-center text-muted-foreground mb-4">
                We encountered an unexpected error. Please try again.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
                  <p className="text-sm font-mono text-red-700 dark:text-red-400 break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <button
                onClick={this.resetError}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
