import { useState, useMemo } from "react";
import { Moon, BatteryMedium, GlassWater, Beef, Zap, Activity, NotebookPen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { calculateReadinessScore } from "../../utils/readinessScore";

// Metric configuration - same as MorningReadiness
const METRIC_CONFIG = {
  quad: {
    label: "Quad Soreness",
    eventTypes: ["runner", "jumper", "thrower", "hurdler", "pole_vaulter"],
  },
  hamstring: {
    label: "Hamstring Soreness",
    eventTypes: ["runner", "jumper", "hurdler", "pole_vaulter"],
  },
  hip: {
    label: "Hip Soreness",
    eventTypes: ["runner", "jumper", "thrower", "hurdler", "pole_vaulter"],
  },
  calf: {
    label: "Calf Soreness",
    eventTypes: ["runner", "jumper", "hurdler", "pole_vaulter"],
  },
  shin: {
    label: "Shin Soreness",
    eventTypes: ["runner", "hurdler"],
  },
};

interface EditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  onSave: () => void;
  userProfile: any; // Add userProfile prop
}

export default function EditLogModal({ isOpen, onClose, log, onSave, userProfile }: EditLogModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state from log
  const [sleep, setSleep] = useState(log?.sleep_morning || 3);
  const [energy, setEnergy] = useState(log?.energy_morning || 3);
  const [stress, setStress] = useState(log?.stress_morning || 3);
  const [hydration, setHydration] = useState(log?.hydration_morning || 3);
  const [nutrition, setNutrition] = useState(log?.nutrition_morning || 3);
  const [quadSoreness, setQuadSoreness] = useState(log?.quad_morning || 3);
  const [hamstringSoreness, setHamstringSoreness] = useState(log?.hamstring_morning || 3);
  const [hipSoreness, setHipSoreness] = useState(log?.hip_morning || 3);
  const [calfSoreness, setCalfSoreness] = useState(log?.calf_morning || 3);
  const [shinSoreness, setShinSoreness] = useState(log?.shin_morning || 3);
  const [notes, setNotes] = useState(log?.notes_morning || "");

  // Determine which soreness metrics to show based on what's in the log
  const visibleSorenessMetrics = useMemo(() => {
    if (!log) return [];
    
    const sorenessMetrics = [
      { key: 'quad', label: 'Quad Soreness' },
      { key: 'hamstring', label: 'Hamstring Soreness' },
      { key: 'hip', label: 'Hip Soreness' },
      { key: 'calf', label: 'Calf Soreness' },
      { key: 'shin', label: 'Shin Soreness' }
    ];
    
    // Filter to only include metrics that exist in the log (not null/undefined)
    return sorenessMetrics.filter(({ key }) => {
      const value = log[`${key}_morning`];
      return value !== null && value !== undefined;
    });
  }, [log]);

  // Map metric keys to their state values and setters
  const metricStateMap: Record<string, { value: number; setter: (value: number) => void }> = {
    quad: { value: quadSoreness, setter: setQuadSoreness },
    hamstring: { value: hamstringSoreness, setter: setHamstringSoreness },
    hip: { value: hipSoreness, setter: setHipSoreness },
    calf: { value: calfSoreness, setter: setCalfSoreness },
    shin: { value: shinSoreness, setter: setShinSoreness },
  };

  const handleUpdate = async () => {
    if (!log || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Build soreness object - preserve nulls for metrics not in the original log
      const sorenessData: Record<string, number | null> = {
        quad: log.quad_morning !== null && log.quad_morning !== undefined ? quadSoreness : null,
        hamstring: log.hamstring_morning !== null && log.hamstring_morning !== undefined ? hamstringSoreness : null,
        hip: log.hip_morning !== null && log.hip_morning !== undefined ? hipSoreness : null,
        calf: log.calf_morning !== null && log.calf_morning !== undefined ? calfSoreness : null,
        shin: log.shin_morning !== null && log.shin_morning !== undefined ? shinSoreness : null,
      };

      const readinessScore = calculateReadinessScore({
        sleep,
        energy,
        stress,
        hydration,
        nutrition,
        quad: sorenessData.quad,
        hamstring: sorenessData.hamstring,
        hip: sorenessData.hip,
        calf: sorenessData.calf,
        shin: sorenessData.shin,
      });

      const updatedLog = {
        sleep_morning: sleep,
        energy_morning: energy,
        stress_morning: stress,
        hydration_morning: hydration,
        nutrition_morning: nutrition,
        quad_morning: sorenessData.quad,
        hamstring_morning: sorenessData.hamstring,
        hip_morning: sorenessData.hip,
        calf_morning: sorenessData.calf,
        shin_morning: sorenessData.shin,
        notes_morning: notes,
        readiness_score: readinessScore,
      };

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
                {/* Sleep Quality */}
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

                {/* Energy Level */}
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

                {/* Stress Level */}
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

                {/* Hydration */}
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

                {/* Nutrition */}
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

          {/* Page 2: Soreness */}
          {currentPage === 2 && (
            <div className="readiness-page">
              <div className="metrics-container">
                {visibleSorenessMetrics.map(({ key, label }) => {
                  const { value, setter } = metricStateMap[key];
                  return (
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
                          value={value}
                          onChange={(e) => setter(parseInt(e.target.value))}
                          className={`metric-slider slider-value-${value}`}
                        />
                        <div className="slider-labels">
                          <span>Severe</span>
                          <span>None</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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