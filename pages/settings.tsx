// pages/settings.tsx
import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile } from '@/types/models';

// ─── Timezone Data ─────────────────────────────────────────────────────────────

const ENGLISH_TIMEZONES = [
  {
    group: 'United States',
    zones: [
      { label: 'Eastern Time (ET) — New York', value: 'America/New_York' },
      { label: 'Central Time (CT) — Chicago', value: 'America/Chicago' },
      { label: 'Mountain Time (MT) — Denver', value: 'America/Denver' },
      { label: 'Pacific Time (PT) — Los Angeles', value: 'America/Los_Angeles' },
      { label: 'Alaska Time — Anchorage', value: 'America/Anchorage' },
      { label: 'Hawaii Time — Honolulu', value: 'Pacific/Honolulu' },
    ],
  },
  {
    group: 'Canada',
    zones: [
      { label: 'Atlantic Time (AT) — Halifax', value: 'America/Halifax' },
      { label: 'Eastern Time (ET) — Toronto', value: 'America/Toronto' },
      { label: 'Central Time (CT) — Winnipeg', value: 'America/Winnipeg' },
      { label: 'Mountain Time (MT) — Edmonton', value: 'America/Edmonton' },
      { label: 'Pacific Time (PT) — Vancouver', value: 'America/Vancouver' },
    ],
  },
  {
    group: 'United Kingdom & Ireland',
    zones: [
      { label: 'London (GMT/BST)', value: 'Europe/London' },
      { label: 'Dublin (GMT/IST)', value: 'Europe/Dublin' },
    ],
  },
  {
    group: 'Australia',
    zones: [
      { label: 'Perth (AWST)', value: 'Australia/Perth' },
      { label: 'Darwin (ACST)', value: 'Australia/Darwin' },
      { label: 'Adelaide (ACST/ACDT)', value: 'Australia/Adelaide' },
      { label: 'Brisbane (AEST)', value: 'Australia/Brisbane' },
      { label: 'Sydney / Melbourne (AEST/AEDT)', value: 'Australia/Sydney' },
    ],
  },
  {
    group: 'New Zealand',
    zones: [
      { label: 'Auckland (NZST/NZDT)', value: 'Pacific/Auckland' },
    ],
  },
  {
    group: 'Africa',
    zones: [
      { label: 'Accra / Abuja (GMT/WAT)', value: 'Africa/Lagos' },
      { label: 'Nairobi (EAT)', value: 'Africa/Nairobi' },
      { label: 'Johannesburg (SAST)', value: 'Africa/Johannesburg' },
    ],
  },
  {
    group: 'Asia & Pacific',
    zones: [
      { label: 'Mumbai / New Delhi (IST)', value: 'Asia/Kolkata' },
      { label: 'Karachi (PKT)', value: 'Asia/Karachi' },
      { label: 'Kuala Lumpur (MYT)', value: 'Asia/Kuala_Lumpur' },
      { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
      { label: 'Manila (PHT)', value: 'Asia/Manila' },
    ],
  },
  {
    group: 'Caribbean',
    zones: [
      { label: 'Jamaica (EST)', value: 'America/Jamaica' },
      { label: 'Port of Spain (AST)', value: 'America/Port_of_Spain' },
    ],
  },
];

// ─── Profile Options ───────────────────────────────────────────────────────────

const PROFILE_OPTIONS = [
  { value: 'runner', title: 'Runner', description: 'Distance and sprint events (100m-10000m), Cross Country' },
  { value: 'jumper', title: 'Jumper', description: 'Long jump, high jump, triple jump' },
  { value: 'thrower', title: 'Thrower', description: 'Shot put, discus, javelin, hammer' },
  { value: 'hurdler', title: 'Hurdler', description: '100m/110m hurdles, 300m hurdles' },
  { value: 'pole_vaulter', title: 'Pole Vaulter', description: 'Pole vault events' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTimezoneLabel(value: string): string {
  for (const group of ENGLISH_TIMEZONES) {
    for (const zone of group.zones) {
      if (zone.value === value) return zone.label;
    }
  }
  return value;
}

function formatEventType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function useBodyLock() {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);
}

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ─── Edit Name Modal ───────────────────────────────────────────────────────────

function EditNameModal({ userProfile, onClose, onSave }: {
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => void;
}) {
  useBodyLock();
  const [firstName, setFirstName] = useState(userProfile.first_name);
  const [lastName, setLastName] = useState(userProfile.last_name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    if (firstName.trim() === userProfile.first_name && lastName.trim() === userProfile.last_name) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ first_name: firstName.trim(), last_name: lastName.trim() })
        .eq('id', userProfile.id);
      if (updateError) throw updateError;
      onSave({ first_name: firstName.trim(), last_name: lastName.trim() });
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>
        <div className="main-container">
          <div className="main-heading">
            <h1>Edit Name</h1>
            <h3>Update your first and last name.</h3>
          </div>
          <div className="auth-form">
            <div className="auth-row-2col">
              <div className="auth-field">
                <label className="auth-label">First Name</label>
                <input
                  className="auth-input"
                  type="text"
                  value={firstName}
                  onChange={e => { setFirstName(e.target.value); setError(null); }}
                  autoComplete="given-name"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Last Name</label>
                <input
                  className="auth-input"
                  type="text"
                  value={lastName}
                  onChange={e => { setLastName(e.target.value); setError(null); }}
                  autoComplete="family-name"
                />
              </div>
            </div>
            {error && <div className="profile-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
            <div className="button-group">
              <button
                className="submit-button next-button"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Timezone Modal ───────────────────────────────────────────────────────

function EditTimezoneModal({ userProfile, onClose, onSave }: {
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => void;
}) {
  useBodyLock();
  const [timezone, setTimezone] = useState(userProfile.timezone);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (timezone === userProfile.timezone) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ timezone })
        .eq('id', userProfile.id);
      if (updateError) throw updateError;
      onSave({ timezone });
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>
        <div className="main-container">
          <div className="main-heading">
            <h1>Edit Timezone</h1>
            <h3>Update your local timezone.</h3>
          </div>
          <div className="auth-form">
            <div className="auth-field-spaced">
              <label className="auth-label">Timezone</label>
              <select
                className="auth-input auth-select"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
              >
                {ENGLISH_TIMEZONES.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.zones.map(zone => (
                      <option key={zone.value} value={zone.value}>{zone.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {error && <div className="profile-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
            <div className="button-group">
              <button
                className="submit-button next-button"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Profiles Modal ───────────────────────────────────────────────────────

function EditProfilesModal({ userProfile, onClose, onSave }: {
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => void;
}) {
  useBodyLock();
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(userProfile.event_types || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (value: string) => {
    setSelectedProfiles(prev =>
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
    setError(null);
  };

  const handleSave = async () => {
    if (selectedProfiles.length === 0) {
      setError('Please select at least one profile.');
      return;
    }
    if ([...selectedProfiles].sort().join() === [...(userProfile.event_types || [])].sort().join()) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ event_types: selectedProfiles })
        .eq('id', userProfile.id);
      if (updateError) throw updateError;
      onSave({ event_types: selectedProfiles });
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <CloseIcon />
        </button>
        <div className="main-container">
          <div className="main-heading">
            <h1>Athlete Profiles</h1>
            <h3>Select all that apply...</h3>
          </div>
          <div className="profile-options">
            {PROFILE_OPTIONS.map(option => (
              <div
                key={option.value}
                className="profile-option"
                onClick={() => handleToggle(option.value)}
              >
                <div className="profile-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedProfiles.includes(option.value)}
                    onChange={() => handleToggle(option.value)}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="profile-info">
                  <h3>{option.title}</h3>
                  <p>{option.description}</p>
                </div>
              </div>
            ))}
          </div>
          {error && <div className="profile-error">{error}</div>}
          <div className="button-group">
            <button
              className="submit-button next-button"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────────────────────

export default function Settings() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    const cached = sessionStorage.getItem('userProfile');
    if (cached) {
      setUserProfile(JSON.parse(cached));
      setDataLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (!error && data) {
        setUserProfile(data);
        sessionStorage.setItem('userProfile', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleLogout = async () => {
    sessionStorage.removeItem('userProfile');
    sessionStorage.removeItem('dailyLogs');
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...updates } as UserProfile;
    setUserProfile(updated);
    sessionStorage.setItem('userProfile', JSON.stringify(updated));
  };

  const anyModalOpen = showNameModal || showTimezoneModal || showProfilesModal;

  return (
    <div className={`settings dashboard-wrapper auth-page${anyModalOpen ? ' modal-active' : ''}`}>
      <div id="topbar">
        <img src="/images/Logo-Mobile.png" alt="Logo" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard')} />
        <div className="menu-container" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical size={36} />
          </button>
          {showMenu && (
            <div className="popup-menu">
              <button onClick={handleLogout}><p>Logout</p></button>
              <button><p>Help & FAQ</p></button>
              <button><p>Contact Us</p></button>
            </div>
          )}
        </div>
      </div>

      {dataLoading ? (
        <div className="loading-content" />
      ) : (
        <div className="main-content">
          <div className="main-container">
            <div className="main-heading">
              <h1>Settings</h1>
              <h3>Manage your account preferences.</h3>
            </div>

            <div className="settings-list">
              {/* Name */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="settings-row-label">Name</span>
                  <span className="settings-row-value">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </span>
                </div>
                <button className="settings-edit-btn" onClick={() => setShowNameModal(true)}>
                  Edit
                </button>
              </div>

              {/* Timezone */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="settings-row-label">Timezone</span>
                  <span className="settings-row-value">
                    {getTimezoneLabel(userProfile?.timezone ?? '')}
                  </span>
                </div>
                <button className="settings-edit-btn" onClick={() => setShowTimezoneModal(true)}>
                  Edit
                </button>
              </div>

              {/* Athlete Profiles */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="settings-row-label">Athlete Profiles</span>
                  <span className="settings-row-value">
                    {userProfile?.event_types?.length
                      ? userProfile.event_types.map(formatEventType).join(', ')
                      : 'None selected'}
                  </span>
                </div>
                <button className="settings-edit-btn" onClick={() => setShowProfilesModal(true)}>
                  Edit
                </button>
              </div>

              {/* Terms & Conditions */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="settings-row-label">Terms & Conditions</span>
                  <span className="settings-row-value">&#10003; Accepted</span>
                </div>
                <Link
                  href="/terms"
                  className="settings-edit-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem' }}>
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  background: '#efbf04',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.625rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showNameModal && userProfile && (
        <EditNameModal
          userProfile={userProfile}
          onClose={() => setShowNameModal(false)}
          onSave={updates => { handleProfileUpdate(updates); setShowNameModal(false); }}
        />
      )}
      {showTimezoneModal && userProfile && (
        <EditTimezoneModal
          userProfile={userProfile}
          onClose={() => setShowTimezoneModal(false)}
          onSave={updates => { handleProfileUpdate(updates); setShowTimezoneModal(false); }}
        />
      )}
      {showProfilesModal && userProfile && (
        <EditProfilesModal
          userProfile={userProfile}
          onClose={() => setShowProfilesModal(false)}
          onSave={updates => { handleProfileUpdate(updates); setShowProfilesModal(false); }}
        />
      )}
    </div>
  );
}