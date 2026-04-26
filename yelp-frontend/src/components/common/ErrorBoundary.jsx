import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected UI error' }
  }

  componentDidCatch(error, errorInfo) {
    // Keep runtime details in console for debugging.
    console.error('UI crash caught by ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-lg w-full text-center bg-white border border-surface-100 rounded-2xl p-8">
            <p className="text-4xl mb-3">⚠️</p>
            <h2 className="font-display text-2xl font-bold text-surface-900 mb-2">
              Something went wrong on this page
            </h2>
            <p className="text-sm text-surface-200 mb-4">
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

