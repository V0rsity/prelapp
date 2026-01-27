import { useState, useEffect, useMemo } from "react";
import EditLogModal from './EditLogModal';
import { READINESS_METRIC_CONFIG, getSorenessMetricsShortView } from "@/config/metrics";
import { SquarePen, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  dailyLogs: any[];
  userProfile: any;
  currentDate: string;
  refreshUserData?: () => void;
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

export default function MorningOverview({ dailyLogs, userProfile, currentDate, refreshUserData }: Props) {
  const [todaysLog, setTodaysLog] = useState<any>(null);
  const [yesterdayChange, setYesterdayChange] = useState(0);
  const [weekChange, setWeekChange] = useState(0);
  const [needsAttentionMetrics, setNeedsAttentionMetrics] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get available readiness metrics - dynamically from config (using shortLabel for consistency)
  const availableReadinessMetrics = useMemo(() => {
    return Object.entries(READINESS_METRIC_CONFIG).map(([key, config]) => ({
      key,
      label: config.shortLabel,
    }));
  }, []);

  // Determine which soreness metrics are available in the log - dynamically from config
  const availableSorenessMetrics = useMemo(() => {
    if (!todaysLog) return [];
    
    const sorenessMetrics = getSorenessMetricsShortView();
    
    // Filter to only include metrics that exist in the log (not null/undefined)
    return sorenessMetrics.filter(({ key }) => {
      const value = todaysLog[`${key}_morning`];
      return value !== null && value !== undefined;
    });
  }, [todaysLog]);

  const totalMetrics = useMemo(() => {
    return availableReadinessMetrics.length + availableSorenessMetrics.length;
  }, [availableReadinessMetrics, availableSorenessMetrics]);

  useEffect(() => {
    loadLogData();
  }, [currentDate, dailyLogs]);

  const loadLogData = () => {
    // Find today's log from dailyLogs prop
    const todayLog = dailyLogs.find((log: any) => log.date === currentDate);
    if (!todayLog) return;
    
    setTodaysLog(todayLog);
    
    // Calculate yesterday change
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayLog = dailyLogs.find((log: any) => log.date === yesterdayDate);
    
    if (yesterdayLog && yesterdayLog.readiness_score && todayLog.readiness_score) {
      const change = Math.round(((todayLog.readiness_score - yesterdayLog.readiness_score) / yesterdayLog.readiness_score) * 100);
      setYesterdayChange(change);
    } else {
      setYesterdayChange(0);
    }
    
    // Calculate week change (average of previous 6 days)
    const weekAgo = new Date(currentDate);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoDate = weekAgo.toISOString().split('T')[0];
    
    const previousWeekLogs = dailyLogs.filter((log: any) => {
      return log.date >= weekAgoDate && log.date < currentDate && log.readiness_score;
    });
    
    if (previousWeekLogs.length > 0 && todayLog.readiness_score) {
      const avgPreviousWeek = previousWeekLogs.reduce((sum: number, log: any) => sum + log.readiness_score, 0) / previousWeekLogs.length;
      const change = Math.round(((todayLog.readiness_score - avgPreviousWeek) / avgPreviousWeek) * 100);
      setWeekChange(change);
    } else {
      setWeekChange(0);
    }
    
    // Build metrics array dynamically from config
    const metrics: Array<{name: string, value: number}> = [];
    
    // Add readiness metrics dynamically from config (using shortLabel for "Needs Attention")
    Object.entries(READINESS_METRIC_CONFIG).forEach(([key, config]) => {
      const value = todayLog[`${key}_morning`];
      if (value !== null && value !== undefined) {
        metrics.push({ name: config.shortLabel, value });
      }
    });
    
    // Add soreness metrics dynamically from config - only if they exist in the log
    const sorenessMetricsShort = getSorenessMetricsShortView();
    sorenessMetricsShort.forEach(({ key, label }) => {
      const value = todayLog[`${key}_morning`];
      if (value !== null && value !== undefined) {
        metrics.push({ name: label, value });
      }
    });
    
    // Filter and sort for "Needs Attention" (scores 1-2)
    const needsAttention = metrics
      .filter(m => m.value !== null && m.value <= 2)
      .sort((a, b) => a.value - b.value)
      .map(m => ({ ...m, color: getColorForScore(m.value) }));
    
    setNeedsAttentionMetrics(needsAttention);
  };

  if (!todaysLog) {
    return <div className="loading"></div>;
  }

  // Collapsed view
  if (!isExpanded) {
    return (
      <div className="morning-overview main-container">
        <div className="main-heading">
          <div className="readiness-header">
            <h1>Today's Readiness</h1>
            <button className="edit-icon-overlay" onClick={() => setIsEditModalOpen(true)}>
              <SquarePen size={24} className="edit-icon" />
            </button>
          </div>
          <h3>Based on how you feel!</h3>
        </div>
        
        <div className="readiness-score-card">
          <h2 className="readiness-heading">Readiness Score</h2>
          
          <div className="score-display" data-readiness={getReadinessLevel(todaysLog.readiness_score || 0)}>
            <div className="readiness-score">
              {todaysLog.readiness_score || 0}
            </div>
            
            <div className="score-changes">
              <div className="change-item">
                <div className="change-item-top">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{transform: yesterdayChange >= 0 ? 'rotate(0deg)' : 'rotate(180deg)'}}>
                    <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="change-value">{Math.abs(yesterdayChange)}%</span>
                </div>
                <span className="change-label">Yesterday</span>
              </div>
              
              <div className="change-item">
                <div className="change-item-top">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{transform: weekChange >= 0 ? 'rotate(0deg)' : 'rotate(180deg)'}}>
                    <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="change-value">{Math.abs(weekChange)}%</span>
                </div>
                <span className="change-label">Week</span>
              </div>
            </div>
          </div>
          
          <p className="readiness-message">
            {todaysLog.readiness_score >= 80 ? 'You are prepared for the day!' : 
              todaysLog.readiness_score >= 60 ? 'You are moderately ready.' : 
              'Take it easy today.'}
          </p>
        </div>
        
        {needsAttentionMetrics.length > 0 && (
          <div className="metrics-section">
            <h2>Needs Attention</h2>
            <div className="metrics-grid">
              {needsAttentionMetrics.map((metric, idx) => (
                <div key={idx} className="metric-item">
                  <span 
                    className="metric-dot" 
                    style={{backgroundColor: `var(--color-${metric.color})`}}
                  ></span>
                  <span className="metric-label">{metric.name} {metric.value}/5</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Button */}
        <button className="view-button" onClick={() => setIsExpanded(true)}>
          <ChevronDown size={24} />
          View Readiness Log
          <ChevronDown size={24} />
        </button>

        <EditLogModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          log={todaysLog}
          userProfile={userProfile}
          onSave={() => {
            if (refreshUserData) {
              refreshUserData();
            }
          }}
        />
      </div>
    );
  }

  // Expanded view
  return (
    <div className="morning-overview main-container">
      <div className="main-heading">
        <div className="readiness-header">
          <h1>Today's Readiness</h1>
          <button className="edit-icon-overlay" onClick={() => setIsEditModalOpen(true)}>
            <SquarePen size={24} className="edit-icon" />
          </button>
        </div>
        <h3>Based on how you feel!</h3>
      </div>
      
      <div className="readiness-score-card">
        <h2 className="readiness-heading">Readiness Score</h2>
        
        <div className="score-display" data-readiness={getReadinessLevel(todaysLog.readiness_score || 0)}>
          <div className="readiness-score">
            {todaysLog.readiness_score || 0}
          </div>
          
          <div className="score-changes">
            <div className="change-item">
              <div className="change-item-top">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{transform: yesterdayChange >= 0 ? 'rotate(0deg)' : 'rotate(180deg)'}}>
                  <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="change-value">{Math.abs(yesterdayChange)}%</span>
              </div>
              <span className="change-label">Yesterday</span>
            </div>
            
            <div className="change-item">
              <div className="change-item-top">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{transform: weekChange >= 0 ? 'rotate(0deg)' : 'rotate(180deg)'}}>
                  <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="change-value">{Math.abs(weekChange)}%</span>
              </div>
              <span className="change-label">Week</span>
            </div>
          </div>
        </div>
        
        <p className="readiness-message">
          {todaysLog.readiness_score >= 80 ? 'You are prepared for the day!' : 
            todaysLog.readiness_score >= 60 ? 'You are moderately ready.' : 
            'Take it easy today.'}
        </p>
      </div>
      
      {needsAttentionMetrics.length > 0 && (
        <div className="metrics-section">
          <h2>Needs Attention</h2>
          <div className="metrics-grid">
            {needsAttentionMetrics.map((metric, idx) => (
              <div key={idx} className="metric-item">
                <span 
                  className="metric-dot" 
                  style={{backgroundColor: `var(--color-${metric.color})`}}
                ></span>
                <span className="metric-label">{metric.name} {metric.value}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Log Details */}
      <div className="metrics-section">
          <h2>Full Log</h2>
      </div>
      <div className="log-card">
        <div className="grid-container history-log">
          <div className="metrics-grid" style={{ "--rows": Math.ceil(totalMetrics / 2) } as React.CSSProperties}>
            {/* Readiness metrics - dynamically from config */}
            {availableReadinessMetrics.map(({ key, label }) => (
              <div key={key} className="metric-item">
                <span className="metric-dot" style={{ backgroundColor: `var(--color-${getColorForScore(todaysLog[`${key}_morning`])})` }}></span>
                <span className="metric-label">{label} {todaysLog[`${key}_morning`]}/5</span>
              </div>
            ))}
            
            {/* Soreness metrics - dynamically from config */}
            {availableSorenessMetrics.map(({ key, label }) => (
              <div key={key} className="metric-item">
                <span className="metric-dot" style={{ backgroundColor: `var(--color-${getColorForScore(todaysLog[`${key}_morning`])})` }}></span>
                <span className="metric-label">{label} {todaysLog[`${key}_morning`]}/5</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {todaysLog.notes_morning && (
        <div>
          <h3 className="training-overview-subheading">Notes</h3>
          <p className="notes-text">{todaysLog.notes_morning}</p>
        </div>
      )}

      {/* Hide Button */}
      <button className="view-button" onClick={() => setIsExpanded(false)}>
        <ChevronUp size={24} />
        Hide Readiness Log
        <ChevronUp size={24} />
      </button>

      <EditLogModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        log={todaysLog}
        userProfile={userProfile}
        onSave={() => {
          if (refreshUserData) {
            refreshUserData();
          }
        }}
      />
    </div>
  );
}