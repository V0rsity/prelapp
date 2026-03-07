import Link from "next/link";
import Image from "next/image";
import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import {
  Sun,
  Dumbbell,
  Activity,
  BarChart2,
  TrendingUp,
  Calendar,
  User,
  ClipboardList,
  ChevronDown,
} from "lucide-react";

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const FEATURES = [
  {
    label: "Pre-Session Check-In",
    title: "Daily Readiness Check-In",
    body: "Rate sleep, energy, stress, hydration, and muscle soreness before you hit the track. Takes under 60 seconds and gives you a clear readiness score before every session.",
    image: "/images/screenshots/morning-checkin.PNG",
    icon: Sun,
  },
  {
    label: "Training",
    title: "Log Your Training",
    body: "Log intensity, training types, muscle groups, and mileage after every session. Tailored to your event — distance runners, jumpers, throwers, and more.",
    image: "/images/screenshots/training-log.PNG",
    icon: Dumbbell,
  },
  {
    label: "Recovery",
    title: "Recovery Tracking",
    body: "Track cooldowns, stretching, nutrition, ice baths, and more. Know what recovery activities you're actually doing — and which ones move the needle.",
    image: "/images/screenshots/recovery-log.PNG",
    icon: Activity,
  },
  {
    label: "Readiness Score",
    title: "Your Daily Readiness Score",
    body: "A single weighted score synthesizes your check-in data into an at-a-glance readiness indicator. Color-coded from red to green so you never guess how ready you are.",
    image: "/images/screenshots/readiness-score.PNG",
    icon: BarChart2,
  },
  {
    label: "Analytics",
    title: "Trend Analytics",
    body: "Bar charts, best-fit trend lines, and dual-metric comparisons reveal patterns across weeks and months. See how intensity correlates with soreness or how sleep affects energy.",
    image: "/images/screenshots/trends.PNG",
    icon: TrendingUp,
  },
  {
    label: "Habits",
    title: "Habit Tracker",
    body: "A multi-colored 30-day calendar for any metric you choose. Spot streaks, identify gaps, and visualize your consistency day by day across the entire season.",
    image: "/images/screenshots/stretching-habit-tracker.PNG",
    icon: Calendar,
  },
];

const HOW_IT_WORKS = [
  {
    number: "01",
    icon: User,
    title: "Build Your Profile",
    body: "Select your event types — runner, jumper, thrower, hurdler, or pole vaulter. Your metrics and training options are tailored to you.",
  },
  {
    number: "02",
    icon: Sun,
    title: "Log How You Feel",
    body: "Before each session, complete a quick check-in. Sleep, energy, stress, hydration, nutrition, and soreness — all in one place.",
  },
  {
    number: "03",
    icon: ClipboardList,
    title: "Track Training & Recovery",
    body: "After practice, log what you did and how you recovered. Intensity, types, muscles, mileage, and recovery activities.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Monitor Your Trends",
    body: "Weekly and monthly charts reveal patterns that are invisible day-to-day. Optimize your training load and peak when it counts.",
  },
];

export default function Landing() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.add('landing');
    return () => document.documentElement.classList.remove('landing');
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || user) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, user]);

  if (loading || user) return null;

  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="landing-navbar">
        <div className="landing-logo">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ display: 'flex', alignItems: 'center', gap: 'inherit', textDecoration: 'none', color: 'inherit' }}>
            <Image src="/images/Logo-Mobile.png" alt="Prelapp" width={40} height={40} className="landing-logo-icon" />
            Prelapp
          </a>
        </div>
        <div className="landing-nav-links">
          <Link href="/login" className="landing-nav-login">
            Log in
          </Link>
          <Link href="/signup" className="landing-nav-cta">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        {/* Desktop track: 9 lane boundaries spanning full 1440px width */}
        <svg
          className="hero-track hero-track-desktop"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[0, 180, 360, 540, 720, 900, 1080, 1260, 1440].map((x) => (
            <path
              key={x}
              d={`M ${x} 900 C ${x} 600 ${x + 150} 300 ${x + 500} 0`}
              fill="none"
              stroke="rgba(189,221,252,0.18)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {/* Mobile track: proportioned for a ~430px wide portrait viewport */}
        <svg
          className="hero-track hero-track-mobile"
          viewBox="0 0 430 900"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[0, 86, 172, 258, 344, 430].map((x) => (
            <path
              key={x}
              d={`M ${x} 900 C ${x} 600 ${x + 50} 300 ${x + 150} 0`}
              fill="none"
              stroke="rgba(189,221,252,0.18)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="hero-content">
          <div className="hero-text reveal">
            <span className="hero-badge">Built for Track &amp; Field Athletes</span>
            <h1 className="hero-headline">
              Own your training.<br />Optimize this season.
            </h1>
            <p className="hero-subheadline">
              Prelapp helps track and field athletes monitor recovery, log
              training, and spot trends that move the needle.
            </p>
            <Link href="/signup" className="hero-cta-btn">
              Take control of your season
            </Link>
          </div>
          <div className="hero-image-wrap reveal">
            <div className="hero-device-frame">
              <Image
                src="/images/screenshots/hero.PNG"
                alt="Prelapp dashboard"
                width={280}
                height={560}
                className="hero-screenshot"
                priority
              />
            </div>
          </div>
        </div>
        <a href="#features" className="hero-scroll-indicator" aria-label="Scroll to features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <ChevronDown size={28} color="rgba(255,255,255,0.45)" />
        </a>
      </section>

      {/* ── Features ── */}
      <div id="features">
        {FEATURES.map((feature, i) => {
          const isReversed = i % 2 === 1;
          return (
            <section
              key={feature.title}
              className={`feature-section ${isReversed ? "feature-reversed" : ""}`}
            >
              <div className="feature-inner">
                <div className="feature-image-col reveal">
                  <div className="feature-device-frame">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={240}
                      height={480}
                      className="feature-screenshot"
                    />
                  </div>
                </div>
                <div className="feature-text-col reveal">
                  <span className="feature-label">{feature.label}</span>
                  <h2 className="feature-title">{feature.title}</h2>
                  <p className="feature-body">{feature.body}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── How It Works ── */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="how-it-works-inner">
          <div className="section-header reveal">
            <span className="section-overline">Simple by design</span>
            <h2 className="section-title">How it works</h2>
          </div>
          <div className="steps-grid">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="step-card reveal">
                  <div className="step-number">{step.number}</div>
                  <div className="step-icon-wrap">
                    <Icon size={22} color="#384959" />
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-body">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="reveal">
          <h2 className="cta-banner-title">Ready to train smarter?</h2>
          <p className="cta-banner-sub">
            Join athletes who track their readiness and recover with purpose.
          </p>
          <Link href="/signup" className="cta-banner-btn">
            Create your free account
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">Prelapp</span>
            <p className="footer-tagline">
              Recovery and readiness tracking for track and field athletes.
            </p>
          </div>
          <div className="footer-links-grid">
            <div className="footer-col">
              <h4 className="footer-col-title">Product</h4>
              <a href="#features" className="footer-link">Features</a>
              <a href="#how-it-works" className="footer-link">How It Works</a>
              <Link href="/signup" className="footer-link">Get Started</Link>
              <Link href="/help" className="footer-link">Help &amp; FAQ</Link>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Company</h4>
              <Link href="/feedback" className="footer-link">Contact &amp; Feedback</Link>
              <a
                href="https://www.instagram.com/prelapp/"
                className="footer-link footer-link-icon"
                target="_blank"
                rel="noopener noreferrer"
              >
                <InstagramIcon />
                Instagram
              </a>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Legal</h4>
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="footer-link">Terms & Conditions</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Prelapp. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
