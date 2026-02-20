import { TRAINING_METRIC_CONFIG, shouldShowField } from '@/config/metrics';

interface ViewTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  formatDate: (date: string) => string;
  userProfile: any;
}

export default function ViewTrainingModal({ isOpen, onClose, log, formatDate, userProfile }: ViewTrainingModalProps) {
  if (!isOpen || !log) return null;

  // Build form state for dependency checking
  const formState: Record<string, any> = {};
  Object.entries(TRAINING_METRIC_CONFIG).forEach(([key, config]) => {
    formState[key] = log[`training_${key}`] ?? config.defaultValue;
  });

  // Intensity
  const intensityValue = log.training_intensity;
  const intensityOption = intensityValue
    ? TRAINING_METRIC_CONFIG.intensity.options[intensityValue as keyof typeof TRAINING_METRIC_CONFIG.intensity.options]
    : null;

  const renderMultiselectField = (fieldKey: string) => {
    const config = TRAINING_METRIC_CONFIG[fieldKey as keyof typeof TRAINING_METRIC_CONFIG];
    if (!config || config.inputType !== 'multiselect') return null;
    if (!('options' in config)) return null;

    const values = log[`training_${fieldKey}`] || [];
    if (values.length === 0) return null;
    if (!shouldShowField(fieldKey, formState)) return null;

    const availableOptions = Object.entries(config.options).filter(([_, optConfig]: [string, any]) => {
      if (!userProfile?.event_types || userProfile.event_types.length === 0) return false;
      if ('eventTypes' in optConfig) {
        return optConfig.eventTypes.some((et: string) => userProfile.event_types.includes(et));
      }
      return true;
    });

    const isDependent = 'dependsOn' in config && config.dependsOn;

    if (isDependent) {
      return values.map((valueKey: string) => {
        const optConfig = config.options[valueKey as keyof typeof config.options];
        if (!optConfig || typeof optConfig !== 'object' || !('label' in optConfig)) return null;
        const label = (optConfig as { label: string }).label;
        if (!availableOptions.some(([k]) => k === valueKey)) return null;
        return (
          <div className="workout-sub-item" key={`${fieldKey}-${valueKey}`}>
            <span className="workout-sub-bullet">•</span>
            <span className="workout-detail-text">{label}</span>
          </div>
        );
      });
    }

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
              if (!optConfig || typeof optConfig !== 'object' || !('label' in optConfig)) return null;
              const label = (optConfig as { label: string }).label;
              if (!availableOptions.some(([k]) => k === valueKey)) return null;
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

  const renderNumericField = (fieldKey: string) => {
    const config = TRAINING_METRIC_CONFIG[fieldKey as keyof typeof TRAINING_METRIC_CONFIG];
    if (!config || config.inputType !== 'mileage') return null;

    const value = log[`training_${fieldKey}`];
    if (!value) return null;
    if (!shouldShowField(fieldKey, formState)) return null;

    let displayValue = value;
    let unitLabel = '';
    if ('mileageConfig' in config) {
      displayValue = parseFloat(value).toFixed(config.mileageConfig.decimalPlaces);
      unitLabel = ('unitLabel' in config ? config.unitLabel : '') || '';
    }

    const isDependent = 'dependsOn' in config && config.dependsOn;

    if (isDependent) {
      return (
        <div className="workout-sub-item" key={fieldKey}>
          <span className="workout-sub-bullet">•</span>
          <span className="workout-detail-text">{displayValue} {unitLabel}</span>
        </div>
      );
    }

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

  const renderDependentsForValue = (parentFieldKey: string, parentValue: string) => {
    const dependentFields = Object.keys(TRAINING_METRIC_CONFIG).filter(key => {
      const config = TRAINING_METRIC_CONFIG[key as keyof typeof TRAINING_METRIC_CONFIG];
      if (!('dependsOn' in config) || !config.dependsOn) return false;
      const dependsOn = config.dependsOn as { field: string; values: readonly string[] };
      return dependsOn.field === parentFieldKey && (dependsOn.values as readonly string[]).includes(parentValue);
    });

    return dependentFields.map(depKey => {
      const depConfig = TRAINING_METRIC_CONFIG[depKey as keyof typeof TRAINING_METRIC_CONFIG];
      if (depConfig.inputType === 'multiselect') return renderMultiselectField(depKey);
      if (depConfig.inputType === 'mileage') return renderNumericField(depKey);
      return null;
    }).filter(Boolean);
  };

  const renderTrainingTypes = () => {
    const config = TRAINING_METRIC_CONFIG.types;
    const types = log.training_types || [];
    if (types.length === 0) return null;

    return types.map((typeKey: string) => {
      const typeConfig = config.options[typeKey as keyof typeof config.options];
      if (!typeConfig || typeof typeConfig !== 'object' || !('label' in typeConfig)) return null;
      const label = (typeConfig as { label: string }).label;
      if ('eventTypes' in typeConfig && userProfile?.event_types) {
        const eventTypes = (typeConfig as { eventTypes: readonly string[] }).eventTypes;
        if (!eventTypes.some((et: string) => userProfile.event_types.includes(et))) return null;
      }
      return (
        <div key={typeKey}>
          <div className="workout-item">
            <span className="workout-bullet">•</span>
            <span className="workout-item-type">{label}</span>
          </div>
          {renderDependentsForValue('types', typeKey)}
        </div>
      );
    }).filter(Boolean);
  };

  const workoutDetailFields = Object.keys(TRAINING_METRIC_CONFIG).filter(key => {
    const config = TRAINING_METRIC_CONFIG[key as keyof typeof TRAINING_METRIC_CONFIG];
    return (
      key !== 'types' &&
      key !== 'intensity' &&
      key !== 'notes' &&
      (config.inputType === 'multiselect' || config.inputType === 'mileage')
    );
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="main-container history-log training-history">
          <div className="main-heading">
            <h1>{formatDate(log.date)}</h1>
          </div>

          {intensityOption && (
            <div className="training-intensity-badge">
              <span className="readiness-label">Training Intensity</span>
              <div className="training-intensity-indicator">
                <div className="training-intensity-dot" style={{ backgroundColor: intensityOption.color }}></div>
                <span className="training-intensity-name">{intensityOption.label}</span>
              </div>
            </div>
          )}

          <div>
            <h3 className="training-overview-subheading">Workout</h3>
            <div className="workout-list">
              {renderTrainingTypes()}
              {workoutDetailFields.map(fieldKey => {
                const config = TRAINING_METRIC_CONFIG[fieldKey as keyof typeof TRAINING_METRIC_CONFIG];
                const isDependent = 'dependsOn' in config && config.dependsOn;
                if (isDependent) return null;
                return (
                  <div key={fieldKey}>
                    {config.inputType === 'multiselect'
                      ? renderMultiselectField(fieldKey)
                      : renderNumericField(fieldKey)}
                  </div>
                );
              })}
            </div>
          </div>

          {log.training_notes && (
            <div>
              <h3 className="training-overview-subheading">Notes</h3>
              <p className="notes-text">{log.training_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
