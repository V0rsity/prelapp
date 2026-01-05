import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { X } from 'lucide-react';

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

export default function Trends({ dailyLogs, userProfile }: Props) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [metric1, setMetric1] = useState<string | null>('readiness_score');
  const [metric2, setMetric2] = useState<string | null>('sleep_morning');

  // Prepare chart data
  const chartData = useMemo(() => {
    const sortedLogs = [...dailyLogs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-timeRange);

    return sortedLogs.map(log => {
      let m1Value = metric1 ? log[metric1 as keyof DailyLog] : null;
      let m2Value = metric2 ? log[metric2 as keyof DailyLog] : null;
      
      // Scale readiness_score (50-99) to 1-5
      if (metric1 === 'readiness_score' && m1Value !== null) {
        m1Value = ((m1Value as number) - 50) / 49 * 4 + 1;
      }
      if (metric2 === 'readiness_score' && m2Value !== null) {
        m2Value = ((m2Value as number) - 50) / 49 * 4 + 1;
      }
      
      return {
        date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: log.date,
        metric1: m1Value,
        metric2: m2Value,
      };
    });
  }, [dailyLogs, timeRange, metric1, metric2]);

  const metric1Label = METRICS.find(m => m.value === metric1)?.label || '';
  const metric2Label = METRICS.find(m => m.value === metric2)?.label || '';

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

  return (
    <div className="trends-section">
      <div className="main-heading main-container">
        <h1>Trends</h1>
        <h3>Evaluate your readiness and recovery.</h3>
      </div>
      <div className="main-container">
        <div className="main-heading">
          <h1>Compare</h1>
          <h3>Multiple metrics at once.</h3>
        </div>
        {/* Chart */}
        {(metric1 || metric2) && chartData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
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
                  />
                )}
                {metric2 && (
                  <Line
                    type="monotone"
                    dataKey="metric2"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    name={metric2Label}
                    connectNulls
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
              <label className="metric-selector-label">Line 1</label>
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
              <label className="metric-selector-label">Line 2</label>
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