import { useState, useContext, useMemo, useEffect } from "react";
import { Moon, BatteryMedium, GlassWater, Beef, Zap, Activity, NotebookPen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../context/AuthContext";
import { calculateReadinessScore } from "../../utils/readinessScore";
import { SORENESS_METRIC_CONFIG, SorenessMetricKey, READINESS_METRIC_CONFIG, ReadinessMetricKey } from "@/config/metrics";

interface MorningReadinessProps {
  onComplete: () => void;
  currentDate: string;
  userProfile: any;
  existingLog?: any; // Optional - if provided, we're editing; if not, we're creating
}

// Icon mapping for readiness metrics
const READINESS_ICONS = {
  sleep: Moon,
  energy: BatteryMedium,
  stress: Zap,
  hydration: GlassWater,
  nutrition: Beef,
};

export default function MorningReadiness({ onComplete, currentDate, userProfile, existingLog }: MorningReadinessProps) {
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic general readiness state - automatically includes all metrics from config
  const [readinessValues, setReadinessValues] = useState<Record<ReadinessMetricKey, number>>(() => {
    const initial: Record<string, number> = {};
    Object.keys(READINESS_METRIC_CONFIG).forEach(key => {
      initial[key] = existingLog?.[`${key}_morning`] || 3;
    });
    return initial as Record<ReadinessMetricKey, number>;
  });

  // Update a specific readiness metric
  const updateReadinessValue = (key: ReadinessMetricKey, value: number) => {
    setReadinessValues(prev => ({ ...prev, [key]: value }));
  };

  const [notes, setNotes] = useState(existingLog?.notes_morning || "");

  // Dynamic soreness state - automatically includes all metrics from config
  const [sorenessValues, setSorenessValues] = useState<Record<SorenessMetricKey, number>>(() => {
    const initial: Record<string, number> = {};
    Object.keys(SORENESS_METRIC_CONFIG).forEach(key => {
      initial[key] = existingLog?.[`${key}_morning`] || 3;
    });
    return initial as Record<SorenessMetricKey, number>;
  });

  // Update a specific soreness metric
  const updateSorenessValue = (key: SorenessMetricKey, value: number) => {
    setSorenessValues(prev => ({ ...prev, [key]: value }));
  };

  // Determine which soreness metrics to show based on user's event types
  const visibleSorenessMetrics = useMemo(() => {
    if (!userProfile?.event_types || userProfile.event_types.length === 0) {
      return [];
    }

    const userEventTypes = userProfile.event_types;
    const visible = [];

    for (const [key, config] of Object.entries(SORENESS_METRIC_CONFIG)) {
      const shouldShow = config.eventTypes.some(eventType => 
        userEventTypes.includes(eventType)
      );
      
      if (shouldShow) {
        visible.push({ key: key as SorenessMetricKey, ...config });
      }
    }

    return visible;
  }, [userProfile?.event_types]);

  const handleFinalSubmit = async () => {
    if (!user || !currentDate || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Build soreness object dynamically - only include visible metrics
      const sorenessData: Record<string, number | null> = {};
      
      // Initialize all metrics as null
      Object.keys(SORENESS_METRIC_CONFIG).forEach(key => {
        sorenessData[key] = null;
      });

      // Set actual values only for visible metrics
      visibleSorenessMetrics.forEach(({ key }) => {
        sorenessData[key] = sorenessValues[key];
      });

      // Build readiness score params dynamically
      const readinessParams: any = {
        ...readinessValues,
        ...sorenessData
      };

      const readinessScore = calculateReadinessScore(readinessParams);

      // Build the database log object dynamically
      const logData: any = {
        user_id: user.id,
        date: currentDate,
        morning_complete: true,
        notes_morning: notes,
        readiness_score: readinessScore,
      };

      // Add all readiness metrics dynamically
      Object.entries(readinessValues).forEach(([key, value]) => {
        logData[`${key}_morning`] = value;
      });

      // Add all soreness metrics dynamically
      Object.entries(sorenessData).forEach(([key, value]) => {
        logData[`${key}_morning`] = value;
      });

      let result;

      if (existingLog) {
        // UPDATE existing log
        const { data, error } = await supabase
          .from("daily_logs")
          .update(logData)
          .eq("id", existingLog.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // INSERT new log
        const { data, error } = await supabase
          .from("daily_logs")
          .insert(logData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Update sessionStorage
      const cachedLogs = sessionStorage.getItem('dailyLogs');
      const dailyLogs = cachedLogs ? JSON.parse(cachedLogs) : [];
      
      if (existingLog) {
        // Replace the existing log
        const index = dailyLogs.findIndex((log: any) => log.id === existingLog.id);
        if (index !== -1) {
          dailyLogs[index] = result;
        }
      } else {
        // Add new log to the beginning
        dailyLogs.unshift(result);
      }
      
      sessionStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));

      onComplete();
    } catch (err) {
      console.error("Error submitting readiness data:", err);
      alert("Failed to submit data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-container">
      <div className="main-heading">
        <h1>Hi, {userProfile?.first_name || 'there'}!</h1>
        <h3>{existingLog ? 'Update your morning readiness' : 'How are you feeling this morning?'}</h3>
      </div>

      {/* Page 1: General Readiness - Fully Dynamic */}
      {currentPage === 1 && (
        <div className="readiness-page">
          <div className="metrics-container">
            {Object.entries(READINESS_METRIC_CONFIG).map(([key, config]) => {
              const Icon = READINESS_ICONS[key as ReadinessMetricKey];
              const metricKey = key as ReadinessMetricKey;
              
              return (
                <div key={key} className="metric-item">
                  <label>
                    <Icon size={20} className="metric-icon" />
                    <span>{config.label}</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={readinessValues[metricKey]}
                      onChange={(e) => updateReadinessValue(metricKey, parseInt(e.target.value))}
                      className={`metric-slider slider-value-${readinessValues[metricKey]}`}
                    />
                    <div className="slider-labels">
                      <span>{config.minLabel}</span>
                      <span>{config.maxLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="button-group">
            <button className="submit-button next-button" onClick={() => setCurrentPage(2)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Page 2: Soreness - Fully Dynamic */}
      {currentPage === 2 && (
        <div className="readiness-page">
          <div className="metrics-container">
            {visibleSorenessMetrics.map(({ key, label }) => (
              <div key={key} className="metric-item">
                <label>
                  <Activity size={20} className="metric-icon" />
                  <span>{label}</span>
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={sorenessValues[key]}
                    onChange={(e) => updateSorenessValue(key, parseInt(e.target.value))}
                    className={`metric-slider slider-value-${sorenessValues[key]}`}
                  />
                  <div className="slider-labels">
                    <span>Severe</span>
                    <span>None</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="button-group">
            <button className="back-button" onClick={() => setCurrentPage(1)}>
              Back
            </button>
            <button className="submit-button" onClick={() => setCurrentPage(3)}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Page 3: Notes */}
      {currentPage === 3 && (
        <div className="readiness-page">
          <div className="notes-container">
            <label className="notes-label">
              <NotebookPen size={20} className="metric-icon" />
              <span>Notes</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="notes-textarea"
              rows={8}
            />
          </div>

          <div className="button-group">
            <button className="back-button" onClick={() => setCurrentPage(2)}>
              Back
            </button>
            <button 
              className="submit-button" 
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : (existingLog ? "Update" : "Submit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}