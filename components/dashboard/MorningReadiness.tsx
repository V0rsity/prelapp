import { useState, useContext, useMemo } from "react";
import { Moon, BatteryMedium, GlassWater, Beef, Zap, Activity, NotebookPen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../context/AuthContext";
import { calculateReadinessScore } from "../../utils/readinessScore";

// Metric configuration - easy to extend in the future
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
  // Easy to add more metrics here in the future:
  // ankle: {
  //   label: "Ankle Soreness",
  //   eventTypes: ["Runner", "Jumper"],
  // },
};

interface MorningReadinessProps {
  onComplete: () => void;
  currentDate: string;
  userProfile: any;
}

export default function MorningReadiness({ onComplete, currentDate, userProfile }: MorningReadinessProps) {
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

  // Determine which soreness metrics to show based on user's event types
  const visibleSorenessMetrics = useMemo(() => {
    if (!userProfile?.event_types || userProfile.event_types.length === 0) {
      return [];
    }

    const userEventTypes = userProfile.event_types;
    const visible = [];

    for (const [key, config] of Object.entries(METRIC_CONFIG)) {
      // Check if user has any event type that matches this metric
      const shouldShow = config.eventTypes.some(eventType => 
        userEventTypes.includes(eventType)
      );
      
      if (shouldShow) {
        visible.push({ key, ...config });
      }
    }

    return visible;
  }, [userProfile?.event_types]);

  // Map metric keys to their state values and setters
  const metricStateMap: Record<string, { value: number; setter: (value: number) => void }> = {
    quad: { value: quadSoreness, setter: setQuadSoreness },
    hamstring: { value: hamstringSoreness, setter: setHamstringSoreness },
    hip: { value: hipSoreness, setter: setHipSoreness },
    calf: { value: calfSoreness, setter: setCalfSoreness },
    shin: { value: shinSoreness, setter: setShinSoreness },
  };

  const handleFinalSubmit = async () => {
    if (!user || !currentDate || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Build soreness object - only include metrics that are visible
      const sorenessData: Record<string, number | null> = {
        quad: null,
        hamstring: null,
        hip: null,
        calf: null,
        shin: null,
      };

      // Set actual values only for visible metrics
      visibleSorenessMetrics.forEach(({ key }) => {
        sorenessData[key] = metricStateMap[key].value;
      });

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

      const newLog = {
        user_id: user.id,
        date: currentDate,
        morning_complete: true,
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
        <h1>Hi, {userProfile?.first_name || 'there'}!</h1>
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