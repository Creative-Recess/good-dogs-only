// If something goes badly wrong (most likely the phone blocking storage, e.g. in a private Safari tab), show a plain
// message instead of a blank screen.
import { Component, type ReactNode } from 'react'

export class ErrorScreen extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="error-screen" role="alert">
        <b>Good Dogs Only can't open.</b>
        <p>It needs to save your spots on this phone. If you're in a private Safari tab, open it in a normal tab or from the Home Screen icon.</p>
        <button type="button" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    )
  }
}
