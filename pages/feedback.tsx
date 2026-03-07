// pages/feedback.tsx
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile } from '@/types/models';
import TopBar from '../components/TopBar';

export default function Feedback() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const cached = sessionStorage.getItem('userProfile');
    if (cached) {
      const profile: UserProfile = JSON.parse(cached);
      setName(`${profile.first_name} ${profile.last_name}`);
      setEmail(profile.email);
      return;
    }
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(`${data.first_name} ${data.last_name}`);
          setEmail(data.email);
        }
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, user_id: user?.id }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="dashboard-wrapper additional-page">
      <TopBar currentPage="feedback" />

      <div className="main-content">
        <div className="main-container">
          <div className="main-heading">
            <h1>Share Feedback</h1>
            <h3>Please let us know what to add! Your feedback helps us improve!</h3>
          </div>

          {submitted ? (
            <div className="auth-form">
              <div style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                borderRadius: '0.5rem',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
              }}>
                <p style={{ color: '#86efac', fontWeight: '600', fontSize: '1rem', marginBottom: '0.375rem' }}>
                  Feedback sent successfully!
                </p>
                <p style={{ color: 'rgba(134, 239, 172, 0.75)', fontSize: '0.875rem' }}>
                  Thanks for sharing! We will notify you by email once this request is complete!
                </p>
              </div>
              <div className="button-group">
                <button
                  className="submit-button next-button"
                  onClick={() => router.push('/dashboard')}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">Name</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">Feedback</label>
                <textarea
                  className="auth-input"
                  placeholder="What's on your mind?"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>

              <p style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.825rem',
                marginTop: '0.25rem',
                paddingBottom: '0.5rem',
              }}>
                or reach us directly at{' '}
                <a
                  href="mailto:prelappsports@gmail.com"
                  style={{ color: '#BDDDFC', textDecoration: 'underline' }}
                >
                  prelappsports@gmail.com
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
