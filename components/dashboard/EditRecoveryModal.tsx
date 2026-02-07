// components/dashboard/EditRecoveryModal.tsx
import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { RECOVERY_METRIC_CONFIG, RecoveryActivityOption } from "@/config/metrics";

interface EditRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  userProfile: any;
  onSave: () => void;
}

export default function EditRecoveryModal({ isOpen, onClose, log, userProfile, onSave }: EditRecoveryModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if training is complete
  const trainingComplete = log?.training_complete === true;

  // Dynamic form state based on config
  const [formState, setFormState] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {};
    Object.entries(RECOVERY_METRIC_CONFIG).forEach(([key, config]) => {
      const dbField = `recovery_${key}`;
      const existingValue = log?.[dbField];
      initialState[key] = existingValue !== undefined && existingValue !== null 
        ? existingValue 
        : config.defaultValue;
    });
    return initialState;
  });

  // Track open dropdowns
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset form state whenever modal opens or log changes
  useEffect(() => {
    if (isOpen && log) {
      const initialState: Record<string, any> = {};
      Object.entries(RECOVERY_METRIC_CONFIG).forEach(([key, config]) => {
        const dbField = `recovery_${key}`;
        const existingValue = log[dbField];
        initialState[key] = existingValue !== undefined && existingValue !== null 
          ? existingValue 
          : config.defaultValue;
      });
      setFormState(initialState);
      setCurrentPage(1); // Reset to first page
      setOpenDropdowns({}); // Close any open dropdowns
    }
  }, [isOpen, log]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

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

  const handleUpdate = async () => {
    if (!log || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const logData: any = {
        recovery_complete: true,
        recovery_activities: formState.activities && formState.activities.length > 0 ? formState.activities : null,
        recovery_notes: formState.notes || null,
      };

      // Update in Supabase
      const { data, error } = await supabase
        .from("daily_logs")
        .update(logData)
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
      console.error("Error updating recovery data:", err);
      alert("Failed to update recovery data. Please try again.");
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

  if (!isOpen || !log) return null;

  const postTrainingActivities = getPostTrainingActivities();
  const additionalRecoveryActivities = getAdditionalRecoveryActivities();
  const selectedActivities = formState.activities || [];

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
            <h1>Edit Recovery</h1>
            <h3>Update your recovery activities.</h3>
          </div>

          {/* Page 1: Recovery Activities */}
          {currentPage === 1 && (
            <div className="training-page">
              {trainingComplete && postTrainingActivities.length > 0 && (
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
              )}

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
                        // Find the activity in all options
                        const activityEntry = Object.entries(RECOVERY_METRIC_CONFIG.activities.options || {})
                          .find(([optKey]) => optKey === key);
                        
                        if (!activityEntry) return null;
                        
                        const [optKey, activity] = activityEntry as [string, any];
                        
                        // Only render if it's in the additional recovery category for current state
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

              <div className="button-group">
                <button 
                  className="submit-button next-button" 
                  onClick={() => setCurrentPage(2)}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Page 2: Notes */}
          {currentPage === 2 && (
            <div className="training-page">
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

              <div className="button-group">
                <button className="back-button" onClick={() => setCurrentPage(1)}>
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