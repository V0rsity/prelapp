import { useState, useContext } from "react";
import { Moon, BatteryMedium, GlassWater, Beef, Zap, Activity, NotebookPen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../context/AuthContext";
import { calculateReadinessScore } from "../../utils/readinessScore";


interface MorningReadinessProps {
  onComplete: () => void;
  currentDate: string;
}

export default function MorningReadiness({ onComplete, currentDate }: MorningReadinessProps) {
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All state in one place
  const [sleep, setSleep] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [hydration, setHydration] = useState(3);
  const [nutrition, setNutrition] = useState(3);
  const [quadSoreness, setQuadSoreness] = useState(3);
  const [hamstringSoreness, setHamstringSoreness] = useState(3);
  const [hipSoreness, setHipSoreness] = useState(3);
  const [calfSoreness, setCalfSoreness] = useState(3);
  const [shinSoreness, setShinSoreness] = useState(3);
  const [notes, setNotes] = useState("");

  const handleFinalSubmit = async () => {
    if (!user || !currentDate || isSubmitting) return;

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

      const newLog = {
        user_id: user.id,
        date: currentDate,
        morning_complete: true,
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
        readiness_score: readinessScore, // Calculate this if needed
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from("daily_logs")
        .insert(newLog)
        .select()
        .single();

      if (error) throw error;

      // Update sessionStorage
      const cachedLogs = sessionStorage.getItem('dailyLogs');
      const dailyLogs = cachedLogs ? JSON.parse(cachedLogs) : [];
      
      // Add new log to the beginning of the array
      dailyLogs.unshift(data);
      sessionStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));

      // Call onComplete to show overview
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
        <h1>Hi, Luke!</h1>
        <h3>How are you feeling this morning?</h3>
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
                <span>Stress Level</span>
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
                  <span>Low</span>
                  <span>High</span>
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
              <span>Notes (Optional)</span>
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
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}