import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { AuthContext } from "../context/AuthContext";

interface Metric {
  name: string;
  value: number;
}

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    // Only redirect if auth has finished loading and user is null
    if (!loading && !user) {
      router.push("/");
      return;
    }

    // Fetch metrics only if user exists
    if (user) {
      const fetchMetrics = async () => {
        try {
          const snapshot = await getDocs(
            collection(db, "users", user.uid, "dailyReadiness")
          );

          const data: Metric[] = [];
          snapshot.forEach((doc) => {
            const d = doc.data();
            data.push({ name: "Example Metric", value: d?.morning?.energy || 0 });
          });

          setMetrics(data);
        } catch (err) {
          console.error("Failed to fetch metrics:", err);
        }
      };

      fetchMetrics();
    }
  }, [user, loading, router]);

  // Show loading until Firebase auth finishes
  if (loading || !user) return <div>Loading...</div>;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); // redirect to landing page
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Log Out</button>
      {metrics.length === 0 ? (
        <div>No metrics found.</div>
      ) : (
        metrics.map((m, index) => (
          <div key={index}>
            {m.name}: {m.value}
          </div>
        ))
      )}
    </div>
  );
}
