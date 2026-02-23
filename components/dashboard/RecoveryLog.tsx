// components/dashboard/RecoveryLog.tsx
import { useState, useContext, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../context/AuthContext";
import { RECOVERY_METRIC_CONFIG, RecoveryActivityOption } from "@/config/metrics";

interface RecoveryLogProps {
  currentDate: string;
  userProfile: any;
  existingLog?: any;
  onComplete: () => void;
}

export default function RecoveryLog({ currentDate, userProfile, existingLog, onComplete }: RecoveryLogProps) {
  const { user } = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Check if training is complete
  const trainingComplete = existingLog?.training_complete === true;

  const [isOpen, setIsOpen] = useState(trainingComplete);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (trainingComplete) setIsOpen(true);
  }, [trainingComplete]);

  // Initialize form state
  const [formState, setFormState] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {};
    Object.entries(RECOVERY_METRIC_CONFIG).forEach(([key, config]) => {
      const dbField = `recovery_${key}`;
      const existingValue = existingLog?.[dbField];
      initialState[key] = existingValue !== undefined && existingValue !== null 
        ? existingValue 
        : config.defaultValue;
    });
    return initialState;
  });

  // Track open dropdowns
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (fieldKey: string) => {
    setOpenDropdowns(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const addMultiselectValue = (fieldKey: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldKey]: [...prev[fieldKey], value]
    }));
    setOpenDropdowns(prev => ({ ...prev, [fieldKey]: false }));
  };

  const removeMultiselectValue = (fieldKey: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldKey]: prev[fieldKey].filter((v: string) => v !== value)
    }));
  };

  const toggleChecklistItem = (value: string) => {
    const currentActivities = formState.activities || [];
    if (currentActivities.includes(value)) {
      setFormState(prev => ({
        ...prev,
        activities: prev.activities.filter((v: string) => v !== value)
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        activities: [...prev.activities, value]
      }));
    }
  };

  const updateFieldValue = (fieldKey: string, value: any) => {
    setFormState(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleClose = () => {
    setIsOpen(false);
    setPage(1);
    setSubmitError("");
    // Reset form state to defaults
    const initialState: Record<string, any> = {};
    Object.entries(RECOVERY_METRIC_CONFIG).forEach(([key, config]) => {
      const dbField = `recovery_${key}`;
      const existingValue = existingLog?.[dbField];
      initialState[key] = existingValue !== undefined && existingValue !== null
        ? existingValue
        : config.defaultValue;
    });
    setFormState(initialState);
    setOpenDropdowns({});
  };

  const handleSubmit = async () => {
    if (!user || !currentDate || isSubmitting) return;

    const hasRecoveryData = (formState.activities?.length ?? 0) > 0 || formState.notes?.trim();
    if (!hasRecoveryData) {
      setSubmitError("Please add at least one activity or notes before submitting.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const logData: any = {
        user_id: user.id,
        date: currentDate,
        recovery_complete: true,
        recovery_activities: formState.activities && formState.activities.length > 0 ? formState.activities : null,
        recovery_notes: formState.notes || null,
      };

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
      
      const index = dailyLogs.findIndex((log: any) => log.id === result.id);
      if (index !== -1) {
        dailyLogs[index] = result;
      } else {
        dailyLogs.unshift(result);
      }
      
      sessionStorage.setItem('dailyLogs', JSON.stringify(dailyLogs));

      setIsOpen(false);
      onComplete();
    } catch (err) {
      console.error("Error submitting recovery data:", err);
      alert("Failed to submit recovery data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get categorized activities
  const getPostTrainingActivities = () => {
    if (!RECOVERY_METRIC_CONFIG.activities.options) return [];
    
    return Object.entries(RECOVERY_METRIC_CONFIG.activities.options)
      .filter(([_, config]: [string, any]) => {
        // Check if user's event types match
        if (!userProfile?.event_types || userProfile.event_types.length === 0) return false;
        if (!config.eventTypes.some((eventType: string) => 
          userProfile.event_types.includes(eventType)
        )) return false;
        
        // Include if category is post_training or both
        return config.category === 'post_training' || config.category === 'both';
      })
      .map(([key, config]) => ({ key, ...config } as RecoveryActivityOption));
  };

  const getAdditionalRecoveryActivities = () => {
    if (!RECOVERY_METRIC_CONFIG.activities.options) return [];
    
    const selectedActivities = formState.activities || [];
    
    return Object.entries(RECOVERY_METRIC_CONFIG.activities.options)
      .filter(([key, config]: [string, any]) => {
        // Check if user's event types match
        if (!userProfile?.event_types || userProfile.event_types.length === 0) return false;
        if (!config.eventTypes.some((eventType: string) => 
          userProfile.event_types.includes(eventType)
        )) return false;
        
        // Already selected
        if (selectedActivities.includes(key)) return false;
        
        // If training is complete, only show additional recovery items
        if (trainingComplete) {
          return config.category === 'additional';
        } else {
          // If training not complete, show both category items (like stretching) and additional
          return config.category === 'both' || config.category === 'additional';
        }
      })
      .map(([key, config]) => ({ key, ...config } as RecoveryActivityOption));
  };

  if (!isOpen) {
    return (
      <div className="main-container closed training-log">
        <div className="training-log-header">
          <span className="training-log-title">Recovery Log</span>
        </div>
        <button className="view-button" onClick={() => setIsOpen(true)}>
          <ChevronDown size={24} />
          Add Recovery Data
          <ChevronDown size={24} />
        </button>
      </div>
    );
  }

  const postTrainingActivities = getPostTrainingActivities();
  const additionalRecoveryActivities = getAdditionalRecoveryActivities();
  const selectedActivities = formState.activities || [];
  const showChecklist = trainingComplete && postTrainingActivities.length > 0;

  // Page 1: Post-training checklist
  if (showChecklist && page === 1) {
    return (
      <div className="main-container recovery-log">
        <div className="training-log-header">
          <span className="training-log-title">Recovery Log</span>
        </div>
        <h3 className="subheading">So you're always at your best!</h3>

        <div className="post-training-section">
          <label className="training-label">Post-Training Checklist</label>
          <div className="checklist-container">
            {postTrainingActivities.map((activity) => {
              const isChecked = selectedActivities.includes(activity.key);
              return (
                <div
                  key={activity.key}
                  className={`checklist-item ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleChecklistItem(activity.key)}
                >
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="checklist-checkbox"
                    />
                  </div>
                  <div className="checklist-content">
                    <span className="checklist-label">{activity.label}</span>
                    {activity.description && (
                      <span className="checklist-description">{activity.description}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="button-group" style={{ justifyContent: 'flex-end' }}>
          <button className="submit-button" onClick={() => setPage(2)}>
            Next
          </button>
        </div>

        <button className="view-button" onClick={handleClose}>
          <ChevronUp size={24} />
          Hide Log
          <ChevronUp size={24} />
        </button>
      </div>
    );
  }

  // Page 2 (or single page when no checklist)
  return (
    <div className="main-container recovery-log">
      <div className="training-log-header">
        <span className="training-log-title">Recovery Log</span>
      </div>
      <h3 className="subheading">So you're always at your best!</h3>

      {(additionalRecoveryActivities.length > 0 || selectedActivities.some((key: string) => {
        const activityEntry = Object.entries(RECOVERY_METRIC_CONFIG.activities.options || {})
          .find(([optKey]) => optKey === key);
        if (!activityEntry) return false;
        const [_, activity] = activityEntry as [string, any];
        return trainingComplete
          ? activity.category === 'additional'
          : activity.category === 'both' || activity.category === 'additional';
      })) && (
        <div className="training-section">
          <label className="training-label">
            {trainingComplete ? "Additional Recovery" : "Recovery Activities"}
          </label>
          <div className="training-types-container">
            {selectedActivities
              .map((key: string) => {
                const activityEntry = Object.entries(RECOVERY_METRIC_CONFIG.activities.options || {})
                  .find(([optKey]) => optKey === key);
                if (!activityEntry) return null;
                const [_k, activity] = activityEntry as [string, any];
                const shouldRender = trainingComplete
                  ? activity.category === 'additional'
                  : activity.category === 'both' || activity.category === 'additional';
                if (!shouldRender) return null;
                const style = {
                  backgroundColor: activity.fillColor || "#567567",
                  color: activity.textColor || "#000000",
                  border: `2px solid ${activity.fillColor || "#567567"}`,
                };
                return (
                  <button
                    key={key}
                    onClick={() => removeMultiselectValue('activities', key)}
                    className="training-type-pill active"
                    style={style}
                  >
                    {activity.label}
                    <X size={16} className="pill-x" />
                  </button>
                );
              })
              .filter(Boolean)}
            {additionalRecoveryActivities.length > 0 && (
              <div
                className="add-pill-wrapper"
                ref={(el) => { dropdownRefs.current['activities'] = el; }}
              >
                <button
                  className="add-pill-button"
                  onClick={() => toggleDropdown('activities')}
                >
                  <Plus size={20} />
                </button>
                {openDropdowns['activities'] && (
                  <div className="pill-dropdown">
                    {additionalRecoveryActivities.map((activity) => (
                      <div
                        key={activity.key}
                        className="pill-dropdown-item"
                        onClick={() => addMultiselectValue('activities', activity.key)}
                      >
                        {activity.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="notes-container">
        <label className="notes-label">
          <span>Recovery Notes</span>
        </label>
        <textarea
          value={formState.notes}
          onChange={(e) => updateFieldValue('notes', e.target.value)}
          className="notes-textarea"
          rows={6}
          placeholder="Add notes about your recovery routine..."
        />
      </div>

      {submitError && (
        <div className="profile-error">{submitError}</div>
      )}

      <div className="button-group" style={!showChecklist ? { justifyContent: 'flex-end' } : undefined}>
        {showChecklist && (
          <button className="back-button" onClick={() => setPage(1)}>
            Back
          </button>
        )}
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      <button className="view-button" onClick={handleClose}>
        <ChevronUp size={24} />
        Hide Log
        <ChevronUp size={24} />
      </button>
    </div>
  );
}