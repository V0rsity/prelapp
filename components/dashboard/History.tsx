import { useState, useMemo } from "react";
import { READINESS_METRIC_CONFIG, TRAINING_METRIC_CONFIG, RECOVERY_METRIC_CONFIG, getSorenessMetricsShortView } from "@/config/metrics";
import ViewLogModal from "./ViewLogModal";
import ViewTrainingModal from "./ViewTrainingModal";
import ViewRecoveryModal from "./ViewRecoveryModal";

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
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${dayNames[date.getDay()]}, ${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
}

function formatDateShort(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
}

function getAvailableReadinessMetrics() {
  return Object.entries(READINESS_METRIC_CONFIG).map(([key, config]) => ({
    key,
    label: config.shortLabel,
  }));
}

function getAvailableSorenessMetrics(log: any) {
  const sorenessMetrics = getSorenessMetricsShortView();
  return sorenessMetrics.filter(({ key }) => {
    const value = log[`${key}_morning`];
    return value !== null && value !== undefined;
  });
}

function getIntensityInfo(intensityValue: number) {
  const option = TRAINING_METRIC_CONFIG.intensity.options[intensityValue as keyof typeof TRAINING_METRIC_CONFIG.intensity.options];
  if (!option) return { label: "Unknown", color: "#888" };
  return { label: option.label, color: option.color };
}

function getTrainingTypesDisplay(types: string[]) {
  if (!types || types.length === 0) return "";
  const labels = types.map(t => {
    const option = TRAINING_METRIC_CONFIG.types.options[t as keyof typeof TRAINING_METRIC_CONFIG.types.options];
    return option ? option.label : t;
  });
  const display = labels.join(", ");
  return display.length > 25 ? display.substring(0, 25).trimEnd() + "..." : display;
}

function getRecoveryActivitiesDisplay(activities: string[]) {
  if (!activities || activities.length === 0) return { display: "", count: 0 };
  const labels = activities.map(a => {
    const option = RECOVERY_METRIC_CONFIG.activities.options[a as keyof typeof RECOVERY_METRIC_CONFIG.activities.options];
    return option ? option.label : a;
  });
  const display = labels.join(", ");
  // Truncate if too long
  const truncated = display.length > 23 ? display.substring(0, 23).trimEnd() + "..." : display;
  return { display: truncated, count: activities.length };
}

export default function History({ dailyLogs, userProfile }: Props) {
  const readinessMetrics = getAvailableReadinessMetrics();
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedTrainingLog, setSelectedTrainingLog] = useState<any>(null);
  const [selectedRecoveryLog, setSelectedRecoveryLog] = useState<any>(null);

  return (
    <div className="history-section">
      <div className="main-heading main-container">
        <h1>History</h1>
        <h3>View your past logs!</h3>
      </div>

      {dailyLogs.length === 0 ? (
        <p>No logs yet.</p>
      ) : (
        dailyLogs.filter((log) => log.morning_complete || log.training_complete || log.recovery_complete).map((log) => {
          const intensityInfo = log.training_complete ? getIntensityInfo(log.training_intensity) : null;
          const trainingTypes = log.training_complete ? getTrainingTypesDisplay(log.training_types) : "";
          const recoveryInfo = log.recovery_complete ? getRecoveryActivitiesDisplay(log.recovery_activities) : null;

          return (
            <div key={log.id} className="main-container history-log history-log-meta">
              <div className="main-heading">
                <h1>{formatDate(log.date)}</h1>
              </div>

              {log.morning_complete && (
                <button
                  className="history-card"
                  onClick={() => setSelectedLog(log)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="history-card-left">
                    <span className="history-card-title">Readiness</span>
                    <span className="history-card-subtitle">Readiness Score</span>
                  </div>
                  <div className="readiness-badge" data-readiness={getReadinessLevel(log.readiness_score)}>
                    <span className="readiness-score">{log.readiness_score}</span>
                  </div>
                </button>
              )}

              {log.training_complete && intensityInfo && (
                <button className="history-card" onClick={() => setSelectedTrainingLog(log)} style={{ cursor: "pointer" }}>
                  <div className="history-card-left">
                    <span className="history-card-title">Training</span>
                    <span className="history-card-subtitle">{trainingTypes}</span>
                  </div>
                  <div className="history-card-right">
                    <span className="history-intensity-dot" style={{ backgroundColor: intensityInfo.color }}></span>
                    <span className="history-card-meta">{intensityInfo.label}</span>
                  </div>
                </button>
              )}

              {log.recovery_complete && recoveryInfo && (
                <button className="history-card" onClick={() => setSelectedRecoveryLog(log)} style={{ cursor: "pointer" }}>
                  <div className="history-card-left">
                    <span className="history-card-title">Recovery</span>
                    <span className="history-card-subtitle">{recoveryInfo.display}</span>
                  </div>
                  <div className="history-card-right">
                    <span className="history-card-count">{recoveryInfo.count}</span>
                    <span className="history-card-meta">{recoveryInfo.count === 1 ? "Activity" : "Activities"}</span>
                  </div>
                </button>
              )}
            </div>
          );
        })
      )}
      {dailyLogs.length >= 30 && (
        <p>30 day cap reached.</p>
      )}

      <ViewLogModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
        formatDate={formatDateShort}
        getReadinessLevel={getReadinessLevel}
        getColorForScore={getColorForScore}
        availableReadinessMetrics={readinessMetrics}
        availableSorenessMetrics={selectedLog ? getAvailableSorenessMetrics(selectedLog) : []}
      />

      <ViewTrainingModal
        isOpen={!!selectedTrainingLog}
        onClose={() => setSelectedTrainingLog(null)}
        log={selectedTrainingLog}
        formatDate={formatDateShort}
        userProfile={userProfile}
      />

      <ViewRecoveryModal
        isOpen={!!selectedRecoveryLog}
        onClose={() => setSelectedRecoveryLog(null)}
        log={selectedRecoveryLog}
        formatDate={formatDateShort}
        userProfile={userProfile}
      />
    </div>
  );
}
