import React from 'react';

interface ViewLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  formatDate: (date: string) => string;
  getReadinessLevel: (readiness: number) => string;
  getColorForScore: (score: number) => string;
  availableReadinessMetrics: Array<{key: string, label: string}>;
  availableSorenessMetrics: Array<{key: string, label: string}>;
}

export default function ViewLogModal({ 
  isOpen, 
  onClose, 
  log, 
  formatDate, 
  getReadinessLevel, 
  getColorForScore, 
  availableReadinessMetrics, 
  availableSorenessMetrics 
}: ViewLogModalProps) {
  if (!isOpen || !log) return null;

  const totalMetrics = availableReadinessMetrics.length + availableSorenessMetrics.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <div className="main-container history-log">
          <div className="main-heading">
            <h1>{formatDate(log.date)}</h1>
            <div className="readiness-badge modal" data-readiness={getReadinessLevel(log.readiness_score)}>
              <span className="readiness-label">Morning Readiness</span>
              <span className="readiness-score">{log.readiness_score}</span>
            </div>
          </div>
          
          <div className="log-card">
            <div className="grid-container">
              <div className="metrics-grid" style={{ "--rows": Math.ceil(totalMetrics / 2) } as React.CSSProperties}>
                {/* Readiness metrics - dynamically from config */}
                {availableReadinessMetrics.map(({ key, label }) => (
                  <div key={key} className="metric-item">
                    <span className="metric-dot" style={{ backgroundColor: `var(--color-${getColorForScore(log[`${key}_morning`])})` }}></span>
                    <span className="metric-label">{label} {log[`${key}_morning`]}/5</span>
                  </div>
                ))}
                
                {/* Soreness metrics - dynamically from config */}
                {availableSorenessMetrics.map(({ key, label }) => (
                  <div key={key} className="metric-item">
                    <span className="metric-dot" style={{ backgroundColor: `var(--color-${getColorForScore(log[`${key}_morning`])})` }}></span>
                    <span className="metric-label">{label} {log[`${key}_morning`]}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {log.notes_morning && (
            <div className="log-notes">
              <span className="notes-label">Notes:</span> {log.notes_morning}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}