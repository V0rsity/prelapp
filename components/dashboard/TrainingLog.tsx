import { useState, useEffect, useMemo } from "react";

interface Props {
  dailyLogs: any[];
  userProfile: any;
  currentDate: string;
  refreshUserData?: () => void;
}

