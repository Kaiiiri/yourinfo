/**
 * YourInfo - Privacy Awareness Globe
 * Main application component
 */

import { useState, useCallback } from 'react';
import { Globe } from './components/Globe';
import { InfoPanel } from './components/InfoPanel';
import { useWebSocket } from './hooks/useWebSocket';
import type { VisitorInfo } from './types';
import './App.css';

export default function App() {
  const { connected, visitors, currentVisitor, aiLoading, totalUniqueVisitors } = useWebSocket();
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorInfo | null>(null);

  const handleVisitorClick = useCallback((visitor: VisitorInfo) => {
    // If clicking the same visitor, close the popup
    if (selectedVisitor?.id === visitor.id) {
      setSelectedVisitor(null);
    } else {
      setSelectedVisitor(visitor);
    }
  }, [selectedVisitor]);

  const handleCloseSelected = useCallback(() => {
    setSelectedVisitor(null);
  }, []);

  // Determine which visitor to show in the panel
  const displayedVisitor = selectedVisitor || currentVisitor;
  const isDisplayingCurrentUser = displayedVisitor?.id === currentVisitor?.id;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">!?</span>
          <h1>Your Info</h1>
        </div>
        <div className="app-stats">
          <div className="stat">
            <span className="stat-value">{visitors.length}</span>
            <span className="stat-label">Online</span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalUniqueVisitors.toLocaleString()}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot" />
            {connected ? 'Live' : 'Connecting...'}
          </div>
        </div>
      </header>

      {/* Globe */}
      <div className="globe-container">
        <Globe
          visitors={visitors}
          currentVisitorId={currentVisitor?.id || null}
          onVisitorClick={handleVisitorClick}
        />
      </div>

      {/* Info Panel */}
      <InfoPanel
        visitor={displayedVisitor}
        isCurrentUser={isDisplayingCurrentUser ?? true}
        onClose={selectedVisitor ? handleCloseSelected : undefined}
        aiLoading={aiLoading && isDisplayingCurrentUser}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>
          This site demonstrates what information websites can collect about you.
          <a href="https://github.com/hsingh/yourinfo" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
