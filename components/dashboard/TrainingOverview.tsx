// components/dashboard/TrainingOverview.tsx
import { useState } from "react";
import { SquarePen, ChevronDown, ChevronUp } from "lucide-react";
import { TRAINING_METRIC_CONFIG, shouldShowField } from "@/config/metrics";
import EditTrainingModal from "./EditTrainingModal";

interface TrainingOverviewProps {
  existingLog: any;
  userProfile: any;
  dailyLogs: any[];
  onUpdate: () => void;
  setIsAnyModalOpen?: (isOpen: boolean) => void;
}

export default function TrainingOverview({ existingLog, userProfile, dailyLogs, onUpdate, setIsAnyModalOpen }: TrainingOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Build form state from existing log for dependency checking
  const formState: Record<string, any> = {};
  Object.entries(TRAINING_METRIC_CONFIG).forEach(([key, config]) => {
    const dbField = `training_${key}`;
    formState[key] = existingLog?.[dbField] ?? config.defaultValue;
  });

  // Get last 7 days of intensity data
  const getLast7DaysIntensity = () => {
    const today = new Date(existingLog.date);
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const log = dailyLogs.find(log => log.date === dateString);
      const intensity = log?.training_intensity;
      
      const intensityConfig = TRAINING_METRIC_CONFIG.intensity;
      let color = null;
      if (intensity && 'options' in intensityConfig && intensityConfig.options) {
        const option = intensityConfig.options[intensity as keyof typeof intensityConfig.options];
        color = option?.color || null;
      }
      
      last7Days.push({
        date: dateString,
        intensity: intensity,
        color: color,
        isToday: i === 0
      });
    }
    
    return last7Days;
  };

  // Calculate consistency stats from daily logs
  const getConsistencyStats = () => {
    const today = new Date(existingLog.date);
    
    // Get current streak
    let currentStreak = 0;
    for (let i = 0; i >= -365; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const log = dailyLogs.find(log => log.date === dateString);
      if (log?.training_complete) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Get past 7 days count
    let past7DaysCount = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const log = dailyLogs.find(log => log.date === dateString);
      if (log?.training_complete) {
        past7DaysCount++;
      }
    }
    
    // Get past 30 days count
    let past30DaysCount = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const log = dailyLogs.find(log => log.date === dateString);
      if (log?.training_complete) {
        past30DaysCount++;
      }
    }
    
    return {
      streak: currentStreak,
      past7Days: past7DaysCount,
      past30Days: past30DaysCount
    };
  };

  // Helper function to get intensity data
  const getIntensityData = () => {
    const intensityValue = existingLog?.training_intensity;
    if (!intensityValue) return null;
    
    const intensityConfig = TRAINING_METRIC_CONFIG.intensity;
    if (!('options' in intensityConfig)) return null;
    
    const option = intensityConfig.options[intensityValue as keyof typeof intensityConfig.options];
    return option || null;
  };

  // Generic function to render multiselect field data
  const renderMultiselectField = (fieldKey: string) => {
    const config = TRAINING_METRIC_CONFIG[fieldKey as keyof typeof TRAINING_METRIC_CONFIG];
    if (!config || config.inputType !== 'multiselect') return null;
    if (!('options' in config)) return null;

    const dbField = `training_${fieldKey}`;
    const values = existingLog?.[dbField] || [];
    if (values.length === 0) return null;

    // Check if field should be shown based on dependencies
    if (!shouldShowField(fieldKey, formState)) return null;

    // Filter options by user event types if applicable
    const availableOptions = Object.entries(config.options).filter(([_, optConfig]: [string, any]) => {
      if (!userProfile?.event_types || userProfile.event_types.length === 0) return false;
      if ('eventTypes' in optConfig) {
        return optConfig.eventTypes.some((eventType: string) => 
          userProfile.event_types.includes(eventType)
        );
      }
      return true;
    });

    // Check if this is a dependent field
    const isDependent = 'dependsOn' in config && config.dependsOn;

    // For dependent fields, render as sub-items without the field label
    if (isDependent) {
      return values.map((valueKey: string) => {
        const optConfig = config.options[valueKey as keyof typeof config.options];
        if (!optConfig || typeof optConfig !== 'object') return null;
        if (!('label' in optConfig)) return null;
        const label = (optConfig as { label: string }).label;

        // Check if this option is available to the user
        const isAvailable = availableOptions.some(([key]) => key === valueKey);
        if (!isAvailable) return null;

        return (
          <div className="workout-sub-item" key={`${fieldKey}-${valueKey}`}>
            <span className="workout-sub-bullet">•</span>
            <span className="workout-detail-text">{label}</span>
          </div>
        );
      });
    }

    // For non-dependent fields, render normally with label
    return (
      <div className="workout-item" key={fieldKey}>
        <span className="workout-bullet">•</span>
        <div className="workout-item-content">
          <span className="workout-item-type">
            {config.label.replace(/\s*\(.*?\)\s*/g, '').trim()}
          </span>
          <div className="workout-item-details">
            {values.map((valueKey: string, index: number) => {
              const optConfig = config.options[valueKey as keyof typeof config.options];
              if (!optConfig || typeof optConfig !== 'object') return null;
              if (!('label' in optConfig)) return null;
              const label = (optConfig as { label: string }).label;

              // Check if this option is available to the user
              const isAvailable = availableOptions.some(([key]) => key === valueKey);
              if (!isAvailable) return null;

              return (
                <span key={valueKey}>
                  {index > 0 && <span className="workout-detail-separator">—</span>}
                  <span className="workout-detail-text">{label}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Generic function to render mileage/number fields
  const renderNumericField = (fieldKey: string) => {
    const config = TRAINING_METRIC_CONFIG[fieldKey as keyof typeof TRAINING_METRIC_CONFIG];
    if (!config || (config.inputType !== 'mileage')) return null;

    const dbField = `training_${fieldKey}`;
    const value = existingLog?.[dbField];
    if (!value) return null;

    // Check if field should be shown based on dependencies
    if (!shouldShowField(fieldKey, formState)) return null;

    let displayValue = value;
    let unitLabel = '';

    if (config.inputType === 'mileage' && 'mileageConfig' in config) {
      displayValue = parseFloat(value).toFixed(config.mileageConfig.decimalPlaces);
      unitLabel = config.unitLabel || '';
    }

    // Check if this is a dependent field
    const isDependent = 'dependsOn' in config && config.dependsOn;

    // For dependent fields, render as sub-item without the field label
    if (isDependent) {
      return (
        <div className="workout-sub-item" key={fieldKey}>
          <span className="workout-sub-bullet">•</span>
          <span className="workout-detail-text">{displayValue} {unitLabel}</span>
        </div>
      );
    }

    // For non-dependent fields, render normally with label
    return (
      <div className="workout-item" key={fieldKey}>
        <span className="workout-bullet">•</span>
        <div className="workout-item-content">
          <span className="workout-item-type">
            {config.label.replace(/\s*\(.*?\)\s*/g, '').trim()}
          </span>
          <div className="workout-item-details">
            <span className="workout-detail-text">{displayValue} {unitLabel}</span>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to render a field with all its dependent fields
  const renderFieldWithDependents = (fieldKey: string) => {
    const config = TRAINING_METRIC_CONFIG[fieldKey as keyof typeof TRAINING_METRIC_CONFIG];
    
    // Render the main field
    let mainOutput = null;
    if (fieldKey === 'types') {
      // Training types are rendered differently
      const types = existingLog?.training_types || [];
      if (types.length > 0 && 'options' in config && config.options) {
        mainOutput = types.map((typeKey: string) => {
          const typeConfig = config.options?.[typeKey as keyof typeof config.options];
          if (!typeConfig || typeof typeConfig !== 'object') return null;
          
          // Type guard to ensure we have a label property
          if (!('label' in typeConfig)) return null;
          const label = (typeConfig as { label: string }).label;

          // Check if this type is available to the user
          if ('eventTypes' in typeConfig && userProfile?.event_types) {
            const eventTypes = (typeConfig as { eventTypes: string[] }).eventTypes;
            const isAvailable = eventTypes.some((eventType: string) => 
              userProfile.event_types.includes(eventType)
            );
            if (!isAvailable) return null;
          }

          return (
            <div key={typeKey}>
              <div className="workout-item">
                <span className="workout-bullet">•</span>
                <span className="workout-item-type">{label}</span>
              </div>
              {/* Render dependents for this specific type value */}
              {renderDependentsForValue('types', typeKey)}
            </div>
          );
        }).filter(Boolean);
      }
    } else if (config.inputType === 'multiselect') {
      mainOutput = renderMultiselectField(fieldKey);
    } else if (config.inputType === 'mileage') {
      mainOutput = renderNumericField(fieldKey);
    }
    
    return mainOutput;
  };

  // Helper function to render dependent fields for a specific parent field value
  const renderDependentsForValue = (parentFieldKey: string, parentValue: string) => {
    // Find all fields that depend on this parent field and value
    const dependentFields = Object.keys(TRAINING_METRIC_CONFIG).filter(key => {
      const config = TRAINING_METRIC_CONFIG[key as keyof typeof TRAINING_METRIC_CONFIG];
      if (!('dependsOn' in config) || !config.dependsOn) return false;
      const dependsOn = config.dependsOn as { field: string; values: readonly string[] };
      return dependsOn.field === parentFieldKey && (dependsOn.values as readonly string[]).includes(parentValue);
    });
    
    return dependentFields.map(depKey => {
      const depConfig = TRAINING_METRIC_CONFIG[depKey as keyof typeof TRAINING_METRIC_CONFIG];
      if (depConfig.inputType === 'multiselect') {
        return renderMultiselectField(depKey);
      } else if (depConfig.inputType === 'mileage') {
        return renderNumericField(depKey);
      }
      return null;
    }).filter(Boolean);
  };

  // Helper function to render notes
  const renderNotes = () => {
    const notes = existingLog?.training_notes;
    if (!notes) return null;

    return (
      <div>
        <h3 className="training-overview-subheading">Notes</h3>
        <p className="notes-text">{notes}</p>
      </div>
    );
  };

  // Get all workout detail fields (exclude intensity, types, and notes as they have special rendering)
  const getWorkoutDetailFields = () => {
    return Object.keys(TRAINING_METRIC_CONFIG).filter(key => {
      const config = TRAINING_METRIC_CONFIG[key as keyof typeof TRAINING_METRIC_CONFIG];
      // Include multiselect and numeric fields, but exclude types, intensity, and notes
      return (
        key !== 'types' && 
        key !== 'intensity' && 
        key !== 'notes' &&
        (config.inputType === 'multiselect' || 
         config.inputType === 'mileage')
      );
    });
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
    setIsAnyModalOpen?.(true); 
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setIsAnyModalOpen?.(false);
  };

  const handleModalSave = () => {
    onUpdate();
    setIsAnyModalOpen?.(false);
  };

  const intensityData = getIntensityData();
  const workoutDetailFields = getWorkoutDetailFields();
  const last7Days = getLast7DaysIntensity();
  const consistencyStats = getConsistencyStats();

  // Collapsed view
  if (!isExpanded) {
    return (
      <>
        <div className="main-container training-overview collapsed">
          <div>
            <div className="training-log-header">
              <h1 className="training-log-title">Today's Training</h1>
              <div className="edit-icon-overlay" onClick={handleEditClick}>
                <SquarePen size={24} className="edit-icon" />
              </div>
            </div>
            
            <h3 className="training-overview-main-subheading">Getting better every day!</h3>
          </div>

          {/* Consistency Section */}
          <div className="consistency-section">
            <div className="consistency-grid">
              <div className="consistency-item">
                <div className="consistency-value">{consistencyStats.streak}</div>
                <div className="consistency-label">{consistencyStats.streak === 1 ? 'Day' : 'Days'} Streak</div>
              </div>
              <div className="consistency-item">
                <div className="consistency-value">{consistencyStats.past7Days} / 7</div>
                <div className="consistency-label">Past 7 days</div>
              </div>
              <div className="consistency-item">
                <div className="consistency-value">{consistencyStats.past30Days}/30</div>
                <div className="consistency-label">Past 30 days</div>
              </div>
            </div>
          </div>

          {/* Intensity Section with 7 day boxes */}
          <div className="intensity-container">
            <div className="intensity-header-row">
              <h3 className="training-overview-subheading">Intensity</h3>
              {intensityData && (
                <div className="intensity-label-row">
                  <div 
                    className="intensity-color-dot" 
                    style={{ backgroundColor: intensityData.color }}
                  ></div>
                  <span className="intensity-label">{intensityData.label}</span>
                </div>
              )}
            </div>
            <div className="intensity-7day-grid">
              {last7Days.map((day, index) => (
                <div 
                  key={day.date}
                  className="intensity-day-box"
                  style={{ 
                    backgroundColor: day.color || 'rgba(255, 255, 255, 0.15)'
                  }}
                ></div>
              ))}
            </div>
            <div className="intensity-footer-row">
              <div className="intensity-timeline">Last 7 days</div>
              <div className="intensity-today-arrow"><ChevronUp size={16} strokeWidth={3}/><div className="intensity-timeline">Today</div></div>
            </div>
          </div>

          {/* View Button */}
          <button className="view-button" onClick={() => setIsExpanded(true)}>
            <ChevronDown size={24} />
            View Workout
            <ChevronDown size={24} />
          </button>
        </div>

        {/* Edit Training Modal */}
        <EditTrainingModal
          isOpen={isEditModalOpen}
          onClose={handleModalClose}
          log={existingLog}
          userProfile={userProfile}
          onSave={handleModalSave}
        />
      </>
    );
  }

  // Expanded view
  return (
    <>
      <div className="main-container training-overview expanded">
        <div>
          <div className="training-log-header">
            <h1 className="training-log-title">Today's Training</h1>
            <div className="edit-icon-overlay" onClick={handleEditClick}>
              <SquarePen size={24} className="edit-icon" />
            </div>
          </div>
          
          <h3 className="training-overview-main-subheading">Getting better every day!</h3>
        </div>
        {/* Consistency Section */}
        <div className="consistency-section">
          <div className="consistency-grid">
            <div className="consistency-item">
              <div className="consistency-value">{consistencyStats.streak}</div>
              <div className="consistency-label">{consistencyStats.streak === 1 ? 'Day' : 'Days'} Streak</div>
            </div>
            <div className="consistency-item">
              <div className="consistency-value">{consistencyStats.past7Days} / 7</div>
              <div className="consistency-label">Past 7 days</div>
            </div>
            <div className="consistency-item">
              <div className="consistency-value">{consistencyStats.past30Days} / 30</div>
              <div className="consistency-label">Past 30 days</div>
            </div>
          </div>
        </div>

        {/* Intensity Section with 7 day boxes */}
        <div className="intensity-container">
          <div className="intensity-header-row">
            <h3 className="training-overview-subheading">Intensity</h3>
            {intensityData && (
              <div className="intensity-label-row">
                <div 
                  className="intensity-color-dot" 
                  style={{ backgroundColor: intensityData.color }}
                ></div>
                <span className="intensity-label">{intensityData.label}</span>
              </div>
            )}
          </div>
          <div className="intensity-7day-grid">
            {last7Days.map((day, index) => (
              <div 
                key={day.date}
                className="intensity-day-box"
                style={{ 
                  backgroundColor: day.color || 'rgba(255, 255, 255, 0.15)'
                }}
              ></div>
            ))}
          </div>
          <div className="intensity-footer-row">
            <div className="intensity-timeline">Last 7 days</div>
            <div className="intensity-today-arrow"><ChevronUp size={16} strokeWidth={3}/><div className="intensity-timeline">Today</div></div>
          </div>
        </div>

        {/* Today's Workout Section */}
        <div>
          <h3 className="training-overview-subheading">Workout</h3>
          <div className="workout-list">
            {/* Render training types with their dependents */}
            {renderFieldWithDependents('types')}
            
            {/* Render other fields that are not dependent and not types */}
            {workoutDetailFields.map(fieldKey => {
              const config = TRAINING_METRIC_CONFIG[fieldKey as keyof typeof TRAINING_METRIC_CONFIG];
              
              // Skip dependent fields - they're rendered by their parent
              const isDependent = 'dependsOn' in config && config.dependsOn;
              if (isDependent) return null;
              
              return (
                <div key={fieldKey}>
                  {renderFieldWithDependents(fieldKey)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes Section */}
        {renderNotes()}

        {/* Hide Button */}
        <button className="view-button" onClick={() => setIsExpanded(false)}>
          <ChevronUp size={24} />
          Hide Workout
          <ChevronUp size={24} />
        </button>
      </div>

      {/* Edit Training Modal */}
      <EditTrainingModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        log={existingLog}
        userProfile={userProfile}
        onSave={handleModalSave}
      />
    </>
  );
}