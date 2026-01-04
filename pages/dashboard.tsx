// pages/dashboard.tsx
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { MoreVertical, Clock, Zap, TrendingUp, RefreshCw } from "lucide-react";

// Import components
import Readiness from "../components/dashboard/Readiness";
import History from "../components/dashboard/History";
import Trends from "../components/dashboard/Trends";

// Types
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  timezone: string;
  created_at: string;
  is_premium: boolean;
}

interface DailyLog {
  id: number;
  created_at: string;
  user_id: string;
  date: string;
  morning_complete: boolean;
  sleep_morning: number | null;
  energy_morning: number | null;
  stress_morning: number | null;
  hydration_morning: number | null;
  nutrition_morning: number | null;
  quad_morning: number | null;
  hamstring_morning: number | null;
  hip_morning: number | null;
  calf_morning: number | null;
  shin_morning: number | null;
  notes_morning: string | null;
  readiness_score: number | null;
}

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("readiness");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Returns userProfile and dailyLogs. Only syncs with supabase if not already stored in sessionStorage.
  const fetchUserData = async () => {
    if (!user) return;

    try {
      setDataLoading(true);

      // Check sessionStorage first!
      const cachedProfile = sessionStorage.getItem('userProfile');
      const cachedLogs = sessionStorage.getItem('dailyLogs');
      
      if (cachedProfile && cachedLogs) {
        setUserProfile(JSON.parse(cachedProfile));
        setDailyLogs(JSON.parse(cachedLogs));
        setDataLoading(false);
        return;
      }

      // Calculate date 31 days ago
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
      const dateThreshold = thirtyOneDaysAgo.toISOString().split('T')[0];

      // Single query to get user profile with their daily logs
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          daily_logs(*)
        `)
        .eq("id", user.id)
        .eq("daily_logs.user_id", user.id)
        .gte("daily_logs.date", dateThreshold)
        .order("date", { referencedTable: "daily_logs", ascending: false })
        .single();

      if (error) throw error;

      // Extract profile and logs
      const { daily_logs, ...profile } = data as any;
      
      setUserProfile(profile);
      setDailyLogs(daily_logs || []);
      
      // Cache in sessionStorage
      sessionStorage.setItem('userProfile', JSON.stringify(profile));
      sessionStorage.setItem('dailyLogs', JSON.stringify(daily_logs || []));

    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear sessionStorage on logout
      sessionStorage.removeItem('userProfile');
      sessionStorage.removeItem('dailyLogs');
      
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Use only for refresh with supabase! Call fetchUserData() for normal data retrieval.
  const refreshUserData = async () => {
    try {
      sessionStorage.removeItem('userProfile');
      sessionStorage.removeItem('dailyLogs');
      fetchUserData() // Will sync with supabase because sessionStorage is removed!
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  }

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Incredibly important when sessionStorage is updated in one of the other tabs!
  const handleTabSwitch = (tab: string) => {
    setActiveTab(tab);
    fetchUserData(); // Just syncs from sessionStorage, not supabase
  };

  // Render the appropriate component based on active tab
  const renderContent = () => {
  if (dataLoading) {
    return <div className="loading-content"></div>;
  }

  const props = { dailyLogs, userProfile, refreshUserData } as any;
  // It is important that this always returns all the tabs so the state is saved between them!
  return (
    <>
      <div style={{ display: activeTab === "history" ? "block" : "none" }}>
        <History {...props} />
      </div>

      <div style={{ display: activeTab === "readiness" ? "block" : "none" }}>
        <Readiness {...props} />
      </div>

      <div style={{ display: activeTab === "trends" ? "block" : "none" }}>
        <Trends {...props} />
      </div>
    </>
  );
};

  return (
    <div className="dashboard-wrapper">
      {/* Top Bar */}
      <div id="topbar">
        <img src="/images/Logo-Mobile.png" alt="Logo" id="mobile" />
        <img src="/images/Logo-Desktop.png" alt="Logo" id="desktop" />
        <div className="menu-container">
          <button onClick={refreshUserData}>
            <RefreshCw size={34} />
          </button>
          <button onClick={toggleMenu}>
            <MoreVertical size={36} />
          </button>
          
          {showMenu && (
            <div className="popup-menu">
              <button onClick={handleLogout}><p>Logout</p></button>
              <button><p>Settings</p></button>
              <button><p>Help & FAQ</p></button>
              <button><p>Contact Us</p></button>
            </div>
          )}
        </div>
      </div>
      <div className="desktop-wrapper">
        {/* Main Content */}
        <div className="main-content">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <button 
            onClick={() => handleTabSwitch("history")}
            className={activeTab === "history" ? "active" : ""}
          >
            <Clock size={20} />
            <span>History</span>
          </button>
          <button 
            onClick={() => handleTabSwitch("readiness")}
            className={activeTab === "readiness" ? "active" : ""}
          >
            <Zap size={20} />
            <span>Readiness</span>
          </button>
          <button 
            onClick={() => handleTabSwitch("trends")}
            className={activeTab === "trends" ? "active" : ""}
          >
            <TrendingUp size={20} />
            <span>Trends</span>
          </button>
        </nav>
      </div>
    </div>
  );
}