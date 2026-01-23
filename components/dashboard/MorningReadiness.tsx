import { useState, useContext, useMemo } from "react";
import { Moon, BatteryMedium, GlassWater, Beef, Zap, Activity, NotebookPen } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../context/AuthContext";
import { calculateReadinessScore } from "../../utils/readinessScore";
import { SORENESS_METRIC_CONFIG, SorenessMetricKey } from "@/config/metrics";

interface MorningReadinessProps {
  onComplete: () => void;
  currentDate: string;
  userProfile: any;
}

export default function MorningReadiness({ onComplete, currentDate, userProfile }: MorningReadinessProps) {
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // General readiness state
  const [sleep, setSleep] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [hydration, setHydration] = useState(3);
  const [nutrition, setNutrition] = useState(3);
  const [notes, setNotes] = useState("");

  // Dynamic soreness state - automatically includes all metrics from config
  const [sorenessValues, setSorenessValues] = useState<Record<SorenessMetricKey, number>>(() => {
    const initial: Record<string, number> = {};
    Object.keys(SORENESS_METRIC_CONFIG).forEach(key => {
      initial[key] = 3;
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
        sleep,
        energy,
        stress,
        hydration,
        nutrition,
        ...sorenessData
      };

      const readinessScore = calculateReadinessScore(readinessParams);

      // Build the database log object dynamically
      const newLog: any = {
        user_id: user.id,
        date: currentDate,
        morning_complete: true,
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
        newLog[`${key}_morning`] = value;
      });

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
      
      dailyLogs.unshift(data);
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
        <h3>How are you feeling this morning?</h3>
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
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}