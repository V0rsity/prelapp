// pages/settings.tsx
import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile } from '@/types/models';
import { EVENT_TYPE_CONFIG, getEventTypeTitle } from '../config/profiles';
import { TIMEZONE_CONFIG, getTimezoneLabel } from '../config/timezones';

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
                {TIMEZONE_CONFIG.map(group => (
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
            {EVENT_TYPE_CONFIG.map(option => (
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

// ─── Delete Account Modal ──────────────────────────────────────────────────────

const DELETE_WORD = 'DELETE';

function DeleteAccountModal({ userId, onClose }: {
  userId: string;
  onClose: () => void;
}) {
  useBodyLock();
  const router = useRouter();
  const [chars, setChars] = useState<string[]>(Array(DELETE_WORD.length).fill(''));
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isComplete = chars.join('') === DELETE_WORD;

  const handleChange = (index: number, value: string) => {
    const char = value.slice(-1).toUpperCase().replace(/[^A-Z]/g, '');
    const newChars = [...chars];
    newChars[index] = char;
    setChars(newChars);
    if (char && index < DELETE_WORD.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[index]) {
        const newChars = [...chars];
        newChars[index] = '';
        setChars(newChars);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await supabase.from('daily_logs').delete().eq('user_id', userId);
      await supabase.from('users').delete().eq('id', userId);
      sessionStorage.removeItem('userProfile');
      sessionStorage.removeItem('dailyLogs');
      await supabase.auth.signOut();
      router.push('/');
    } catch {
      setError('Failed to delete account. Please try again.');
      setIsDeleting(false);
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
            <h1>Delete Account</h1>
            <h3>This is permanent and cannot be undone. Type DELETE to confirm.</h3>
          </div>
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            padding: '0.875rem 1rem',
            marginBottom: '0.25rem',
          }}>
            <p style={{ color: '#fca5a5', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.375rem', letterSpacing: '0.02em' }}>
              The following will be permanently deleted:
            </p>
            <ul style={{ color: 'rgba(252, 165, 165, 0.85)', fontSize: '0.78rem', paddingLeft: '1.1rem', margin: 0, lineHeight: '1.7' }}>
              <li>Your account and profile information</li>
              <li>All daily readiness logs</li>
              <li>All training and recovery records</li>
            </ul>
          </div>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1.25rem 0 0.625rem' }}>
            Type 'DELETE' to confirm
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
            {Array.from(DELETE_WORD).map((letter, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={2}
                value={chars[i]}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: '2.5rem',
                  height: '2.75rem',
                  textAlign: 'center',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  border: '2px solid',
                  borderColor: chars[i]
                    ? chars[i] === letter ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                    : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  background: chars[i]
                    ? chars[i] === letter ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(0, 0, 0, 0.2)',
                  color: 'white',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              />
            ))}
          </div>
          {error && <div className="profile-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
          {isComplete && (
            <div className="button-group">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  width: '100%',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          )}
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const anyModalOpen = showNameModal || showTimezoneModal || showProfilesModal || showDeleteModal;

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
                      ? userProfile.event_types.map(getEventTypeTitle).join(', ')
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

              {/* Delete Account */}
              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="settings-row-label">Account Status</span>
                  <span className="settings-row-value">&#10003; Active</span>
                </div>
                <button
                  className="settings-edit-btn"
                  onClick={() => setShowDeleteModal(true)}
                  style={{ background: '#ef4444', color: '#ffffff' }}
                >
                  Delete
                </button>
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
      {showDeleteModal && user && (
        <DeleteAccountModal
          userId={user.id}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}