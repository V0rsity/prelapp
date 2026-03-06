// pages/signup.tsx
import { useState, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import Image from "next/image";
import { AIRTABLE_USERS_FIELDS as AT } from "../config/airtable";

const ENGLISH_TIMEZONES = [
  {
    group: "United States",
    zones: [
      { label: "Eastern Time (ET) — New York", value: "America/New_York" },
      { label: "Central Time (CT) — Chicago", value: "America/Chicago" },
      { label: "Mountain Time (MT) — Denver", value: "America/Denver" },
      { label: "Pacific Time (PT) — Los Angeles", value: "America/Los_Angeles" },
      { label: "Alaska Time — Anchorage", value: "America/Anchorage" },
      { label: "Hawaii Time — Honolulu", value: "Pacific/Honolulu" },
    ],
  },
  {
    group: "Canada",
    zones: [
      { label: "Atlantic Time (AT) — Halifax", value: "America/Halifax" },
      { label: "Eastern Time (ET) — Toronto", value: "America/Toronto" },
      { label: "Central Time (CT) — Winnipeg", value: "America/Winnipeg" },
      { label: "Mountain Time (MT) — Edmonton", value: "America/Edmonton" },
      { label: "Pacific Time (PT) — Vancouver", value: "America/Vancouver" },
    ],
  },
  {
    group: "United Kingdom & Ireland",
    zones: [
      { label: "London (GMT/BST)", value: "Europe/London" },
      { label: "Dublin (GMT/IST)", value: "Europe/Dublin" },
    ],
  },
  {
    group: "Australia",
    zones: [
      { label: "Perth (AWST)", value: "Australia/Perth" },
      { label: "Darwin (ACST)", value: "Australia/Darwin" },
      { label: "Adelaide (ACST/ACDT)", value: "Australia/Adelaide" },
      { label: "Brisbane (AEST)", value: "Australia/Brisbane" },
      { label: "Sydney / Melbourne (AEST/AEDT)", value: "Australia/Sydney" },
    ],
  },
  {
    group: "New Zealand",
    zones: [
      { label: "Auckland (NZST/NZDT)", value: "Pacific/Auckland" },
    ],
  },
  {
    group: "Africa",
    zones: [
      { label: "Accra / Abuja (GMT/WAT)", value: "Africa/Lagos" },
      { label: "Nairobi (EAT)", value: "Africa/Nairobi" },
      { label: "Johannesburg (SAST)", value: "Africa/Johannesburg" },
    ],
  },
  {
    group: "Asia & Pacific",
    zones: [
      { label: "Mumbai / New Delhi (IST)", value: "Asia/Kolkata" },
      { label: "Karachi (PKT)", value: "Asia/Karachi" },
      { label: "Kuala Lumpur (MYT)", value: "Asia/Kuala_Lumpur" },
      { label: "Singapore (SGT)", value: "Asia/Singapore" },
      { label: "Manila (PHT)", value: "Asia/Manila" },
    ],
  },
  {
    group: "Caribbean",
    zones: [
      { label: "Jamaica (EST)", value: "America/Jamaica" },
      { label: "Port of Spain (AST)", value: "America/Port_of_Spain" },
    ],
  },
];

function getDefaultTimezone(): string {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  for (const group of ENGLISH_TIMEZONES) {
    for (const zone of group.zones) {
      if (zone.value === detected) return detected;
    }
  }
  return "America/New_York";
}

export default function Signup() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState(getDefaultTimezone);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const timezoneRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  useEffect(() => {
    document.documentElement.classList.add('auth-bg');
    return () => document.documentElement.classList.remove('auth-bg');
  }, []);

  const showConfirmPassword = password.length > 0;

  const validate = (): boolean => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword || !timezone) {
      setError("All fields are required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed.");

      const { error: dbError } = await supabase
        .from("users")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          timezone,
        })
        .eq("id", authData.user.id);

      if (dbError) throw dbError;

      fetch('/api/airtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            [AT.supabaseId]: authData.user.id,
            [AT.name]:       `${firstName.trim()} ${lastName.trim()}`,
            [AT.email]:      email,
            [AT.timezone]:   timezone,
          },
        }),
      }).catch(() => {});

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const focusNext = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.focus();
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
            <h1>Create Account</h1>
            <h3>Training Logs have never been easier for Track & Field Athletes!</h3>
          </div>

          <div className="auth-form">
            {error && <div className="profile-error">{error}</div>}

            <div className="auth-row-2col">
              <div className="auth-field">
                <label className="auth-label">First Name</label>
                <input
                  className="auth-input"
                  type="text"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  tabIndex={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); focusNext(lastNameRef); }
                  }}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Last Name</label>
                <input
                  className="auth-input"
                  type="text"
                  autoComplete="family-name"
                  ref={lastNameRef}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  tabIndex={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); focusNext(emailRef); }
                  }}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                autoComplete="email"
                ref={emailRef}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                tabIndex={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); focusNext(passwordRef); }
                }}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                autoComplete="new-password"
                ref={passwordRef}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                tabIndex={4}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (showConfirmPassword) {
                      focusNext(confirmPasswordRef);
                    } else {
                      focusNext(timezoneRef);
                    }
                  }
                }}
              />
            </div>

            {showConfirmPassword && (
              <div className="auth-field auth-field-slide-in">
                <label className="auth-label">Confirm Password</label>
                <input
                  className="auth-input"
                  type="password"
                  autoComplete="new-password"
                  ref={confirmPasswordRef}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  tabIndex={5}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); focusNext(timezoneRef); }
                  }}
                />
              </div>
            )}

            <div className="auth-field-spaced">
              <label className="auth-label">Timezone</label>
              <select
                className="auth-input auth-select"
                ref={timezoneRef}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                tabIndex={6}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleSignup(); }
                }}
              >
                {ENGLISH_TIMEZONES.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.zones.map((zone) => (
                      <option key={zone.value} value={zone.value}>
                        {zone.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="auth-terms-card">
              <label className="auth-terms-row">
                <span className="auth-terms-agree">
                  I agree to Prelapp&apos;s Terms and Conditions
                </span>
                <input
                  type="checkbox"
                  className="auth-terms-checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  tabIndex={7}
                />
              </label>
              <p className="auth-terms-read">
                Read the Terms and Conditions{" "}
                <Link href="/terms" className="auth-terms-link" target="_blank" rel="noopener noreferrer">here</Link>
              </p>
            </div>

            <div className="auth-submit-row">
              <button
                className="create-account profile-submit-btn"
                onClick={handleSignup}
                disabled={!agreedToTerms || loading}
                tabIndex={8}
              >
                {loading ? "Optimizing..." : "Optimize this season!"}
              </button>
            </div>

            <p className="auth-footer">
              Already have an account? Login{" "}
              <Link href="/login">here</Link>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}