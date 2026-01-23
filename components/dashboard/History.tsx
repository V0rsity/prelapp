import { useMemo } from "react";
import { READINESS_METRIC_CONFIG, getSorenessMetricsShortView } from "@/config/metrics";

interface Props {
  dailyLogs: any[];
  userProfile: any;
}

function getColorForScore(score: number): string {
  if (score === 1) return 'red';
  if (score === 2) return 'orange';
  if (score === 3) return 'yellow';
  if (score === 4) return 'light-green';
  return 'green';
}

function getReadinessLevel(readiness: number): string {
  if (readiness >= 90) return 'green';
  if (readiness >= 80) return 'light-green';
  if (readiness >= 70) return 'yellow';
  if (readiness >= 60) return 'orange';
  return 'red';
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
}

// Get available readiness metrics - dynamically from config
function getAvailableReadinessMetrics() {
  return Object.entries(READINESS_METRIC_CONFIG).map(([key, config]) => ({
    key,
    label: config.shortLabel,
  }));
}

// Get available soreness metrics for a specific log - dynamically from config
function getAvailableSorenessMetrics(log: any) {
  const sorenessMetrics = getSorenessMetricsShortView();
  
  return sorenessMetrics.filter(({ key }) => {
    const value = log[`${key}_morning`];
    return value !== null && value !== undefined;
  });
}

export default function History({ dailyLogs, userProfile }: Props) {
  const readinessMetrics = getAvailableReadinessMetrics();

  return (
    <div className="history-section">
      <div className="main-heading main-container">
        <h1>History</h1>
        <h3>View your past logs!</h3>
      </div>

      {dailyLogs.length === 0 ? (
        <p>No logs yet.</p>
      ) : (
        dailyLogs.map((log) => {
          const availableSorenessMetrics = getAvailableSorenessMetrics(log);
          const totalMetrics = readinessMetrics.length + availableSorenessMetrics.length;
          
          return (
            <div key={log.id} className="main-container history-log">
              <div className="main-heading">
                <h1>{formatDate(log.date)}</h1>
                <div className="readiness-badge" data-readiness={getReadinessLevel(log.readiness_score)}>
                    <span className="readiness-label">Morning Readiness</span>
                    <span className="readiness-score">{log.readiness_score}</span>
                </div>
              </div>
              
              <div className="log-card">
                <div className="grid-container">
                  <div className="metrics-grid" style={{ "--rows": Math.ceil(totalMetrics / 2) } as React.CSSProperties}>
                    {/* Readiness metrics - dynamically from config */}
                    {readinessMetrics.map(({ key, label }) => (
                      <div key={key} className="metric-item">
                        <span
                          className="metric-dot"
                          style={{ backgroundColor: `var(--color-${getColorForScore(log[`${key}_morning`])})` }}
                        ></span>
                        <span className="metric-label">{label} {log[`${key}_morning`]}/5</span>
                      </div>
                    ))}

                    {/* Soreness metrics (conditionally shown) - dynamically from config */}
                    {availableSorenessMetrics.map(({ key, label }) => (
                      <div key={key} className="metric-item">
                        <span
                          className="metric-dot"
                          style={{ backgroundColor: `var(--color-${getColorForScore(log[`${key}_morning`])})` }}
                        ></span>
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
          );
        })
      )}
      {dailyLogs.length >= 30 && (
        <p>30 day cap reached.</p>
      )}
    </div>
  );
}