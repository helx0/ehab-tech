import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('EHAB TECH runtime error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary__card">
            <span className="error-boundary__code">500</span>
            <h1>Something went wrong.</h1>
            <p>The page could not be displayed. Please reload or return to the homepage.</p>
            <div className="error-boundary__actions">
              <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
                Reload page
              </button>
              <a className="btn btn--ghost" href="/">Go home</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
