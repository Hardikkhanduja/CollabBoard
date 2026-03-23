import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fafafa',
            fontFamily: 'Geist Sans, sans-serif',
            gap: '16px',
          }}
        >
          <p style={{ color: '#f87171', fontSize: '15px', fontWeight: 500 }}>
            Something went wrong
          </p>
          <p style={{ color: '#71717a', fontSize: '13px', maxWidth: '360px', textAlign: 'center' }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              background: '#6ee7b7',
              color: '#0a0a0a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
