// pages/login.tsx
import { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  useEffect(() => {
    document.documentElement.classList.add('auth-bg');
    return () => document.documentElement.classList.remove('auth-bg');
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="dashboard-wrapper auth-page">
      <nav className="landing-navbar">
        <Link href="/" className="landing-logo">
          <Image src="/images/Logo-Mobile.png" alt="Prelapp" width={40} height={40} className="landing-logo-icon" />
          Prelapp
        </Link>
        <div className="landing-nav-links">
          <Link href="/login" className="landing-nav-login">
            Log in
          </Link>
          <Link href="/signup" className="landing-nav-cta">
            Get started
          </Link>
        </div>
      </nav>

      <div className="main-content">
        <div className="main-container">
          <div className="main-heading">
            <h1>Login to Prelapp</h1>
            <h3>Keep tracking your progress!</h3>
          </div>

          <div className="auth-form">
            {error && (
              <div className="profile-error">{error}</div>
            )}

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    passwordRef.current?.focus();
                  }
                }}
              />
            </div>

            <div className="auth-field-spaced">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="auth-submit-row">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="profile-submit-btn"
              >
                {loading ? "Logging in..." : "Login!"}
              </button>
            </div>

            <p className="auth-footer">
              Don&apos;t have an account? Create one{" "}
              <Link href="/signup">here</Link>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
