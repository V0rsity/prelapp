// pages/help.tsx
import fs from 'fs';
import path from 'path';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile } from '@/types/models';
import TopBar from '../components/TopBar';

type FaqItem = { question: string; answer: string };
type FaqSection = { category: string; items: FaqItem[] };

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'content', 'faq.md');
  const raw = fs.readFileSync(filePath, 'utf8');

  // Slice to the first ## section, skipping any top-level # heading
  const firstSection = raw.indexOf('\n## ');
  const body = firstSection >= 0 ? raw.slice(firstSection) : raw;

  const sections: FaqSection[] = body
    .split(/\n## /)
    .filter(s => s.trim())
    .map(block => {
      const lines = block.split('\n');
      const category = lines[0].trim();
      const rest = lines.slice(1).join('\n');
      const items: FaqItem[] = rest
        .split(/\n### /)
        .filter(s => s.trim())
        .map(chunk => {
          const chunkLines = chunk.split('\n');
          const question = chunkLines[0].trim();
          const answer = chunkLines.slice(1).join('\n').replace(/\n---\s*$/, '').trim();
          return { question, answer };
        })
        .filter(item => item.question);
      return { category, items };
    })
    .filter(section => section.category && section.items.length > 0);

  return { props: { sections } };
}

export default function Help({ sections }: { sections: FaqSection[] }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  const [openItem, setOpenItem] = useState<string | null>(null);

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
      const res = await fetch('/api/help', {
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
      <TopBar currentPage="help" />

      <div className="main-content">
        <div className="main-container">
          <div className="main-heading">
            <h1>Help &amp; FAQ</h1>
          </div>
          {sections.map((section, si) => (
            <div key={si} style={{ marginBottom: '1.25rem' }}>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.5rem',
                paddingLeft: '0.25rem',
              }}>
                {section.category}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {section.items.map((item, ii) => {
                  const key = `${si}-${ii}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={ii} style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                    }}>
                      <button
                        onClick={() => setOpenItem(isOpen ? null : key)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.875rem 1rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'white',
                          textAlign: 'left',
                          gap: '0.75rem',
                        }}
                      >
                        <span style={{ fontWeight: '600', fontSize: '0.95rem', lineHeight: '1.4' }}>
                          {item.question}
                        </span>
                        {isOpen
                          ? <ChevronUp size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
                          : <ChevronDown size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
                        }
                      </button>
                      {isOpen && (
                        <div style={{
                          padding: '0 1rem 0.875rem',
                          color: 'rgba(255,255,255,0.75)',
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                        }}>
                          <ReactMarkdown>{item.answer}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="main-container">
          <div className="main-heading">
            <h1>Still need help?</h1>
            <h3>Send us a message and we'll get back to you by email.</h3>
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
                  Message sent!
                </p>
                <p style={{ color: 'rgba(134, 239, 172, 0.75)', fontSize: '0.875rem' }}>
                  We&apos;ll get back to you by email as soon as possible.
                </p>
              </div>
              {user && (
                <div className="button-group">
                  <button
                    className="submit-button next-button"
                    onClick={() => router.push('/dashboard')}
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
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
                <label className="auth-label">Message</label>
                <textarea
                  className="auth-input"
                  placeholder="What do you need help with?"
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
                  {isSubmitting ? 'Sending...' : 'Send Message'}
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
