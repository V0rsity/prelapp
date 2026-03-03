import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell } from 'recharts';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { READINESS_METRIC_CONFIG, SORENESS_METRIC_CONFIG, TRAINING_METRIC_CONFIG, RECOVERY_METRIC_CONFIG } from '@/config/metrics';
import { DailyLog, UserProfile } from '@/types/models';

interface Props {
  dailyLogs: DailyLog[];
  userProfile: any;
  refreshUserData: () => void;
}

// Helper function to format date from YYYY-MM-DD
const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
};

// Helper function to get all dates in range
const getAllDatesInRange = (days: number) => {
  const dates = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
};

// Helper function to find earliest date with data
const findEarliestDataDate = (allDates: string[], logsByDate: Map<string, any>) => {
  for (let i = 0; i < allDates.length; i++) {
    if (logsByDate.has(allDates[i])) {
      return i;
    }
  }
  return 0;
};

// Helper function to get bar color based on value
const getBarColor = (value: number | null, isReadinessScore: boolean) => {
  if (value === null) return '#FFFFFF';
  
  if (isReadinessScore) {
    if (value < 60) return 'var(--color-red)';
    if (value < 70) return 'var(--color-orange)';
    if (value < 80) return 'var(--color-yellow)';
    if (value < 90) return 'var(--color-light-green)';
    return 'var(--color-green)';
  } else {
    if (value <= 1) return 'var(--color-red)';
    if (value <= 2) return 'var(--color-orange)';
    if (value <= 3) return 'var(--color-yellow)';
    if (value <= 4) return 'var(--color-light-green)';
    return 'var(--color-green)';
  }
};

// Helper function to get average bar color for legend
const getAverageBarColor = (data: any[], isReadinessScore: boolean) => {
  const validValues = data.filter(d => d.value !== null);
  if (validValues.length === 0) return '#FFFFFF';
  
  const avg = validValues.reduce((sum, d) => sum + d.value, 0) / validValues.length;
  return getBarColor(avg, isReadinessScore);
};

const HABIT_NO_DATA_COLOR = '#d1d5db';
const HABIT_DARK_COLOR = '#384959';

function getHabitCellColor(
  log: DailyLog | undefined,
  habitMetric: string,
  habitSubtype: string
): string | null {
  if (!log) return null;

  if (habitMetric === 'readiness_score')
    return log.readiness_score !== null ? getBarColor(log.readiness_score, true) : null;

  if (habitMetric.startsWith('readiness_')) {
    const field = habitMetric.slice('readiness_'.length);
    const v = log[field as keyof DailyLog] as number | null;
    return v !== null ? getBarColor(v, false) : null;
  }

  if (habitMetric.startsWith('soreness_')) {
    const field = habitMetric.slice('soreness_'.length);
    const v = log[field as keyof DailyLog] as number | null;
    return v !== null ? getBarColor(v, false) : null;
  }

  if (habitMetric === 'training_intensity') {
    const i = log.training_intensity;
    if (!i) return null;
    const opt = TRAINING_METRIC_CONFIG.intensity.options[i as 1 | 2 | 3 | 4 | 5];
    return opt?.color ?? null;
  }

  if (habitMetric.startsWith('training_type_')) {
    const typeKey = habitMetric.slice('training_type_'.length);
    if (!log.training_types?.includes(typeKey)) return null;
    if (typeKey === 'strength' && habitSubtype) {
      return log.training_muscles?.includes(habitSubtype) ? HABIT_DARK_COLOR : null;
    }
    const cfg = (TRAINING_METRIC_CONFIG.types.options as any)[typeKey];
    return cfg?.fillColor ?? HABIT_DARK_COLOR;
  }

  if (habitMetric.startsWith('recovery_activity_')) {
    const actKey = habitMetric.slice('recovery_activity_'.length);
    if (!log.recovery_activities?.includes(actKey)) return null;
    const cfg = (RECOVERY_METRIC_CONFIG.activities.options as any)[actKey];
    return cfg?.fillColor ?? HABIT_DARK_COLOR;
  }

  return null;
}

export default function Trends({ dailyLogs, userProfile }: Props) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [barTimeRange, setBarTimeRange] = useState<7 | 30>(7);
  const [barMetric, setBarMetric] = useState<string | null>('readiness_score');
  const [habitMetric, setHabitMetric] = useState<string>('readiness_score');
  const [habitSubtype, setHabitSubtype] = useState<string>('');
  const [hoveredCell, setHoveredCell] = useState<{ dateStr: string; x: number; y: number } | null>(null);
  // Clear the tooltip when the user scrolls on touch devices (iOS fires mouseenter on tap but
  // never fires mouseleave when scrolling, so the tooltip would otherwise stick in place).
  useEffect(() => {
    const clear = () => setHoveredCell(null);
    window.addEventListener('touchmove', clear, { passive: true });
    return () => window.removeEventListener('touchmove', clear);
  }, []);
  const [metric1, setMetric1] = useState<string | null>('readiness_score');
  const [metric2, setMetric2] = useState<string | null>('sleep_morning');

  // Get available metrics grouped by category
  const groupedMetrics = useMemo(() => {
    const readiness = [
      { value: 'readiness_score', label: 'Readiness Score' },
      ...Object.entries(READINESS_METRIC_CONFIG).map(([key, config]) => ({
        value: `${key}_morning`,
        label: config.label,
      })),
    ];

    const userEventTypes = userProfile?.event_types ?? [];

    const training = [
      { value: 'training_intensity', label: 'Training Intensity' },
      ...(TRAINING_METRIC_CONFIG.types.options.distance.eventTypes.some(et => userEventTypes.includes(et as string))
        ? [{ value: 'training_mileage', label: 'Distance (Miles)' }]
        : []),
    ];
    const soreness = Object.entries(SORENESS_METRIC_CONFIG)
      .filter(([, config]) => config.eventTypes.some(et => userEventTypes.includes(et as any)))
      .map(([key, config]) => ({ value: `${key}_morning`, label: config.label }));

    const groups: { label: string; options: { value: string; label: string }[] }[] = [
      { label: 'Readiness', options: readiness },
      { label: 'Training', options: training },
    ];
    if (soreness.length) groups.push({ label: 'Soreness', options: soreness });

    return groups;
  }, [userProfile?.event_types]);

  // Flat list for label lookups
  const availableMetrics = useMemo(
    () => groupedMetrics.flatMap(g => g.options),
    [groupedMetrics]
  );

  const logsByDate = useMemo(() =>
    new Map(dailyLogs.map(log => [log.date, log])),
  [dailyLogs]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const earliestLogDate = useMemo(() =>
    dailyLogs.length ? [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date))[0].date : null,
  [dailyLogs]);

  const maxMileage = useMemo(() => {
    let max = 0;
    for (const log of dailyLogs) {
      if (log.training_mileage != null && log.training_mileage > max) max = log.training_mileage;
    }
    return max > 0 ? max : 1;
  }, [dailyLogs]);

  const habitCalendarWeeks = useMemo(() => {
    if (!dailyLogs.length) return [];
    const sorted = [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date));
    const [ey, em, ed] = sorted[0].date.split('-').map(Number);
    const start = new Date(ey, em - 1, ed);
    start.setDate(start.getDate() - start.getDay());
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const weeks: string[][] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`);
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [dailyLogs]);

  const habitSubtypeOptions = useMemo(() => {
    if (habitMetric !== 'training_type_strength') return [];
    return Object.entries(TRAINING_METRIC_CONFIG.muscles.options).map(([k, v]) => ({ value: k, label: v.label }));
  }, [habitMetric]);

  const showHabitSubtype = habitSubtypeOptions.length > 0;


  // Prepare chart data with all dates
  const chartData = useMemo(() => {
    const allDates = getAllDatesInRange(timeRange);
    const logsByDate = new Map(dailyLogs.map(log => [log.date, log]));
    const startIndex = findEarliestDataDate(allDates, logsByDate);

    return allDates.slice(startIndex).map(date => {
      const log = logsByDate.get(date);
      let m1Value = null;
      let m2Value = null;
      
      if (log) {
        m1Value = metric1 ? log[metric1 as keyof DailyLog] : null;
        m2Value = metric2 ? log[metric2 as keyof DailyLog] : null;
        
        // Scale readiness_score (50-99) to 1-5
        if (metric1 === 'readiness_score' && m1Value !== null) {
          m1Value = ((m1Value as number) - 50) / 49 * 4 + 1;
        }
        if (metric2 === 'readiness_score' && m2Value !== null) {
          m2Value = ((m2Value as number) - 50) / 49 * 4 + 1;
        }
        // Normalize mileage to 0-5 scale for visual comparison
        if (metric1 === 'training_mileage' && m1Value !== null) {
          m1Value = (m1Value as number) / maxMileage * 5;
        }
        if (metric2 === 'training_mileage' && m2Value !== null) {
          m2Value = (m2Value as number) / maxMileage * 5;
        }
      }
      
      return {
        date: formatDate(date),
        fullDate: date,
        metric1: m1Value,
        metric2: m2Value,
      };
    });
  }, [dailyLogs, timeRange, metric1, metric2]);

  // Prepare bar chart data with all dates
  const barChartData = useMemo(() => {
    const allDates = getAllDatesInRange(barTimeRange);
    const logsByDate = new Map(dailyLogs.map(log => [log.date, log]));
    const startIndex = findEarliestDataDate(allDates, logsByDate);

    return allDates.slice(startIndex).map((date, index) => {
      const log = logsByDate.get(date);
      let value: number | null = null;

      if (log && barMetric) {
        const raw = log[barMetric as keyof DailyLog];
        value = typeof raw === 'number' ? raw : null;
      }
      
      return {
        date: formatDate(date),
        fullDate: date,
        value: value,
        index: index,
      };
    });
  }, [dailyLogs, barTimeRange, barMetric]);

  // Calculate line of best fit for bar chart
  const bestFitLine = useMemo(() => {
    const validData = barChartData
      .map((d, index) => ({ ...d, originalIndex: index }))
      .filter(d => d.value !== null);
    
    if (validData.length < 2) {
      return { data: barChartData.map(d => ({ ...d, trendLine: null })), percentChange: null };
    }

    const n = validData.length;
    const sumX = validData.reduce((sum, d) => sum + d.originalIndex, 0);
    const sumY = validData.reduce((sum, d) => sum + (d.value as number), 0);
    const sumXY = validData.reduce((sum, d) => sum + d.originalIndex * (d.value as number), 0);
    const sumX2 = validData.reduce((sum, d) => sum + d.originalIndex * d.originalIndex, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const firstIndex = 0;
    const lastIndex = barChartData.length - 1;
    const firstValue = slope * firstIndex + intercept;
    const lastValue = slope * lastIndex + intercept;
    const percentChange = ((lastValue - firstValue) / firstValue) * 100;

    return {
      data: barChartData.map((d, i) => ({
        ...d,
        trendLine: d.value !== null ? slope * i + intercept : null,
      })),
      percentChange: isFinite(percentChange) ? percentChange : null
    };
  }, [barChartData]);

  const metric1Label = availableMetrics.find(m => m.value === metric1)?.label || '';
  const metric2Label = availableMetrics.find(m => m.value === metric2)?.label || '';
  const barMetricLabel = availableMetrics.find(m => m.value === barMetric)?.label || '';
  
  const showTrendLine = bestFitLine.data.filter(d => d.trendLine !== null).length >= 2;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            let displayValue = entry.value;
            let metricKey = entry.dataKey === 'metric1' ? metric1 : metric2;
            
            if (metricKey === 'readiness_score' && displayValue !== null) {
              displayValue = ((displayValue - 1) / 4 * 49 + 50).toFixed(0);
            } else if (metricKey === 'training_intensity' && displayValue !== null) {
              const opt = TRAINING_METRIC_CONFIG.intensity.options[Math.round(displayValue) as 1|2|3|4|5];
              displayValue = opt?.label ?? displayValue.toFixed(0);
            } else if (metricKey === 'training_mileage' && displayValue !== null) {
              displayValue = (displayValue / 5 * maxMileage).toFixed(2) + ' mi';
            } else if (displayValue !== null) {
              displayValue = displayValue.toFixed(0) + '/5';
            }
            
            return (
              <p key={index} style={{ margin: '4px 0', color: entry.color }}>
                {entry.name}: {displayValue}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const BarCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'trendLine') return null;

            let displayValue = entry.value;

            if (barMetric === 'training_intensity' && displayValue !== null) {
              const opt = TRAINING_METRIC_CONFIG.intensity.options[Math.round(displayValue) as 1|2|3|4|5];
              displayValue = opt?.label ?? displayValue.toFixed(0);
            } else if (barMetric === 'training_mileage' && displayValue !== null) {
              displayValue = displayValue.toFixed(2) + ' mi';
            } else if (barMetric === 'readiness_score' && displayValue !== null) {
              displayValue = displayValue.toFixed(0);
            } else if (displayValue !== null) {
              displayValue = displayValue.toFixed(0) + '/5';
            }
            
            return (
              <p key={index} style={{ margin: '4px 0', color: entry.color }}>
                {barMetricLabel}: {displayValue}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="trends-section">
      <div className="main-heading main-container">
        <h1>Trends</h1>
        <h3>Evaluate your readiness and recovery.</h3>
      </div>
      <div className="main-container">
        <div className="main-heading">
          <h1>Habit Tracker</h1>
          <h3>Overview of your readiness, training, and recovery!</h3>
        </div>

        {habitCalendarWeeks.length > 0 ? (
          <div className="habit-tracker chart-container">
            <div className="habit-calendar" onMouseLeave={() => setHoveredCell(null)}>
              <div className="habit-dow-row">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="habit-dow-label">{d}</div>
                ))}
              </div>
              {habitCalendarWeeks.map((week, wi) => (
                <div key={wi} className="habit-week-row">
                  {week.map(dateStr => {
                    const isOutOfRange = dateStr > todayStr || (earliestLogDate !== null && dateStr < earliestLogDate);
                    const color = isOutOfRange
                      ? null
                      : getHabitCellColor(logsByDate.get(dateStr), habitMetric, habitSubtype);
                    return (
                      <div
                        key={dateStr}
                        className="habit-cell"
                        style={{ backgroundColor: isOutOfRange ? 'transparent' : (color ?? HABIT_NO_DATA_COLOR) }}
                        onMouseEnter={isOutOfRange ? undefined : e => setHoveredCell({ dateStr, x: e.clientX, y: e.clientY })}
                        onMouseMove={isOutOfRange ? undefined : e => setHoveredCell({ dateStr, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredCell(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="habit-tracker empty-state">
            <p>Log your first day to see your habit calendar</p>
          </div>
        )}

        {hoveredCell && (() => {
          const log = logsByDate.get(hoveredCell.dateStr);
          const [y, m, d] = hoveredCell.dateStr.split('-');
          const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const dateLabel = `${monthNames[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;

          const typeOpts = TRAINING_METRIC_CONFIG.types.options as Record<string, { label: string }>;
          const intensityOpts = TRAINING_METRIC_CONFIG.intensity.options as Record<string, { label: string }>;
          const activityOpts = RECOVERY_METRIC_CONFIG.activities.options as Record<string, { label: string }>;

          let content: React.ReactNode = null;

          if (habitMetric.startsWith('training_')) {
            const types = log?.training_complete ? (log.training_types ?? []) : [];
            const trainingLabels = types.length ? types.map(t => typeOpts[t]?.label ?? t).join(', ') : null;
            const intensity = habitMetric === 'training_intensity' && log?.training_intensity != null
              ? intensityOpts[String(log.training_intensity)]?.label
              : null;
            const muscleOpts = TRAINING_METRIC_CONFIG.muscles.options as Record<string, { label: string }>;
            const muscles = habitMetric === 'training_type_strength' && log?.training_muscles?.length
              ? log.training_muscles.map(m => muscleOpts[m]?.label ?? m).join(', ')
              : null;
            const mileage = habitMetric === 'training_type_distance' && log?.training_mileage != null
              ? log.training_mileage
              : null;
            content = (
              <>
                {intensity && <div>Intensity: {intensity}</div>}
                {trainingLabels && <div>Workout: {trainingLabels}</div>}
                {muscles && <div>Muscles: {muscles}</div>}
                {mileage != null && <div>Mileage: {mileage} mi</div>}
              </>
            );
          } else if (habitMetric.startsWith('recovery_')) {
            const activities = log?.recovery_complete && log?.recovery_activities?.length
              ? log.recovery_activities.map(a => activityOpts[a]?.label ?? a)
              : null;
            content = activities ? <>{activities.map(label => <div key={label}>{label}</div>)}</> : null;
          } else {
            // Readiness / soreness metrics
            let metricLabel: string | null = null;
            let metricValue: number | null = null;
            if (habitMetric === 'readiness_score') {
              metricLabel = 'Readiness Score';
              metricValue = log?.readiness_score ?? null;
            } else if (habitMetric.startsWith('readiness_')) {
              const key = habitMetric.slice('readiness_'.length).replace('_morning', '');
              metricLabel = READINESS_METRIC_CONFIG[key as keyof typeof READINESS_METRIC_CONFIG]?.label ?? key;
              metricValue = (log?.[`${key}_morning` as keyof DailyLog] as number | null) ?? null;
            } else if (habitMetric.startsWith('soreness_')) {
              const key = habitMetric.slice('soreness_'.length).replace('_morning', '');
              metricLabel = SORENESS_METRIC_CONFIG[key as keyof typeof SORENESS_METRIC_CONFIG]?.label ?? key;
              metricValue = (log?.[`${key}_morning` as keyof DailyLog] as number | null) ?? null;
            }
            const isOutOfFive = habitMetric !== 'readiness_score';
            content = (
              <>
                {metricLabel && metricValue != null && <div>{metricLabel}: {metricValue}{isOutOfFive ? '/5' : ''}</div>}
                {habitMetric !== 'readiness_score' && log?.readiness_score != null && <div>Readiness: {log.readiness_score}</div>}
              </>
            );
          }

          return (
            <div
              className="habit-tooltip"
              style={{
                left: hoveredCell.x + (hoveredCell.x > window.innerWidth / 2 ? -12 : 12),
                top: hoveredCell.y - 8,
                transform: hoveredCell.x > window.innerWidth / 2 ? 'translateX(-100%)' : 'none',
              }}
            >
              <div style={{ fontWeight: 600 }}>{dateLabel}</div>
              {content}
            </div>
          );
        })()}

        <div className="trends-controls">
          <div className="metric-selectors">
            <div className="metric-selector-group">
              <label className="metric-selector-label">Habit / Metric</label>
              <div className="metric-selector-wrapper">
                <select
                  value={habitMetric}
                  onChange={e => { setHabitMetric(e.target.value); setHabitSubtype(''); }}
                  className="metric-select"
                >
                  <optgroup label="Readiness">
                    <option value="readiness_score">Readiness Score</option>
                    {Object.entries(READINESS_METRIC_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={`readiness_${k}_morning`}>{cfg.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Soreness">
                    {Object.entries(SORENESS_METRIC_CONFIG)
                      .filter(([, cfg]) => (userProfile?.event_types || []).some((et: string) => cfg.eventTypes.includes(et as any)))
                      .map(([k, cfg]) => (
                        <option key={k} value={`soreness_${k}_morning`}>{cfg.label}</option>
                      ))}
                  </optgroup>
                  <optgroup label="Training">
                    <option value="training_intensity">Training Intensity</option>
                    {Object.entries(TRAINING_METRIC_CONFIG.types.options)
                      .filter(([, cfg]) => (userProfile?.event_types || []).some((et: string) => cfg.eventTypes.includes(et as any)))
                      .map(([k, cfg]) => (
                        <option key={k} value={`training_type_${k}`}>{cfg.label}</option>
                      ))}
                  </optgroup>
                  <optgroup label="Recovery">
                    {Object.entries(RECOVERY_METRIC_CONFIG.activities.options)
                      .filter(([, cfg]) => {
                        const c = cfg as any;
                        return (userProfile?.event_types || []).some((et: string) => c.eventTypes?.includes(et));
                      })
                      .map(([k, cfg]) => (
                        <option key={k} value={`recovery_activity_${k}`}>{(cfg as any).label}</option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {showHabitSubtype && (
              <div className="metric-selector-group">
                <label className="metric-selector-label">Subtype</label>
                <div className="metric-selector-wrapper">
                  <select
                    value={habitSubtype}
                    onChange={e => setHabitSubtype(e.target.value)}
                    className="metric-select"
                  >
                    <option value="">All Weights Days</option>
                    {habitSubtypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="main-container">
        <div className="main-heading">
          <h1>Progress Chart</h1>
          <h3>View trends over time.</h3>
        </div>
        {barMetric && bestFitLine.data.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={bestFitLine.data} margin={{ left: -20, right: 10, top: 10, bottom: 10 }} >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  domain={
                    barMetric === 'readiness_score' ? [50, 100] :
                    barMetric === 'training_mileage' ? [0, 'auto'] :
                    [0, 5]
                  }
                  ticks={
                    barMetric === 'readiness_score' || barMetric === 'training_mileage'
                      ? undefined
                      : [0, 1, 2, 3, 4, 5]
                  }
                />
                <Tooltip 
                  content={<BarCustomTooltip />}
                  cursor={false}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  animationDuration={500}
                >
                  {bestFitLine.data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        barMetric === 'training_intensity'
                          ? (TRAINING_METRIC_CONFIG.intensity.options[Math.round(entry.value ?? 0) as 1|2|3|4|5]?.color ?? '#64748b')
                          : barMetric === 'training_mileage'
                          ? '#0000FF'
                          : getBarColor(entry.value, barMetric === 'readiness_score')
                      }
                      stroke="none"
                    />
                  ))}
                </Bar>
                {showTrendLine && (
                  <Line
                    type="monotone"
                    dataKey="trendLine"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    strokeDasharray="5 5"
                    connectNulls
                    animationDuration={500}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
            
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{
                  backgroundColor: barMetric === 'training_intensity'
                    ? (() => {
                        const valid = bestFitLine.data.filter(d => d.value !== null);
                        if (!valid.length) return '#FFFFFF';
                        const avg = valid.reduce((s, d) => s + d.value!, 0) / valid.length;
                        return TRAINING_METRIC_CONFIG.intensity.options[Math.round(avg) as 1|2|3|4|5]?.color ?? '#64748b';
                      })()
                    : barMetric === 'training_mileage'
                    ? '#0000FF'
                    : getAverageBarColor(bestFitLine.data, barMetric === 'readiness_score')
                }} />
                <span>{barMetricLabel}</span>
              </div>
              {showTrendLine && (
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#3b82f6' }} />
                  <span>Best Fit</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Select a metric to track</p>
          </div>
        )}
        <div className="trends-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div className="time-range-toggle">
              <button
                onClick={() => setBarTimeRange(7)}
                className={`time-range-btn ${barTimeRange === 7 ? 'active' : ''}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setBarTimeRange(30)}
                className={`time-range-btn ${barTimeRange === 30 ? 'active' : ''}`}
              >
                30 Days
              </button>
            </div>

            {showTrendLine && bestFitLine.percentChange !== null && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: bestFitLine.percentChange >= 0 ? '#dcfce7' : '#fee2e2',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: bestFitLine.percentChange >= 0 ? '#16a34a' : '#dc2626'
              }}>
                {bestFitLine.percentChange >= 0 ? (
                  <TrendingUp size={20} />
                ) : (
                  <TrendingDown size={20} />
                )}
                <span>{Math.abs(bestFitLine.percentChange).toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="metric-selectors">
            <div className="metric-selector-group">
              <label className="metric-selector-label">Metric</label>
              <div className="metric-selector-wrapper">
                <select
                  value={barMetric || ''}
                  onChange={(e) => setBarMetric(e.target.value || null)}
                  className="metric-select"
                >
                  <option value="">Select metric...</option>
                  {groupedMetrics.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="main-container">
        <div className="main-heading">
          <h1>Trends Chart</h1>
          <h3>Analyze relations between metrics.</h3>
        </div>
        {(metric1 || metric2) && chartData.length > 0 ? (
          <div className="chart-container">
              <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorMetric1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  domain={[0, 5]}
                />
                <Tooltip content={<CustomTooltip />} />
                {metric1 && (
                  <Area
                    type="monotone"
                    dataKey="metric1"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorMetric1)"
                    name={metric1Label}
                    connectNulls
                    dot={{ fill: '#3b82f6', r: 4 }}
                    animationDuration={500}
                  />
                )}
                {metric2 && (
                  <Line
                    type="monotone"
                    dataKey="metric2"
                    stroke="#efbf04"
                    strokeWidth={3}
                    dot={{ fill: '#efbf04', r: 4 }}
                    name={metric2Label}
                    connectNulls
                    animationDuration={500}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
            
            <div className="chart-legend">
              {metric1 && (
                <div className="legend-item">
                  <div className="legend-color metric1-color" />
                  <span>{metric1Label}</span>
                </div>
              )}
              {metric2 && (
                <div className="legend-item">
                  <div className="legend-color metric2-color" />
                  <span>{metric2Label}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Select at least one metric to compare</p>
          </div>
        )}
        <div className="trends-controls">
          <div className="time-range-toggle">
            <button
              onClick={() => setTimeRange(7)}
              className={`time-range-btn ${timeRange === 7 ? 'active' : ''}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`time-range-btn ${timeRange === 30 ? 'active' : ''}`}
            >
              30 Days
            </button>
          </div>

          <div className="metric-selectors">
            <div className="metric-selector-group">
              <label className="metric-selector-label">Metric 1 (Blue)</label>
              <div className="metric-selector-wrapper">
                <select
                  value={metric1 || ''}
                  onChange={(e) => setMetric1(e.target.value || null)}
                  className="metric-select"
                >
                  <option value="">Select metric...</option>
                  {groupedMetrics.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button
                  onClick={() => setMetric1(null)}
                  className="metric-clear-btn"
                  title="Clear metric"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="metric-selector-group">
              <label className="metric-selector-label">Metric 2 (Yellow)</label>
              <div className="metric-selector-wrapper">
                <select
                  value={metric2 || ''}
                  onChange={(e) => setMetric2(e.target.value || null)}
                  className="metric-select"
                >
                  <option value="">Select metric...</option>
                  {groupedMetrics.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button
                  onClick={() => setMetric2(null)}
                  className="metric-clear-btn"
                  title="Clear metric"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}