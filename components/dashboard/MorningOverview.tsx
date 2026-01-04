import { useState, useEffect } from "react";

interface Props {
  dailyLogs: any[];
  userProfile: any;
  currentDate: string;
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

export default function MorningOverview({ dailyLogs, userProfile, currentDate }: Props) {
  const [todaysLog, setTodaysLog] = useState<any>(null);
  const [yesterdayChange, setYesterdayChange] = useState(0);
  const [weekChange, setWeekChange] = useState(0);
  const [greatMetrics, setGreatMetrics] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [needsAttentionMetrics, setNeedsAttentionMetrics] = useState<Array<{name: string, value: number, color: string}>>([]);

  useEffect(() => {
    loadLogData();
  }, [currentDate, dailyLogs]);

  const loadLogData = () => {
    // Find today's log from dailyLogs prop (NOT sessionStorage)
    const todayLog = dailyLogs.find((log: any) => log.date === currentDate);
    if (!todayLog) return;
    
    setTodaysLog(todayLog);
    
    // Calculate yesterday change using dailyLogs prop
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
    
    // Calculate week change (average of previous 6 days) using dailyLogs prop
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
    
    // Process metrics for "Great" section
    const metrics = [
      { name: 'Sleep', value: todayLog.sleep_morning },
      { name: 'Energy', value: todayLog.energy_morning },
      { name: 'Stress', value: todayLog.stress_morning },
      { name: 'Hydration', value: todayLog.hydration_morning },
      { name: 'Nutrition', value: todayLog.nutrition_morning },
      { name: 'Quads', value: todayLog.quad_morning },
      { name: 'Hamstrings', value: todayLog.hamstring_morning },
      { name: 'Hips', value: todayLog.hip_morning },
      { name: 'Calves', value: todayLog.calf_morning },
      { name: 'Shins', value: todayLog.shin_morning }
    ];
    
    // Filter and sort for "Great" (scores 4-5)
    const greatOnes = metrics
      .filter(m => m.value !== null && m.value >= 4)
      .sort((a, b) => b.value - a.value)
      .map(m => ({ ...m, color: getColorForScore(m.value) }));
    
    // Take up to 4, but if 3 have same value as first, don't add a fourth
    const finalGreat = [];
    for (let i = 0; i < Math.min(4, greatOnes.length); i++) {
      if (i < 3 || greatOnes[i].value === greatOnes[0].value) {
        finalGreat.push(greatOnes[i]);
      }
    }
    setGreatMetrics(finalGreat);
    
    // Filter and sort for "Needs Attention" (scores 1-2)
    const needsAttention = metrics
      .filter(m => m.value !== null && m.value <= 2)
      .sort((a, b) => a.value - b.value)
      .map(m => ({ ...m, color: getColorForScore(m.value) }));
    
    // Take up to 4, same rules as great
    const finalNeeds = [];
    for (let i = 0; i < Math.min(4, needsAttention.length); i++) {
      if (i < 3 || needsAttention[i].value === needsAttention[0].value) {
        finalNeeds.push(needsAttention[i]);
      }
    }
    setNeedsAttentionMetrics(finalNeeds);
  };

  if (!todaysLog) {
    return <div className="loading"></div>;
  }

  return (
    <div className="morning-overview main-container">
      <div className="main-heading">
        <h1>Morning Overview</h1>
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
      
      {greatMetrics.length > 0 && (
        <div className="metrics-section">
          <h2>Great</h2>
          <div className="metrics-grid">
            {greatMetrics.map((metric, idx) => (
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
      
      <div className="action-buttons">
        <button className="secondary-button">Edit Log</button>
        <button className="primary-button">View Log</button>
      </div>
    </div>
  );
}