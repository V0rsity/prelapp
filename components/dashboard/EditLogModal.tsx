import { useState } from "react";
import { Moon, BatteryMedium, GlassWater, Beef, Zap, Activity, NotebookPen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { calculateReadinessScore } from "../../utils/readinessScore";

interface EditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  onSave: () => void; // Changed to just trigger refresh
}

export default function EditLogModal({ isOpen, onClose, log, onSave }: EditLogModalProps) {
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

  const handleUpdate = async () => {
    if (!log || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const readinessScore = calculateReadinessScore({
        sleep,
        energy,
        stress,
        hydration,
        nutrition,
        quad: quadSoreness,
        hamstring: hamstringSoreness,
        hip: hipSoreness,
        calf: calfSoreness,
        shin: shinSoreness,
      });

      const updatedLog = {
        sleep_morning: sleep,
        energy_morning: energy,
        stress_morning: stress,
        hydration_morning: hydration,
        nutrition_morning: nutrition,
        quad_morning: quadSoreness,
        hamstring_morning: hamstringSoreness,
        hip_morning: hipSoreness,
        calf_morning: calfSoreness,
        shin_morning: shinSoreness,
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
                {/* Quad Soreness */}
                <div className="metric-item">
                  <label>
                    <Activity size={20} className="metric-icon" />
                    <span>Quad Soreness</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={quadSoreness}
                      onChange={(e) => setQuadSoreness(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${quadSoreness}`}
                    />
                    <div className="slider-labels">
                      <span>Severe</span>
                      <span>None</span>
                    </div>
                  </div>
                </div>

                {/* Hamstring Soreness */}
                <div className="metric-item">
                  <label>
                    <Activity size={20} className="metric-icon" />
                    <span>Hamstring Soreness</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={hamstringSoreness}
                      onChange={(e) => setHamstringSoreness(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${hamstringSoreness}`}
                    />
                    <div className="slider-labels">
                      <span>Severe</span>
                      <span>None</span>
                    </div>
                  </div>
                </div>

                {/* Hip Soreness */}
                <div className="metric-item">
                  <label>
                    <Activity size={20} className="metric-icon" />
                    <span>Hip Soreness</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={hipSoreness}
                      onChange={(e) => setHipSoreness(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${hipSoreness}`}
                    />
                    <div className="slider-labels">
                      <span>Severe</span>
                      <span>None</span>
                    </div>
                  </div>
                </div>

                {/* Calf Soreness */}
                <div className="metric-item">
                  <label>
                    <Activity size={20} className="metric-icon" />
                    <span>Calf Soreness</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={calfSoreness}
                      onChange={(e) => setCalfSoreness(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${calfSoreness}`}
                    />
                    <div className="slider-labels">
                      <span>Severe</span>
                      <span>None</span>
                    </div>
                  </div>
                </div>

                {/* Shin Soreness */}
                <div className="metric-item">
                  <label>
                    <Activity size={20} className="metric-icon" />
                    <span>Shin Soreness</span>
                  </label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={shinSoreness}
                      onChange={(e) => setShinSoreness(parseInt(e.target.value))}
                      className={`metric-slider slider-value-${shinSoreness}`}
                    />
                    <div className="slider-labels">
                      <span>Severe</span>
                      <span>None</span>
                    </div>
                  </div>
                </div>
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