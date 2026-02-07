// components/dashboard/RecoveryOverview.tsx
import { useState } from "react";
import { SquarePen } from "lucide-react";
import { RECOVERY_METRIC_CONFIG, RecoveryActivityOption } from "@/config/metrics";
import EditRecoveryModal from "./EditRecoveryModal";

interface RecoveryOverviewProps {
  existingLog: any;
  userProfile: any;
  onUpdate: () => void;
  setIsAnyModalOpen?: (isOpen: boolean) => void;
}

export default function RecoveryOverview({ existingLog, userProfile, onUpdate, setIsAnyModalOpen }: RecoveryOverviewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const trainingComplete = existingLog?.training_complete === true;
  const selectedActivities: string[] = existingLog?.recovery_activities || [];

  // --- Activity filtering helpers (mirrors RecoveryLog logic) ---

  const getPostTrainingActivities = (): RecoveryActivityOption[] => {
    if (!RECOVERY_METRIC_CONFIG.activities.options) return [];

    return Object.entries(RECOVERY_METRIC_CONFIG.activities.options)
      .filter(([_, config]: [string, any]) => {
        if (!userProfile?.event_types || userProfile.event_types.length === 0) return false;
        if (!config.eventTypes.some((eventType: string) =>
          userProfile.event_types.includes(eventType)
        )) return false;
        return config.category === "post_training" || config.category === "both";
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
        // Only include items that are actually selected
        if (!selectedActivities.includes(key)) return false;
        // Categorise the same way RecoveryLog does for the "additional" pills section
        if (trainingComplete) {
          return config.category === "additional";
        }
        return config.category === "both" || config.category === "additional";
      })
      .map(([key, config]) => ({ key, ...config } as RecoveryActivityOption));
  };

  // --- Derived display data ---

  const postTrainingActivities = getPostTrainingActivities();
  const additionalActivities = getAdditionalRecoveryActivities();
  const notes = existingLog?.recovery_notes || null;

  // Which post-training items are checked?
  const checkedPostTraining = postTrainingActivities.filter((a) =>
    selectedActivities.includes(a.key)
  );

  // Only show the Post Training Checklist block when training is complete AND
  // at least one post-training activity exists in the config for this user.
  const showPostTrainingSection = trainingComplete && checkedPostTraining.length > 0;

  // Only show the Additional Recovery block when there are selected additional pills.
  const showAdditionalSection = additionalActivities.length > 0;

  // --- Edit button handler ---
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

  // --- Render ---
  return (
    <>
      <div className="main-container recovery-overview">
        {/* Header */}
        <div>
          <div className="training-log-header">
            <h1 className="training-log-title">Today's Recovery</h1>
            <div className="edit-icon-overlay" onClick={handleEditClick}>
              <SquarePen size={24} className="edit-icon" />
            </div>
          </div>

          <h3 className="training-overview-main-subheading">Staying Healthy!</h3>
        </div>

        {/* Post Training Checklist – only when training_complete === true */}
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

        {/* Additional Recovery pills */}
        {showAdditionalSection && (
          <div className="recovery-overview-section">
            <h3 className="training-overview-subheading">
              {trainingComplete ? "Additional Recovery" : "Recovery Activities"}
            </h3>
            <div className="recovery-overview-pills">
              {additionalActivities.map((activity) => {
                const style = {
                  backgroundColor: activity.fillColor || "#567567",
                  color: activity.textColor || "#000000",
                  border: `2px solid ${activity.fillColor || "#567567"}`,
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

        {/* Notes */}
        {notes && (
          <div className="recovery-overview-section">
            <h3 className="training-overview-subheading">Notes</h3>
            <p className="notes-text">{notes}</p>
          </div>
        )}
      </div>

      {/* Edit Recovery Modal */}
      <EditRecoveryModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        log={existingLog}
        userProfile={userProfile}
        onSave={handleModalSave}
      />
    </>
  );
}