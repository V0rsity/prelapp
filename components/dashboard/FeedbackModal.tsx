// components/dashboard/FeedbackModal.tsx
import { useState, useEffect } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  feedbackType?: string;
  context?: string;
  title?: string;
  subtitle?: string;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  userProfile,
  feedbackType,
  context,
  title = 'Share Feedback',
  subtitle = "Please let us know what to add! Your feedback helps us improve!",
}: FeedbackModalProps) {
  const placeholder = context
    ? `What ${context} metric could make Prelapp better?`
    : "What metric or feature could make Prelapp better?";
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setMessage('');
    setSubmitted(false);
    setSubmitError(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const name = `${userProfile.first_name} ${userProfile.last_name}`;
      const email = userProfile.email;
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          user_id: userProfile.id,
          ...(feedbackType && { feedback_type: feedbackType }),
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="main-container feedback-modal">
          <div className="main-heading">
            <h1>{title}</h1>
            <h3>{subtitle}</h3>
          </div>

          {submitted ? (
            <div style={{ padding: '0 0 1rem' }}>
              <div style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                borderRadius: '0.5rem',
                padding: '1.25rem',
                textAlign: 'center',
                marginTop: '1rem',
                marginBottom: '1rem',
              }}>
                <p style={{ color: '#86efac', fontWeight: '600', fontSize: '1rem', marginBottom: '0.375rem' }}>
                  Feedback sent successfully!
                </p>
                <p style={{ color: 'rgba(134, 239, 172, 0.75)', fontSize: '0.875rem' }}>
                  Thanks for sharing! We will notify you by email once this request is complete!
                </p>
              </div>
              <div className="button-group">
                <button className="submit-button next-button" onClick={handleClose}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: '0 0 0' }}>
              <div className="notes-container">
                <textarea
                  className="notes-textarea"
                  placeholder={placeholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  style={{ resize: 'vertical', minHeight: '7rem' }}
                />
              </div>

              {submitError && (
                <p style={{
                  textAlign: 'center',
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}>
                  Message failed to send. Please try again.
                </p>
              )}

              <div className="button-group">
                <button
                  type="submit"
                  className="submit-button next-button"
                  disabled={isSubmitting || !message.trim()}
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
