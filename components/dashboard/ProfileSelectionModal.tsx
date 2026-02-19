// components/ProfileSelectionModal.tsx
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EVENT_TYPE_CONFIG } from '../../config/profiles';

interface ProfileSelectionModalProps {
  userId: string;
  onComplete: () => void;
}

export default function ProfileSelectionModal({ userId, onComplete }: ProfileSelectionModalProps) {
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleProfile = (value: string) => {
    setSelectedProfiles(prev => 
      prev.includes(value)
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
    setError(null);
  };

  const handleSubmit = async () => {
    if (selectedProfiles.length === 0) {
      setError('Please select at least one profile');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ event_types: selectedProfiles })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update sessionStorage
      const cachedProfile = sessionStorage.getItem('userProfile');
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);
        profile.event_types = selectedProfiles;
        sessionStorage.setItem('userProfile', JSON.stringify(profile));
      }

      onComplete();
    } catch (err) {
      console.error('Error updating profiles:', err);
      setError('Failed to save profiles. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content profile-modal">
        <div className="main-heading">
          <h1>Which profile best suits you?</h1>
          <h3>Select all that apply...</h3>
        </div>

        <div className="profile-options">
          {EVENT_TYPE_CONFIG.map(option => (
            <div 
              key={option.value}
              className="profile-option"
              onClick={() => handleToggleProfile(option.value)}
            >
              <div className="profile-checkbox">
                <input
                  type="checkbox"
                  checked={selectedProfiles.includes(option.value)}
                  onChange={() => handleToggleProfile(option.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="profile-info">
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="profile-error">
            {error}
          </div>
        )}

        <div className="profile-modal-footer">
          <p>Selections may be updated in settings.</p>
          <button 
            className="profile-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedProfiles.length === 0}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}