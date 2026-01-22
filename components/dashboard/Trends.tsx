import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell } from 'recharts';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

interface DailyLog {
  id: number;
  created_at: string;
  user_id: string;
  date: string;
  morning_complete: boolean;
  sleep_morning: number | null;
  energy_morning: number | null;
  stress_morning: number | null;
  hydration_morning: number | null;
  nutrition_morning: number | null;
  quad_morning: number | null;
  hamstring_morning: number | null;
  hip_morning: number | null;
  calf_morning: number | null;
  shin_morning: number | null;
  notes_morning: string | null;
  readiness_score: number | null;
}

interface Props {
  dailyLogs: DailyLog[];
  userProfile: any;
  refreshUserData: () => void;
}

const METRICS = [
  { value: 'readiness_score', label: 'Readiness Score' },
  { value: 'sleep_morning', label: 'Sleep Quality' },
  { value: 'energy_morning', label: 'Energy Level' },
  { value: 'stress_morning', label: 'Stress Level' },
  { value: 'hydration_morning', label: 'Hydration' },
  { value: 'nutrition_morning', label: 'Nutrition' },
  { value: 'quad_morning', label: 'Quad Soreness' },
  { value: 'hamstring_morning', label: 'Hamstring Soreness' },
  { value: 'hip_morning', label: 'Hip Soreness' },
  { value: 'calf_morning', label: 'Calf Soreness' },
  { value: 'shin_morning', label: 'Shin Soreness' },
];

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
  if (value === null) return '#FFFFFF'; // default white
  
  if (isReadinessScore) {
    // Readiness score: 50s = red, 60s = orange, 70s = yellow, 80s = light-green, 90s = green
    if (value < 60) return 'var(--color-red)';
    if (value < 70) return 'var(--color-orange)';
    if (value < 80) return 'var(--color-yellow)';
    if (value < 90) return 'var(--color-light-green)';
    return 'var(--color-green)';
  } else {
    // 1-5 scale: 1 = red, 2 = orange, 3 = yellow, 4 = light-green, 5 = green
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

export default function Trends({ dailyLogs, userProfile }: Props) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [barTimeRange, setBarTimeRange] = useState<7 | 30>(7);
  const [barMetric, setBarMetric] = useState<string | null>('readiness_score');
  const [metric1, setMetric1] = useState<string | null>('readiness_score');
  const [metric2, setMetric2] = useState<string | null>('sleep_morning');

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

    // Calculate percent change from first to last point on trend line
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

  const metric1Label = METRICS.find(m => m.value === metric1)?.label || '';
  const metric2Label = METRICS.find(m => m.value === metric2)?.label || '';
  const barMetricLabel = METRICS.find(m => m.value === barMetric)?.label || '';
  
  // Check if we should show trend line (at least 2 valid data points)
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
            // Check if this is readiness score and convert back to 50-99 scale
            let displayValue = entry.value;
            let metricKey = entry.dataKey === 'metric1' ? metric1 : metric2;
            
            if (metricKey === 'readiness_score' && displayValue !== null) {
              displayValue = ((displayValue - 1) / 4 * 49 + 50).toFixed(0);
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
            
            // Display actual values without conversion
            if (barMetric === 'readiness_score' && displayValue !== null) {
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
          <h1>Track Progress</h1>
          <h3>View trends over time.</h3>
        </div>
        {/* Bar Chart */}
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
                  domain={barMetric === 'readiness_score' ? [50, 100] : [0, 5]}
                  ticks={barMetric === 'readiness_score' ? undefined : [0, 1, 2, 3, 4, 5]}
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
                      fill={getBarColor(entry.value, barMetric === 'readiness_score')}
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
            
            {/* Legend */}
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: getAverageBarColor(bestFitLine.data, barMetric === 'readiness_score') }} />
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
        {/* Controls */}
        <div className="trends-controls">
          {/* Time Range Toggle and Trend Indicator */}
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

            {/* Trend Indicator */}
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

          {/* Metric Selector */}
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
                  {METRICS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="main-container">
        <div className="main-heading">
          <h1>Compare Trends</h1>
          <h3>Analyze relations between metrics.</h3>
        </div>
        {/* Chart */}
        {(metric1 || metric2) && chartData.length > 0 ? (
          <div className="chart-container">
            <div className='chart-label'>
              <p>(Great)</p>
            </div>
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
                  domain={[1, 5]}
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
            
            {/* Legend */}
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
        {/* Controls */}
        <div className="trends-controls">
          {/* Time Range Toggle */}
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

          {/* Metric Selectors */}
          <div className="metric-selectors">
            {/* Metric 1 (Area) */}
            <div className="metric-selector-group">
              <label className="metric-selector-label">Metric 1 (Blue)</label>
              <div className="metric-selector-wrapper">
                <select
                  value={metric1 || ''}
                  onChange={(e) => setMetric1(e.target.value || null)}
                  className="metric-select"
                >
                  <option value="">Select metric...</option>
                  {METRICS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
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

            {/* Metric 2 (Line) */}
            <div className="metric-selector-group">
              <label className="metric-selector-label">Metric 2 (Yellow)</label>
              <div className="metric-selector-wrapper">
                <select
                  value={metric2 || ''}
                  onChange={(e) => setMetric2(e.target.value || null)}
                  className="metric-select"
                >
                  <option value="">Select metric...</option>
                  {METRICS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
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