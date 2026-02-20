import { RECOVERY_METRIC_CONFIG, RecoveryActivityOption } from '@/config/metrics';

interface ViewRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any;
  formatDate: (date: string) => string;
  userProfile: any;
}

export default function ViewRecoveryModal({ isOpen, onClose, log, formatDate, userProfile }: ViewRecoveryModalProps) {
  if (!isOpen || !log) return null;

  const trainingComplete = log.training_complete === true;
  const selectedActivities: string[] = log.recovery_activities || [];

  const getPostTrainingActivities = (): RecoveryActivityOption[] => {
    if (!RECOVERY_METRIC_CONFIG.activities.options) return [];

    return Object.entries(RECOVERY_METRIC_CONFIG.activities.options)
      .filter(([_, config]: [string, any]) => {
        if (!userProfile?.event_types || userProfile.event_types.length === 0) return false;
        if (!config.eventTypes.some((eventType: string) =>
          userProfile.event_types.includes(eventType)
        )) return false;
        return config.category === 'post_training' || config.category === 'both';
      })
      .map(([key, config]) => ({ key, ...config } as RecoveryActivityOption));
  };

  const getAdditionalRecoveryActivities = (): RecoveryActivityOption[] => {
    if (!RECOVERY_METRIC_CONFIG.activities.options) return [];

    return Object.entries(RECOVERY_METRIC_CONFIG.activities.options)
      .filter(([key, config]: [string, any]) => {
        if (!userProfile?.event_types || userProfile.event_types.length === 0) return false;
        if (!config.eventTypes.some((eventType: string) =>
          userProfile.event_types.includes(eventType)
        )) return false;
        if (!selectedActivities.includes(key)) return false;
        if (trainingComplete) {
          return config.category === 'additional';
        }
        return config.category === 'both' || config.category === 'additional';
      })
      .map(([key, config]) => ({ key, ...config } as RecoveryActivityOption));
  };

  const postTrainingActivities = getPostTrainingActivities();
  const additionalActivities = getAdditionalRecoveryActivities();
  const notes = log.recovery_notes || null;

  const checkedPostTraining = postTrainingActivities.filter((a) =>
    selectedActivities.includes(a.key)
  );

  const showPostTrainingSection = trainingComplete && checkedPostTraining.length > 0;
  const showAdditionalSection = additionalActivities.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="main-container history-log recovery-overview">
          <div className="main-heading">
            <h1>{formatDate(log.date)}</h1>
          </div>

          {showPostTrainingSection && (
            <div className="recovery-overview-section">
              <h3 className="training-overview-subheading">Post Training Checklist</h3>
              <div className="recovery-checklist-display">
                {checkedPostTraining.map((activity) => (
                  <div key={activity.key} className="recovery-checklist-display-item">
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {}}
                        className="checklist-checkbox"
                      />
                    </div>
                    <span className="recovery-checklist-display-label">{activity.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAdditionalSection && (
            <div className="recovery-overview-section">
              <h3 className="training-overview-subheading">
                {trainingComplete ? 'Additional Recovery' : 'Recovery Activities'}
              </h3>
              <div className="recovery-overview-pills">
                {additionalActivities.map((activity) => {
                  const style = {
                    backgroundColor: activity.fillColor || '#567567',
                    color: activity.textColor || '#000000',
                    border: `2px solid ${activity.fillColor || '#567567'}`,
                  };
                  return (
                    <span key={activity.key} className="training-type-pill active recovery-overview-pill" style={style}>
                      {activity.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {notes && (
            <div className="recovery-overview-section">
              <h3 className="training-overview-subheading">Notes</h3>
              <p className="notes-text">{notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
