import { useState, useEffect } from "react";
import MorningReadiness from "./MorningReadiness";
import MorningOverview from "./MorningOverview";

interface Props {
  dailyLogs: any[];
  userProfile: any;
  refreshUserData?: () => void; // Add this
}

export default function Readiness({ dailyLogs, userProfile, refreshUserData }: Props) {
  const [showOverview, setShowOverview] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [formattedDate, setFormattedDate] = useState("");
  const [hasCheckedToday, setHasCheckedToday] = useState(false);

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

    const todaysLog = dailyLogs.find(log => log.date === currentDate);
    setShowOverview(!!todaysLog);
    setHasCheckedToday(true);
  };

  const handleMorningComplete = () => {
    setShowOverview(true);
    // Trigger refresh after completion
    if (refreshUserData) {
      refreshUserData();
    }
  };

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
        />
      )}

      {hasCheckedToday && showOverview && (
        <MorningOverview currentDate={currentDate} dailyLogs={dailyLogs} userProfile={userProfile}/>
      )}

      {!hasCheckedToday && <div className="loading"></div>}

    </div>
  );
}
