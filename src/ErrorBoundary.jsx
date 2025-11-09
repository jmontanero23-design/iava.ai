import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App render error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen p-6">
          <div className="card p-4">
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-slate-300">The app failed to render. Please hard refresh and try again.</p>
            <pre className="mt-3 text-xs text-slate-400 overflow-auto">
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

