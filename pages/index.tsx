import Link from "next/link";
import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";

export default function Landing() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Optional: avoid flashing landing page
  if (loading || user) return null;

  return (
    <div>
      <h1>Welcome to Prelapp</h1>
      <p>Track your readiness metrics and Strava runs.</p>
      <Link href="/login">Login</Link> |{" "}
      <Link href="/signup">Create Account</Link>
    </div>
  );
}
