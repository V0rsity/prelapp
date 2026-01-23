import { useState, useMemo } from "react";
import { Moon, BatteryMedium, GlassWater, Beef, Zap, Activity, NotebookPen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { calculateReadinessScore } from "../../utils/readinessScore";
import { SORENESS_METRIC_CONFIG, SorenessMetricKey, getSorenessMetrics } from "@/config/metrics";

interface EditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  onSave: () => void;
  userProfile: any;
}

export default function EditLogModal({ isOpen, onClose, log, onSave, userProfile }: EditLogModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // General readiness state - initialized from log
  const [sleep, setSleep] = useState(log?.sleep_morning || 3);
  const [energy, setEnergy] = useState(log?.energy_morning || 3);
  const [stress, setStress] = useState(log?.stress_morning || 3);
  const [hydration, setHydration] = useState(log?.hydration_morning || 3);
  const [nutrition, setNutrition] = useState(log?.nutrition_morning || 3);
  const [notes, setNotes] = useState(log?.notes_morning || "");

  // Dynamic soreness state - automatically includes all metrics from config
  const [sorenessValues, setSorenessValues] = useState<Record<SorenessMetricKey, number>>(() => {
    const initial: Record<string, number> = {};
    Object.keys(SORENESS_METRIC_CONFIG).forEach(key => {
      // Initialize from log if it exists, otherwise default to 3
      initial[key] = log?.[`${key}_morning`] || 3;
    });
    return initial as Record<SorenessMetricKey, number>;
  });

  // Update a specific soreness metric
  const updateSorenessValue = (key: SorenessMetricKey, value: number) => {
    setSorenessValues(prev => ({ ...prev, [key]: value }));
  };

  // Determine which soreness metrics to show - only those that exist in the log
  const visibleSorenessMetrics = useMemo(() => {
    if (!log) return [];
    
    const sorenessMetrics = getSorenessMetrics();
    
    // Filter to only include metrics that exist in the log (not null/undefined)
    return sorenessMetrics.filter(({ key }) => {
      const value = log[`${key}_morning`];
      return value !== null && value !== undefined;
    });
  }, [log]);

  const handleUpdate = async () => {
    if (!log || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Build soreness object dynamically - preserve nulls for metrics not in the original log
      const sorenessData: Record<string, number | null> = {};
      
      Object.keys(SORENESS_METRIC_CONFIG).forEach(key => {
        const logValue = log[`${key}_morning`];
        // Only include value if it existed in the original log
        if (logValue !== null && logValue !== undefined) {
          sorenessData[key] = sorenessValues[key as SorenessMetricKey];
        } else {
          sorenessData[key] = null;
        }
      });

      // Build readiness score params dynamically
      const readinessParams: any = {
        sleep,
        energy,
        stress,
        hydration,
        nutrition,
        ...sorenessData
      };

      const readinessScore = calculateReadinessScore(readinessParams);

      // Build the update object dynamically
      const updatedLog: any = {
        sleep_morning: sleep,
        energy_morning: energy,
        stress_morning: stress,
        hydration_morning: hydration,
        nutrition_morning: nutrition,
        notes_morning: notes,
        readiness_score: readinessScore,
      };

      // Add all soreness metrics dynamically
      Object.entries(sorenessData).forEach(([key, value]) => {
        updatedLog[`${key}_morning`] = value;
      });

      // Update in Supabase
      const { data, error } = await supabase
        .from("daily_logs")
        .update(updatedLog)
        .eq("id", log.id)
        .select()
        .single();

      if (error) throw error;

      // Clear sessionStorage to force refresh from Supabase
      sessionStorage.removeItem('dailyLogs');

      // Call onSave callback to trigger refresh
      onSave();
      onClose();
    } catch (err) {
      console.error("Error updating log:", err);
      alert("Failed to update log. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !log) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="main-container">
          <div className="main-heading">
            <h1>Edit Log</h1>
            <h3>Update your morning readiness log.</h3>
          </div>

          {/* Page 1: General Readiness */}
          {currentPage === 1 && (
            <div className="readiness-page">
              <div className="metrics-container">
                <div className="metric-item">
                  <label>
                    <Moon size={20} className="metric-icon" />
                    <span>Sleep Quality</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={sleep}
                      onChange={(e) => setSleep(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${sleep}`}
                    />
                    <div className="slider-labels">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                <div className="metric-item">
                  <label>
                    <BatteryMedium size={20} className="metric-icon" />
                    <span>Energy Level</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={energy}
                      onChange={(e) => setEnergy(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${energy}`}
                    />
                    <div className="slider-labels">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>

                <div className="metric-item">
                  <label>
                    <Zap size={20} className="metric-icon" />
                    <span>Stress</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={stress}
                      onChange={(e) => setStress(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${stress}`}
                    />
                    <div className="slider-labels">
                      <span>Overwhelmed</span>
                      <span>Calm</span>
                    </div>
                  </div>
                </div>

                <div className="metric-item">
                  <label>
                    <GlassWater size={20} className="metric-icon" />
                    <span>Hydration</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={hydration}
                      onChange={(e) => setHydration(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${hydration}`}
                    />
                    <div className="slider-labels">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>

                <div className="metric-item">
                  <label>
                    <Beef size={20} className="metric-icon" />
                    <span>Nutrition</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={nutrition}
                      onChange={(e) => setNutrition(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${nutrition}`}
                    />
                    <div className="slider-labels">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
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
                        value={sorenessValues[key as SorenessMetricKey]}
                        onChange={(e) => updateSorenessValue(key as SorenessMetricKey, parseInt(e.target.value))}
                        className={`metric-slider slider-value-${sorenessValues[key as SorenessMetricKey]}`}
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
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}