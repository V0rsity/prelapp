// components/dashboard/Readiness.tsx
import { useState, useEffect } from "react";
import MorningReadiness from "./MorningReadiness";
import MorningOverview from "./MorningOverview";
import TrainingLog from "./TrainingLog";
import TrainingOverview from "./TrainingOverview";
import RecoveryLog from "./RecoveryLog";

interface Props {
  dailyLogs: any[];
  userProfile: any;
  refreshUserData: () => void;
  setIsAnyModalOpen?: (isOpen: boolean) => void;
}

export default function Readiness({ dailyLogs, userProfile, refreshUserData, setIsAnyModalOpen }: Props) {
  const [showOverview, setShowOverview] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [hasCheckedToday, setHasCheckedToday] = useState(false);
  const [todaysLog, setTodaysLog] = useState<any>(null);

  useEffect(() => {
    calculateCurrentDate();
  }, [userProfile]);

  useEffect(() => {
    if (!currentDate) return;

    setHasCheckedToday(false);
    checkForTodaysLog();
  }, [currentDate, dailyLogs]);

  const calculateCurrentDate = () => {
    const timezone =
      userProfile?.timezone ||
      JSON.parse(sessionStorage.getItem("userProfile") || "{}").timezone ||
      "UTC";

    const now = new Date();

    const dateInTimezone = now.toLocaleDateString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    const [month, day, year] = dateInTimezone.split("/");
    const dateString = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    setCurrentDate(dateString);

    const displayDate = now.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    setFormattedDate(displayDate);
  };

  const checkForTodaysLog = () => {
    if (!currentDate || !dailyLogs) return;

    const log = dailyLogs.find(log => log.date === currentDate);
    setTodaysLog(log || null);
    
    // Show overview if log exists AND morning_complete is true
    setShowOverview(!!(log && log.morning_complete));
    setHasCheckedToday(true);
  };

  const handleMorningComplete = () => {
    setShowOverview(true);
    // Trigger refresh after completion
    if (refreshUserData) {
      refreshUserData();
    }
  };

  // Determine if training is complete
  const isTrainingComplete = todaysLog?.training_complete === true;

  return (
    <div className="readiness-wrapper">
      <div className="date-container">
        {formattedDate || ""}
      </div>

      {hasCheckedToday && !showOverview && (
        <MorningReadiness
          onComplete={handleMorningComplete}
          currentDate={currentDate}
          userProfile={userProfile}
          existingLog={todaysLog}
        />
      )}

      {hasCheckedToday && showOverview && (
        <MorningOverview 
          currentDate={currentDate} 
          dailyLogs={dailyLogs} 
          userProfile={userProfile} 
          refreshUserData={refreshUserData}
          setIsAnyModalOpen={setIsAnyModalOpen}
        />
      )}

      {/* Conditionally render TrainingLog or TrainingOverview */}
      {!isTrainingComplete ? (
        <TrainingLog
          currentDate={currentDate}
          userProfile={userProfile}
          existingLog={todaysLog}
          onComplete={() => refreshUserData && refreshUserData()}
        />
      ) : (
        <TrainingOverview
          existingLog={todaysLog}
          userProfile={userProfile}
          dailyLogs={dailyLogs}
          onUpdate={refreshUserData}
          setIsAnyModalOpen={setIsAnyModalOpen}
        />
      )}

      <RecoveryLog
        currentDate={currentDate}
        userProfile={userProfile}
        existingLog={todaysLog}
        onComplete={() => refreshUserData && refreshUserData()}
      />

      {!hasCheckedToday && <div className="loading"></div>}
    </div>
  );
}